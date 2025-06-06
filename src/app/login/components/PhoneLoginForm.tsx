// src/app/login/components/PhoneLoginForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Service as UserHubService, // 重命名以避免潜在冲突
    AuthHelperService,
    ProfileManagementService,
    OpenAPI as UserHubOpenAPI,
    ApiError,
    type dto_PhoneLoginOrRegisterData,
    type dto_SendCaptchaRequest,
    type vo_UserWithProfileVO, // 这是我们 store 中 User 的类型
    type docs_SwaggerAPILoginResponse,
    type docs_SwaggerAPIEmptyResponse,
    type docs_SwaggerAPIMyAccountDetailResponse
} from '@/generated-api/user-hub';
import { useUserStore } from '@/store/userStore';
import { setAccessToken } from '@/utils/tokenManager';
import { Smartphone, ShieldCheck, Mail } from 'lucide-react';

interface PhoneLoginFormProps {
    setGlobalError: (message: string | null) => void;
    setGlobalSuccess: (message: string | null) => void;
}

const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({ setGlobalError, setGlobalSuccess }) => {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [captcha, setCaptcha] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingCaptcha, setIsSendingCaptcha] = useState(false);
    const [captchaButtonDisabled, setCaptchaButtonDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else {
            setCaptchaButtonDisabled(false);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendCaptcha = async () => {
        if (!phone) {
            setGlobalError('请输入手机号码');
            return;
        }
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            setGlobalError('请输入有效的11位手机号码');
            return;
        }

        setIsSendingCaptcha(true);
        setCaptchaButtonDisabled(true);
        setGlobalError(null);
        setGlobalSuccess(null);

        const captchaData: dto_SendCaptchaRequest = { phone };

        try {
            const response: docs_SwaggerAPIEmptyResponse = await AuthHelperService.postApiV1UserHubAuthSendCaptcha({ requestBody: captchaData });
            if (response.code === 0) {
                setGlobalSuccess('验证码已发送，请注意查收。');
                setCountdown(60);
            } else {
                setGlobalError(response.message || '验证码发送失败。');
                setCaptchaButtonDisabled(false);
            }
        } catch (err: unknown) { // 修改为 unknown
            console.error("[PhoneLogin] 发送验证码错误:", err);
            let displayMessage = '验证码发送时发生错误。';
            if (err instanceof ApiError) {
                const backendResponse = err.body as { message?: string; code?: number };
                if (backendResponse?.message) {
                    displayMessage = backendResponse.message;
                } else {
                    displayMessage = err.message || `API请求失败 (状态: ${err.status})`;
                }
            } else if (err instanceof Error) { // 检查是否是标准 Error
                displayMessage = err.message;
            } else if (typeof err === 'string') {
                displayMessage = err;
            }
            setGlobalError(displayMessage);
            setCaptchaButtonDisabled(false);
        } finally {
            setIsSendingCaptcha(false);
        }
    };

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setGlobalError(null);
        setGlobalSuccess(null);

        const loginData: dto_PhoneLoginOrRegisterData = { phone, code: captcha };

        try {
            // ... 省略了未改动的 try 块代码 ...
            const loginResponse: docs_SwaggerAPILoginResponse = await UserHubService.postApiV1UserHubPhoneLogin({ requestBody: loginData });

            if (loginResponse.code !== 0) {
                setGlobalError(loginResponse.message || '登录失败，请检查手机号或验证码。');
                setIsLoading(false);
                return;
            }

            if (loginResponse.data?.token?.access_token) {
                const accessToken = loginResponse.data.token.access_token;
                setAccessToken(accessToken);
                if (UserHubOpenAPI.TOKEN !== accessToken) {
                    UserHubOpenAPI.TOKEN = accessToken;
                }
                console.log("[PhoneLogin] 手机号登录/注册成功，Access Token 已设置。");

                console.log("[PhoneLogin] 正在获取用户账户详情...");
                const accountDetailResponse: docs_SwaggerAPIMyAccountDetailResponse = await ProfileManagementService.getApiV1UserHubProfile();

                if (accountDetailResponse.code === 0 && accountDetailResponse.data) {
                    const accountDetail = accountDetailResponse.data;

                    if (!accountDetail.user_id) {
                        console.error("[PhoneLogin] 获取到的账户详情中缺少 user_id。");
                        setGlobalError("登录成功，但获取用户唯一标识失败。");
                        useUserStore.getState().clearUserSession();
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
                    console.log("[PhoneLogin] 用户信息已更新到全局状态。");
                    router.push('/');
                } else {
                    const errorMsg = `登录成功，但获取账户详情失败: ${accountDetailResponse.message || '未知错误'}`;
                    console.error("[PhoneLogin]", errorMsg, accountDetailResponse);
                    setGlobalError(errorMsg);
                    useUserStore.getState().clearUserSession();
                }
            } else {
                setGlobalError(loginResponse.message || '登录响应数据无效或不完整。');
            }
        } catch (err: unknown) { // 修改为 unknown
            console.error("[PhoneLogin] 登录或获取用户信息过程中发生错误:", err);
            let displayMessage = '登录时发生未知错误。';

            // 优先检查更具体的错误类型
            if (err instanceof ApiError) {
                displayMessage = (err.body as { message?: string })?.message || err.message || 'API 调用失败。';
            } else if (err instanceof Error) {
                displayMessage = err.message;
            }
            // 然后检查是否是我们自定义的拦截器错误对象
            else if (typeof err === 'object' && err !== null && 'isAxiosInterceptorError' in err) {
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
                <label htmlFor="phone" className="form-label">手机号码</label>
                <div className="input-icon-wrapper mt-1.5">
                    <div className="input-icon-left"><Smartphone size={20} /></div>
                    <input type="tel" id="phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required pattern="^1[3-9]\d{9}$" title="请输入有效的11位中国大陆手机号码" className="login-form-input login-form-input-with-icon" placeholder="请输入您的手机号" disabled={isLoading || isSendingCaptcha || countdown > 0}/>
                </div>
            </div>
            <div>
                <label htmlFor="captcha" className="form-label">短信验证码</label>
                <div className="flex space-x-3 mt-1.5">
                    <div className="input-icon-wrapper flex-grow">
                        <div className="input-icon-left"><ShieldCheck size={20} /></div>
                        <input type="text" id="captcha" name="captcha" value={captcha} onChange={(e) => setCaptcha(e.target.value)} required minLength={4} maxLength={6} className="login-form-input login-form-input-with-icon w-full" placeholder="请输入验证码" disabled={isLoading}/>
                    </div>
                    <button type="button" onClick={handleSendCaptcha} disabled={captchaButtonDisabled || isSendingCaptcha || !phone || !/^1[3-9]\d{9}$/.test(phone)} className="captcha-button">
                        {isSendingCaptcha ? (<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (<Mail size={16} className="mr-1.5"/>)}
                        {countdown > 0 ? `${countdown}s` : (isSendingCaptcha ? '' : '获取验证码')}
                    </button>
                </div>
            </div>
            <button type="submit" disabled={isLoading || !phone || !captcha} className="login-submit-button thick-border mt-8">
                {isLoading ? (<>...</>) : ('登录 / 注册')}
            </button>
        </form>
    );
};

export default PhoneLoginForm;