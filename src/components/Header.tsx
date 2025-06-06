// src/components/Header.tsx
"use client";

import React, {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {useUserStore} from '@/store/userStore';
import {usePathname, useRouter} from 'next/navigation';
import Image from 'next/image';
import {AuthManagementService, OpenAPI as UserHubOpenAPI} from '@/generated-api/user-hub';
import {getAccessToken} from '@/utils/tokenManager';
import {Clock, Edit3, FileText, Menu, Search as SearchIconLucide, Settings, Sparkles, X} from 'lucide-react'; // 确保 SearchIconLucide 已导入

// SVG 图标组件
const LogoIcon = () => (
    <svg className="w-10 h-10 text-[var(--theme-primary)]" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="22" fill="var(--theme-secondary)" stroke="var(--theme-border-strong-color)" strokeWidth="2.5"/>
        <path d="M18 20C18 17.7909 19.7909 16 22 16C24.2091 16 26 17.7909 26 20C26 22.2091 24.2091 24 22 24C19.7909 24 18 22.2091 18 20Z" fill="var(--theme-border-strong-color)"/>
        <path d="M30 20C30 17.7909 31.7909 16 34 16C36.2091 16 38 17.7909 38 20C38 22.2091 36.2091 24 34 24C31.7909 24 30 22.2091 30 20Z" fill="var(--theme-border-strong-color)"/>
        <path d="M16 30C18.3333 34.6667 31.6667 34.6667 34 30C31.6667 32.3333 18.3333 32.3333 16 30Z" stroke="var(--theme-border-strong-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const HotIcon = () => <Sparkles className="nav-icon w-5 h-5 mr-1.5" />;
const LatestIcon = () => <Clock className="nav-icon w-5 h-5 mr-1.5" />;
// 正确定义 SearchNavIcon
const SearchNavIcon = () => <SearchIconLucide className="nav-icon w-5 h-5 mr-1.5" />;
const PublishIcon = () => <Edit3 className="nav-icon w-5 h-5 mr-1.5" />;
const MyPostsIcon = () => <FileText className="nav-icon w-5 h-5 mr-1.5" />;
const AdminIcon = () => <Settings className="nav-icon w-5 h-5 mr-1.5" />;


const Header: React.FC = () => {
    const user = useUserStore((state) => state.user);
    const initialized = useUserStore((state) => state.initialized);
    const clearUserSession = useUserStore((state) => state.clearUserSession);

    const router = useRouter();
    const pathname = usePathname();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const IS_ADMIN = user?.role === 0; // 0 代表管理员

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && !(event.target as HTMLElement).closest('#mobileMenuToggle')) {
                setIsMobileMenuOpen(false);
            }
        };
        if (isUserMenuOpen || isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen, isMobileMenuOpen]);

    const handleLogout = async () => {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        const currentToken = getAccessToken();

        if (currentToken) {
            try {
                if (UserHubOpenAPI.TOKEN !== currentToken && UserHubOpenAPI.TOKEN === undefined) {
                    console.warn("[Header] 全局 UserHubOpenAPI.TOKEN 未设置，登出可能依赖显式参数。");
                }
                console.log("Header: 调用后端登出API...");
                await AuthManagementService.postApiV1UserHubAuthLogout({
                    authorization: `Bearer ${currentToken}`,
                });
                console.log("Header: 后端登出成功。");
            } catch (error) {
                console.error("Header: 后端登出API调用失败:", error);
            }
        } else {
            console.log("Header: 未找到本地token，直接执行客户端清理。");
        }

        clearUserSession();
        router.push('/login');
        console.log("Header: 客户端会话已清理并跳转到登录页。");
    };

    const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const navLinkBaseClasses = "flex items-center h-full px-3 font-semibold text-md transition-colors duration-200";
    const navLinkIdleClasses = `${navLinkBaseClasses} text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)] border-b-[3px] border-transparent hover:border-[var(--theme-primary)]`;
    const navLinkActiveClasses = `${navLinkBaseClasses} text-[var(--theme-primary)] font-bold border-[var(--theme-primary)]`;

    const mobileNavLinkBaseClasses = "block px-4 py-3 text-md rounded-md";
    const mobileNavLinkIdleClasses = `${mobileNavLinkBaseClasses} text-[var(--theme-text-primary)] hover:bg-[var(--theme-background)] hover:text-[var(--theme-primary)]`;
    const mobileNavLinkActiveClasses = `${mobileNavLinkBaseClasses} bg-[var(--theme-primary)] text-white font-semibold`;

    const navItems = [
        { href: "/", label: "热门", icon: <HotIcon />, exact: true },
        { href: "/latest", label: "最新", icon: <LatestIcon /> },
        { href: "/search", label: "搜索", icon: <SearchNavIcon /> }, // 使用已定义的 SearchNavIcon
        ...(user ? [
            { href: "/publish", label: "发布", icon: <PublishIcon /> },
            { href: "/my-posts", label: "我的", icon: <MyPostsIcon /> },
        ] : []),
        ...(user && IS_ADMIN ? [
            { href: "/admin", label: "管理", icon: <AdminIcon /> },
        ] : []),
    ];

    const avatarText = user?.nickname ? user.nickname[0].toUpperCase() : (user?.user_id ? 'U' : '喵');
    const defaultAvatar = `https://placehold.co/44x44/F2C94C/3A3A3A?text=${encodeURIComponent(avatarText)}&font=ZCOOL+KuaiLe`;
    const avatarUrl = user?.avatar_url || defaultAvatar;

    if (!initialized) {
        return (
            <header
                className="fixed top-0 left-0 w-full z-50 bg-[var(--theme-card-bg)] thick-border-light shadow-md animate-pulse"
                style={{ height: 'var(--header-height)' }}
            >
                <div className="max-w-screen-lg mx-auto px-5 h-full flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded mr-2"></div>
                        <div className="w-20 h-8 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-11 h-11 bg-gray-300 rounded-full"></div>
                </div>
            </header>
        );
    }

    return (
        <header
            className="fixed top-0 left-0 w-full z-50 bg-[var(--theme-card-bg)] thick-border-light shadow-md"
            style={{ height: 'var(--header-height)' }}
        >
            <div className="max-w-screen-lg mx-auto px-4 sm:px-5 h-full flex items-center justify-between">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center mr-4 md:mr-6 no-underline" aria-label="首页">
                        <LogoIcon />
                        <span className="ml-2 logo-text-custom hidden sm:inline">趣站</span>
                    </Link>
                    <nav className="hidden md:block">
                        <ul className="flex items-center space-x-1 lg:space-x-3 h-full">
                            {navItems.map(item => (
                                <li key={item.href} className="h-full">
                                    <Link href={item.href}
                                          className={pathname === item.href || (item.href !== '/' && item.exact === false && pathname.startsWith(item.href)) ? navLinkActiveClasses : navLinkIdleClasses}
                                          aria-label={item.label}
                                          onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="flex items-center">
                    {user ? (
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={toggleUserMenu}
                                className="focus:outline-none w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-cover bg-center cursor-pointer thick-border-light hover:shadow-md transition-all duration-200 transform hover:scale-105"
                                title="用户中心"
                                aria-label="用户菜单"
                            >
                                <Image
                                    src={avatarUrl}
                                    alt={user.nickname || user.user_id || "用户头像"}
                                    width={44}
                                    height={44}
                                    className="rounded-full object-cover"
                                    onError={(_e) => { const target = _e.target as HTMLImageElement; target.src = defaultAvatar; }}
                                />
                            </button>
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 py-2 w-48 bg-[var(--theme-card-bg)] rounded-lg shadow-xl z-20 thick-border">
                                    <div className="px-4 py-3 border-b border-[var(--theme-border-color)]">
                                        <p className="text-sm font-semibold text-[var(--theme-text-primary)] truncate" style={{fontFamily: 'var(--font-display)'}}>
                                            你好, {user.nickname || user.user_id}
                                        </p>
                                    </div>
                                    <Link
                                        href="/profile"
                                        className="block px-4 py-2 text-sm text-[var(--theme-text-secondary)] hover:bg-[var(--theme-background)] hover:text-[var(--theme-primary)]"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        个人资料
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-[var(--theme-text-secondary)] hover:bg-[var(--theme-background)] hover:text-[var(--theme-primary)]"
                                    >
                                        退出登录
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-3">
                            <Link href="/login" className="text-sm font-medium text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)] transition-colors px-3 py-2 rounded-md">
                                登录
                            </Link>
                            <Link href="/register" className="btn-primary text-sm px-4 py-2">
                                注册
                            </Link>
                        </div>
                    )}
                    <div className="md:hidden ml-3">
                        <button
                            id="mobileMenuToggle"
                            onClick={toggleMobileMenu}
                            className="p-2 rounded-md text-[var(--theme-text-primary)] hover:bg-[var(--theme-background)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--theme-primary)]"
                            aria-label="打开主菜单"
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div ref={mobileMenuRef} className="md:hidden absolute top-[var(--header-height)] left-0 w-full bg-[var(--theme-card-bg)] shadow-lg rounded-b-lg thick-border-light border-t-0 z-40 p-4 space-y-2">
                    <nav>
                        <ul>
                            {navItems.map(item => (
                                <li key={`mobile-${item.href}`}>
                                    <Link href={item.href}
                                          className={pathname === item.href || (item.href !== '/' && item.exact === false && pathname.startsWith(item.href)) ? mobileNavLinkActiveClasses : mobileNavLinkIdleClasses}
                                          onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {React.cloneElement(item.icon, {className: "inline-block w-5 h-5 mr-3"})}
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    {!user && (
                        <div className="pt-4 mt-4 border-t border-[var(--theme-border-color)] space-y-3">
                            <Link href="/login" className="btn-secondary w-full block text-center" onClick={() => setIsMobileMenuOpen(false)}>
                                登录
                            </Link>
                            <Link href="/register" className="btn-primary w-full block text-center" onClick={() => setIsMobileMenuOpen(false)}>
                                注册
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

export default Header;
