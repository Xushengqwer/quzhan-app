// src/store/userStore.ts
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {
    // 移除了未使用的 ApiError
    type docs_SwaggerAPIMyAccountDetailResponse,
    OpenAPI as UserHubOpenAPI,
    ProfileManagementService,
    type vo_MyAccountDetailVO,
    type vo_UserWithProfileVO,
} from '@/generated-api/user-hub';
import {getAccessToken, removeAccessToken, setAccessToken,} from '@/utils/tokenManager';
import {OpenAPI as PostServiceOpenAPI} from "@/generated-api/post-service";
import {OpenAPI as PostSearchOpenAPI} from "@/generated-api/post-search";

export type User = vo_UserWithProfileVO;

interface UserState {
    user: User | null;
    token: string | null;
    initialized: boolean;
    setUserAndToken: (user: User | null, token?: string | null) => void;
    clearUserSession: () => void;
    setInitialized: (status: boolean) => void;
    loadUserInfo: () => Promise<void>;
}

// 辅助函数：安全地设置Token到OpenAPI对象
// *** 修复：使用 eslint-disable-next-line 注释来忽略此处的 any 类型错误 ***
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setApiToken = (apiConfig: any, tokenValue: string | null | undefined) => {
    if (apiConfig && 'TOKEN' in apiConfig) {
        apiConfig.TOKEN = tokenValue === null ? undefined : tokenValue;
    }
};

// 辅助函数：一次性为所有相关的 OpenAPI 对象设置 TOKEN
const updateAllApiTokens = (tokenValue: string | null | undefined) => {
    setApiToken(UserHubOpenAPI, tokenValue);
    setApiToken(PostServiceOpenAPI, tokenValue);
    setApiToken(PostSearchOpenAPI, tokenValue);
    console.log(`[UserStore:updateAllApiTokens] 已为所有相关 OpenAPI 配置更新令牌。`);
};


export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            initialized: false,

            setUserAndToken: (user, tokenArgument) => {
                const currentTokenToSet = typeof tokenArgument !== 'undefined' ? tokenArgument : get().token;
                console.log('[UserStore:setUserAndToken] 正在设置用户和令牌。用户:', user, '要设置的令牌:', currentTokenToSet);

                if (currentTokenToSet) {
                    set({ user, token: currentTokenToSet, initialized: true });
                    setAccessToken(currentTokenToSet);
                    updateAllApiTokens(currentTokenToSet);
                } else if (user === null && (currentTokenToSet === null || typeof currentTokenToSet === 'undefined')) {
                    set({ user: null, token: null, initialized: true });
                    removeAccessToken();
                    updateAllApiTokens(undefined);
                } else if (user && typeof currentTokenToSet === 'undefined') {
                    set({user, initialized: true});
                }
            },

            clearUserSession: () => {
                console.log('[UserStore:clearUserSession] 正在清除客户端用户会话。');
                set({ user: null, token: null, initialized: true });
                removeAccessToken();
                updateAllApiTokens(undefined);
            },

            setInitialized: (status) => {
                console.log('[UserStore:setInitialized] 正在设置 initialized 状态为:', status);
                set({ initialized: status });
            },

            loadUserInfo: async () => {
                const currentToken = get().token || getAccessToken();

                console.log('[UserStore:loadUserInfo] 尝试加载统一的用户账户详情。有效令牌:', currentToken ? "存在" : "不存在");

                if (UserHubOpenAPI.TOKEN !== (currentToken === null ? undefined : currentToken)) {
                    console.warn(`[UserStore:loadUserInfo] 正在同步 UserHubOpenAPI.TOKEN (原为 ${UserHubOpenAPI.TOKEN}) 与当前有效令牌 (${currentToken ? "存在" : "不存在"})。`);
                    updateAllApiTokens(currentToken);
                }

                const expectedGatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_HOST_AND_PORT || 'http://localhost:8080';
                if (UserHubOpenAPI.BASE !== expectedGatewayUrl) {
                    console.error(`[UserStore:loadUserInfo] 严重不匹配: UserHubOpenAPI.BASE 为 "${UserHubOpenAPI.BASE}" 但预期为 "${expectedGatewayUrl}"。这应由 ApiClientInitializer 设置。请重新检查初始化顺序或逻辑。`);
                }

                if (currentToken) {
                    try {
                        console.log(`[UserStore:loadUserInfo] 正在调用 ProfileManagementService.getApiV1UserHubProfile()。`);
                        const response: docs_SwaggerAPIMyAccountDetailResponse = await ProfileManagementService.getApiV1UserHubProfile();

                        if (response?.code === 0 && response.data) {
                            const accountDetail = response.data as vo_MyAccountDetailVO;

                            if (!accountDetail.user_id) {
                                console.error("[UserStore:loadUserInfo] API 返回的账户详情中缺少 user_id。");
                                throw new Error("API返回的账户详情中缺少用户ID。");
                            }

                            const userForStore: User = {
                                user_id: accountDetail.user_id,
                                created_at: accountDetail.created_at,
                                status: accountDetail.status,
                                updated_at: accountDetail.updated_at,
                                role: accountDetail.user_role,
                                avatar_url: accountDetail.avatar_url,
                                city: accountDetail.city,
                                gender: accountDetail.gender,
                                nickname: accountDetail.nickname,
                                province: accountDetail.province,
                            };
                            console.log("[UserStore:loadUserInfo] 统一用户账户详情已成功获取并映射:", userForStore);
                            get().setUserAndToken(userForStore, currentToken);
                        } else {
                            console.warn("[UserStore:loadUserInfo] 获取统一账户详情失败或数据为空。", response);
                            get().clearUserSession();
                        }
                    } catch (error) {
                        console.error("[UserStore:loadUserInfo] 从API加载统一用户账户详情时出错:", error);
                        get().clearUserSession();
                    }
                } else {
                    console.log("[UserStore:loadUserInfo] 未找到令牌，正在清除会话。");
                    get().clearUserSession();
                }

                if (!get().initialized) {
                    console.warn('[UserStore:loadUserInfo] initialized 在末尾仍为 false，显式设置为 true。');
                    get().setInitialized(true);
                }
            },
        }),
        {
            name: 'user-auth-storage-v2',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error("[UserStore:onRehydrateStorage] 恢复用户状态失败:", error);
                }
                if (state) {
                    console.log("[UserStore:onRehydrateStorage] 状态已恢复。恢复状态中的当前令牌:", state.token);
                    state.setInitialized(false);
                    console.log("[UserStore:onRehydrateStorage] 已调用 setInitialized(false) 以强制 AuthInitializer 重新检查。");
                }
            }
        }
    )
);
