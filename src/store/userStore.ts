// src/store/userStore.ts
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {
    type docs_SwaggerAPIMyAccountDetailResponse,
    OpenAPI as UserHubOpenAPI,
    ProfileManagementService,
    type vo_MyAccountDetailVO,
    type vo_UserWithProfileVO,
} from '@/generated-api/user-hub';
import {getAccessToken, removeAccessToken, setAccessToken,} from '@/utils/tokenManager';

export type User = vo_UserWithProfileVO; // Store 中的 User 类型保持不变

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
const setApiToken = (apiConfig: any, tokenValue: string | null | undefined) => {
    if (apiConfig && 'TOKEN' in apiConfig) {
        apiConfig.TOKEN = tokenValue === null ? undefined : tokenValue;
    }
};

// 辅助函数：一次性为所有相关的 OpenAPI 对象设置 TOKEN
const updateAllApiTokens = (tokenValue: string | null | undefined) => {
    setApiToken(UserHubOpenAPI, tokenValue);
    // 如果有其他服务的 OpenAPI 对象也需要同步 TOKEN，在这里添加
    // import { OpenAPI as PostServiceOpenAPI } from '@/generated-api/post-service/core/OpenAPI';
    // setApiToken(PostServiceOpenAPI, tokenValue);
    // import { OpenAPI as PostSearchOpenAPI } from '@/generated-api/post-search/core/OpenAPI';
    // setApiToken(PostSearchOpenAPI, tokenValue);
    console.log(`[UserStore:updateAllApiTokens] 已为所有相关 OpenAPI 配置更新令牌。UserHub TOKEN: ${UserHubOpenAPI.TOKEN}`);
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
                    setAccessToken(currentTokenToSet); // 存到 localStorage
                    // 不再需要在 localStorage 中存储 userID
                    updateAllApiTokens(currentTokenToSet); // 更新所有 OpenAPI 对象的 TOKEN
                } else if (user === null && (currentTokenToSet === null || typeof currentTokenToSet === 'undefined')) {
                    // 明确地清除用户和令牌
                    set({ user: null, token: null, initialized: true });
                    removeAccessToken();
                    // 不再需要从 localStorage 中移除 userID
                    updateAllApiTokens(undefined); // 清除所有 OpenAPI 对象的 TOKEN
                } else if (user && typeof currentTokenToSet === 'undefined') {
                    // 仅更新用户信息，令牌可能已存在或由其他逻辑处理
                    set({user, initialized: true});
                    // 不再需要在 localStorage 中存储 userID
                }
            },

            clearUserSession: () => {
                console.log('[UserStore:clearUserSession] 正在清除客户端用户会话。');
                set({ user: null, token: null, initialized: true });
                removeAccessToken();
                // 不再需要从 localStorage 中移除 userID
                updateAllApiTokens(undefined);
            },

            setInitialized: (status) => {
                console.log('[UserStore:setInitialized] 正在设置 initialized 状态为:', status);
                set({ initialized: status });
            },

            loadUserInfo: async () => {
                const currentToken = get().token || getAccessToken(); // 获取当前有效的令牌

                console.log('[UserStore:loadUserInfo] 尝试加载统一的用户账户详情。有效令牌:', currentToken ? "存在" : "不存在");

                if (UserHubOpenAPI.TOKEN !== (currentToken === null ? undefined : currentToken)) {
                    console.warn(`[UserStore:loadUserInfo] 正在同步 UserHubOpenAPI.TOKEN (原为 ${UserHubOpenAPI.TOKEN}) 与当前有效令牌 (${currentToken ? "存在" : "不存在"})。`);
                    setApiToken(UserHubOpenAPI, currentToken);
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
            name: 'user-auth-storage-v2', // zustand persist 的存储名称
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error("[UserStore:onRehydrateStorage] 恢复用户状态失败:", error);
                }
                if (state) {
                    console.log("[UserStore:onRehydrateStorage] 状态已恢复。恢复状态中的当前令牌:", state.token);
                    state.setInitialized(false); // 强制 AuthInitializer 重新检查
                    console.log("[UserStore:onRehydrateStorage] 已调用 setInitialized(false) 以强制 AuthInitializer 重新检查。");
                }
            }
        }
    )
);
