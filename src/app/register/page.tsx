// src/app/register/page.tsx
"use client";

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import type {
    dto_AccountRegisterData,
    dto_PhoneLoginOrRegisterData,
    dto_SendCaptchaRequest,
    vo_UserWithProfileVO,
} from '@/generated-api/user-hub';
import {
    ApiError,
    AuthHelperService,
    OpenAPI as UserHubOpenAPI,
    ProfileManagementService,
    Service as UserHubService,
    vo_MyAccountDetailVO
} from '@/generated-api/user-hub';
import {useUserStore} from '@/store/userStore';
import {setAccessToken} from '@/utils/tokenManager';
import {Eye, EyeOff, KeyRound, Mail, MessageSquareWarning, ShieldCheck, Smartphone, UserPlus} from 'lucide-react';
import '../login/login-styles.css'; // 复用登录页面的CSS

type RegisterMode = 'account' | 'phone';

export default function RegisterPage() {
    const router = useRouter();
    const { setUserAndToken } = useUserStore();

    const [registerMode, setRegisterMode] = useState<RegisterMode>('account');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 账号密码注册表单状态
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    // 手机号注册表单状态
    const [phone, setPhone] = useState('');
    const [captcha, setCaptcha] = useState('');
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


    const handleAccountRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        const registerData: dto_AccountRegisterData = { account, password, confirmPassword };

        try {
            const response = await UserHubService.postApiV1UserHubAccountRegister({ requestBody: registerData });
            if (response.code === 0) {
                setSuccessMessage('账号注册成功！请前往登录页面登录。');
                setAccount('');
                setPassword('');
                setConfirmPassword('');
            } else {
                setError(response.message || '账号注册失败，请稍后再试。');
            }
        } catch (err: unknown) { // *** 修复 1 ***
            let displayMessage = '账号注册时发生未知错误。';
            if (err instanceof ApiError) {
                displayMessage = (err.body as { message?: string })?.message || err.message;
            } else if (err instanceof Error) {
                displayMessage = err.message;
            }
            setError(displayMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendCaptcha = async () => {
        if (!phone) {
            setError('请输入手机号码');
            return;
        }
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            setError('请输入有效的11位手机号码');
            return;
        }

        setIsSendingCaptcha(true);
        setCaptchaButtonDisabled(true);
        setError(null);
        setSuccessMessage(null);

        const captchaData: dto_SendCaptchaRequest = { phone };

        try {
            const response = await AuthHelperService.postApiV1UserHubAuthSendCaptcha({ requestBody: captchaData });
            if (response.code === 0) {
                setSuccessMessage('验证码已发送，请注意查收。');
                setCountdown(60);
            } else {
                setError(response.message || '验证码发送失败。');
                setCaptchaButtonDisabled(false);
            }
        } catch (err: unknown) { // *** 修复 2 ***
            setCaptchaButtonDisabled(false);
            let displayMessage = '验证码发送时发生错误。';
            if (err instanceof ApiError) {
                displayMessage = (err.body as { message?: string })?.message || err.message;
            } else if (err instanceof Error) {
                displayMessage = err.message;
            }
            setError(displayMessage);
        } finally {
            setIsSendingCaptcha(false);
        }
    };

    const handlePhoneRegisterOrLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        const phoneLoginData: dto_PhoneLoginOrRegisterData = { phone, code: captcha };

        try {
            const loginResponse = await UserHubService.postApiV1UserHubPhoneLogin({ requestBody: phoneLoginData });

            if (loginResponse.code === 0 && loginResponse.data?.token?.access_token && loginResponse.data?.userManage?.userID) {
                const accessToken = loginResponse.data.token.access_token;

                setAccessToken(accessToken);
                if (UserHubOpenAPI.TOKEN !== accessToken) {
                    UserHubOpenAPI.TOKEN = accessToken;
                }

                const accountDetailResponse = await ProfileManagementService.getApiV1UserHubProfile();
                if (accountDetailResponse.code === 0 && accountDetailResponse.data) {
                    const accountDetail = accountDetailResponse.data as vo_MyAccountDetailVO;
                    const userForStore: vo_UserWithProfileVO = {
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
                    setUserAndToken(userForStore, accessToken);
                    router.push('/');
                } else {
                    setError(accountDetailResponse.message || '获取用户信息失败，请稍后重试或重新登录。');
                    useUserStore.getState().clearUserSession();
                }
            } else {
                setError(loginResponse.message || '手机号注册或登录失败。');
            }
        } catch (err: unknown) { // *** 修复 3 ***
            let displayMessage = '手机号注册或登录时发生错误。';
            if (err instanceof ApiError) {
                displayMessage = (err.body as { message?: string })?.message || err.message;
            } else if (err instanceof Error) {
                displayMessage = err.message;
            }
            setError(displayMessage);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div id="registerPageContainer" className="login-page-container">
            <div className="login-card-container">
                <h1 className="login-title">
                    <UserPlus size={40} className="inline-block mr-3 text-[var(--theme-secondary)]" />
                    加入趣站
                </h1>
                <p className="text-center text-sm text-[var(--theme-text-secondary)] mb-8 -mt-4">
                    开启你的趣味之旅！
                </p>

                <div className="login-tabs-container">
                    <button
                        onClick={() => { setRegisterMode('account'); setError(null); setSuccessMessage(null); }}
                        className={`login-tab-button ${registerMode === 'account' ? 'active' : 'inactive'}`}
                    >
                        <KeyRound size={18} /> <span>账号注册</span>
                    </button>
                    <button
                        onClick={() => { setRegisterMode('phone'); setError(null); setSuccessMessage(null); }}
                        className={`login-tab-button ${registerMode === 'phone' ? 'active' : 'inactive'}`}
                    >
                        <Smartphone size={18} /> <span>手机号注册/登录</span>
                    </button>
                </div>

                {error && (
                    <div className="login-error-alert">
                        <MessageSquareWarning size={20} className="text-red-500" />
                        <span>{error}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-6 p-3.5 bg-green-50 border-2 border-green-400 text-green-700 rounded-xl text-sm flex items-center space-x-2.5 shadow-md">
                        <span>{successMessage}</span>
                    </div>
                )}

                {registerMode === 'account' && (
                    <form onSubmit={handleAccountRegister} className="space-y-6">
                        <div>
                            <label htmlFor="accountReg" className="form-label">账号</label>
                            <div className="input-icon-wrapper mt-1.5">
                                <div className="input-icon-left">
                                    <UserPlus size={20} />
                                </div>
                                <input
                                    type="text"
                                    id="accountReg"
                                    value={account}
                                    onChange={(e) => setAccount(e.target.value)}
                                    required
                                    className="login-form-input login-form-input-with-icon"
                                    placeholder="设置您的登录账号"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="passwordReg" className="form-label">密码</label>
                            <div className="input-icon-wrapper mt-1.5">
                                <div className="input-icon-left">
                                    <KeyRound size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="passwordReg"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="login-form-input login-form-input-with-icon login-form-input-with-right-icon"
                                    placeholder="设置密码 (至少6位)"
                                    minLength={6}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="input-icon-right-button"
                                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="confirmPasswordReg" className="form-label">确认密码</label>
                            <div className="input-icon-wrapper mt-1.5">
                                <div className="input-icon-left">
                                    <KeyRound size={20} />
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPasswordReg"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="login-form-input login-form-input-with-icon login-form-input-with-right-icon"
                                    placeholder="请再次输入密码"
                                    minLength={6}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="input-icon-right-button"
                                    aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="login-submit-button mt-7">
                            {isLoading ? '注册中...' : '立即注册'}
                        </button>
                    </form>
                )}

                {registerMode === 'phone' && (
                    <form onSubmit={handlePhoneRegisterOrLogin} className="space-y-6">
                        <div>
                            <label htmlFor="phoneReg" className="form-label">手机号码</label>
                            <div className="input-icon-wrapper mt-1.5">
                                <div className="input-icon-left">
                                    <Smartphone size={20} />
                                </div>
                                <input
                                    type="tel"
                                    id="phoneReg"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    pattern="^1[3-9]\d{9}$"
                                    title="请输入有效的11位中国大陆手机号码"
                                    className="login-form-input login-form-input-with-icon"
                                    placeholder="请输入您的手机号"
                                    disabled={isLoading || isSendingCaptcha || countdown > 0}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="captchaReg" className="form-label">短信验证码</label>
                            <div className="flex space-x-3 mt-1.5">
                                <div className="input-icon-wrapper flex-grow">
                                    <div className="input-icon-left">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        id="captchaReg"
                                        value={captcha}
                                        onChange={(e) => setCaptcha(e.target.value)}
                                        required
                                        minLength={4}
                                        maxLength={6}
                                        className="login-form-input login-form-input-with-icon w-full"
                                        placeholder="请输入验证码"
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSendCaptcha}
                                    disabled={captchaButtonDisabled || isSendingCaptcha || !phone || !/^1[3-9]\d{9}$/.test(phone)}
                                    className="captcha-button"
                                >
                                    {isSendingCaptcha ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <Mail size={16} className="mr-1.5"/>
                                    )}
                                    {countdown > 0 ? `${countdown}s` : (isSendingCaptcha ? '' : '获取验证码')}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="login-submit-button mt-7">
                            {isLoading ? '处理中...' : '注册 / 登录'}
                        </button>
                    </form>
                )}

                <p className="text-center text-sm text-[var(--theme-text-secondary)] mt-10">
                    已有账号?{' '}
                    <Link href="/login" className="login-register-link">
                        立即登录
                    </Link>
                </p>
            </div>
        </div>
    );
}
