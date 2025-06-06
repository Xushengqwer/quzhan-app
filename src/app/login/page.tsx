// src/app/login/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import AccountLoginForm from './components/AccountLoginForm';
import PhoneLoginForm from './components/PhoneLoginForm';
import {KeyRound, Smartphone, MessageSquareWarning } from 'lucide-react';
import './login-styles.css'; // 导入专属CSS文件

type LoginMode = 'account' | 'phone';

export default function LoginPage() {
    const [loginMode, setLoginMode] = useState<LoginMode>('account');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSetError = (message: string | null) => setError(message);
    const handleSetSuccess = (message: string | null) => setSuccessMessage(message);

    return (
        // 使用新的CSS类来控制整体布局和间距
        <div id="loginPageContainer" className="login-page-container">
            {/* 直接在此处添加 thick-border 类 */}
            <div className="login-card-container thick-border">
                <h1 className="login-title">
                    欢迎回来！
                </h1>

                {/* Tabs */}
                <div className="login-tabs-container">
                    <button
                        onClick={() => { setLoginMode('account'); setError(null); setSuccessMessage(null);}}
                        className={`login-tab-button ${loginMode === 'account' ? 'active' : 'inactive'}`}
                    >
                        <KeyRound size={18} /> <span>账号登录</span>
                    </button>
                    <button
                        onClick={() => { setLoginMode('phone'); setError(null); setSuccessMessage(null);}}
                        className={`login-tab-button ${loginMode === 'phone' ? 'active' : 'inactive'}`}
                    >
                        <Smartphone size={18} /> <span>手机号登录</span>
                    </button>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="login-error-alert">
                        <MessageSquareWarning size={20} className="text-red-500"/>
                        <span>{error}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-6 p-3.5 bg-green-50 border-2 border-green-400 text-green-700 rounded-xl text-sm flex items-center space-x-2.5 shadow-md">
                        {/* You can add a success icon here if needed */}
                        <span>{successMessage}</span>
                    </div>
                )}

                {loginMode === 'account' && (
                    <AccountLoginForm setGlobalError={handleSetError} setGlobalSuccess={handleSetSuccess} />
                )}
                {loginMode === 'phone' && (
                    <PhoneLoginForm setGlobalError={handleSetError} setGlobalSuccess={handleSetSuccess} />
                )}

                <p className="text-center text-sm text-[var(--theme-text-secondary)] mt-10">
                    还没有账号?{' '}
                    <Link href="/register" className="login-register-link">
                        立即注册
                    </Link>
                </p>
            </div>
        </div>
    );
}
