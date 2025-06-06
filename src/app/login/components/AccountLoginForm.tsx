// src/app/login/components/AccountLoginForm.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Service as UserHubService, // 重命名以避免潜在冲突
    ProfileManagementService,
    OpenAPI as UserHubOpenAPI,
    ApiError,
    type dto_AccountLoginData,
    type vo_UserWithProfileVO, // 这是我们 store 中 User 的类型
    // 移除了未使用的 vo_MyAccountDetailVO
    type docs_SwaggerAPILoginResponse,
    type docs_SwaggerAPIMyAccountDetailResponse
} from '@/generated-api/user-hub';
import { useUserStore } from '@/store/userStore';
import { setAccessToken } from '@/utils/tokenManager';
import { User as UserIcon, KeyRound, Eye, EyeOff } from 'lucide-react';

interface AccountLoginFormProps {
    setGlobalError: (message: string | null) => void;
    setGlobalSuccess: (message: string | null) => void;
}

const AccountLoginForm: React.FC<AccountLoginFormProps> = ({ setGlobalError, setGlobalSuccess }) => {
    const router = useRouter();
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setGlobalError(null);
        setGlobalSuccess(null);

        const loginData: dto_AccountLoginData = { account, password };

        try {
            // ... 省略了未改动的 try 块代码 ...
            const loginResponse: docs_SwaggerAPILoginResponse = await UserHubService.postApiV1UserHubAccountLogin({
                requestBody: loginData,
            });

            if (loginResponse.code !== 0) {
                setGlobalError(loginResponse.message || '登录认证失败，请检查您的凭据。');
                setIsLoading(false);
                return;
            }

            if (loginResponse.data?.token?.access_token && loginResponse.data?.userManage?.userID) {
                const accessToken = loginResponse.data.token.access_token;
                setAccessToken(accessToken);
                if (UserHubOpenAPI.TOKEN !== accessToken) {
                    UserHubOpenAPI.TOKEN = accessToken;
                }
                console.log("[AccountLogin] 登录成功，Access Token 已设置。");

                console.log("[AccountLogin] 正在获取用户账户详情...");
                const accountDetailResponse: docs_SwaggerAPIMyAccountDetailResponse = await ProfileManagementService.getApiV1UserHubProfile();

                if (accountDetailResponse.code === 0 && accountDetailResponse.data) {
                    const accountDetail = accountDetailResponse.data;

                    if (!accountDetail.user_id) {
                        console.error("[AccountLogin] 获取到的账户详情中缺少 user_id。");
                        setGlobalError("登录成功，但获取用户唯一标识失败。");
                        useUserStore.getState().clearUserSession(); // 清理会话
                        setIsLoading(false);
                        return;
                    }

                    const userWithProfile: vo_UserWithProfileVO = {
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

                    useUserStore.getState().setUserAndToken(userWithProfile, accessToken);
                    console.log("[AccountLogin] 用户信息已更新到全局状态。");
                    router.push('/');
                } else {
                    const errorMsg = `登录成功，但获取账户详情失败: ${accountDetailResponse.message || '未知错误'}`;
                    console.error("[AccountLogin]", errorMsg, accountDetailResponse);
                    setGlobalError(errorMsg);
                    useUserStore.getState().clearUserSession();
                }
            } else {
                setGlobalError(loginResponse.message || '登录响应数据无效或不完整。');
            }
        } catch (err: unknown) {
            console.error("[AccountLogin] 登录或获取用户信息过程中发生错误:", err);
            let displayMessage = '登录时发生未知错误。';

            // 优先检查更具体的错误类型
            if (err instanceof ApiError) {
                displayMessage = (err.body as { message?: string })?.message || err.message || 'API 调用失败。';
            } else if (err instanceof Error) {
                displayMessage = err.message;
            }
            // 然后检查是否是我们自定义的拦截器错误对象
            else if (typeof err === 'object' && err !== null && 'isAxiosInterceptorError' in err) {
                // 将 err 断言为一个更宽松的类型，只包含我们确定要访问的属性
                const interceptedError = err as { message?: string; data?: { message?: string } };
                if (interceptedError.data?.message) {
                    displayMessage = interceptedError.data.message;
                } else if (interceptedError.message) {
                    displayMessage = interceptedError.message;
                }
            } else if (typeof err === 'string') {
                displayMessage = err;
            }

            setGlobalError(displayMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-7">
            {/* ... 省略了未改动的 JSX 代码 ... */}
            <div>
                <label htmlFor="account" className="form-label">账号</label>
                <div className="input-icon-wrapper mt-1.5">
                    <div className="input-icon-left"><UserIcon size={20} /></div>
                    <input type="text" id="account" name="account" value={account} onChange={(e) => setAccount(e.target.value)} required className="login-form-input login-form-input-with-icon" placeholder="请输入您的账号" disabled={isLoading}/>
                </div>
            </div>
            <div>
                <label htmlFor="password" className="form-label">密码</label>
                <div className="input-icon-wrapper mt-1.5">
                    <div className="input-icon-left"><KeyRound size={20} /></div>
                    <input type={showPassword ? "text" : "password"} id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="login-form-input login-form-input-with-icon login-form-input-with-right-icon" placeholder="请输入您的密码" disabled={isLoading}/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="input-icon-right-button" aria-label={showPassword ? "隐藏密码" : "显示密码"}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>
            <button type="submit" disabled={isLoading} className="login-submit-button thick-border mt-8">
                {isLoading ? (<>...</>) : ('登录')}
            </button>
        </form>
    );
};

export default AccountLoginForm;