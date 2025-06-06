// src/app/page.tsx
"use client";

import React, {useCallback, useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import NextImage from 'next/image'; // 导入 Next.js Image 组件并重命名
import {
    type enums_OfficialTag,
    HotPostsService,
    OpenAPI as PostServiceOpenAPI,
    type vo_ListPostsByCursorResponseWrapper,
    type vo_PostResponse,
} from '@/generated-api/post-service';
import {useUserStore} from '@/store/userStore';
import {getAccessToken} from '@/utils/tokenManager';
import {
    BadgeCheck,
    Clock,
    CloudDrizzle,
    Eye,
    Info,
    MessageSquareText,
    Moon,
    Sparkles,
    Sun,
    TrendingUp
} from 'lucide-react'; // 确保 Clock 已导入

// --- 类型定义 ---
// HomePagePostData 扩展了 API 返回的帖子类型，并添加了格式化后的创建时间
interface HomePagePostData extends vo_PostResponse {
    formattedCreatedAt?: string;
}

// --- 辅助函数 ---
function formatTimeAgo(dateString?: string): string {
    if (!dateString) return '未知时间';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 5) return `刚刚`;
    if (diffSeconds < 60) return `${diffSeconds} 秒前`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} 小时前`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.round(diffDays / 7)} 周前`;
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

// 使用导入的 enums_OfficialTag 作为键类型，增强类型安全
const officialTagMap: { [key in enums_OfficialTag]?: { text: string; icon?: React.ReactNode; colorClass: string } } = {
    1: { text: "官方认证", icon: <BadgeCheck size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-[var(--theme-secondary)] text-[var(--theme-text-primary)]" },
    2: { text: "编辑推荐", icon: <Sparkles size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-200" },
    3: { text: "急速响应", icon: <Clock size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-orange-200" },
};

// --- 装饰性形状组件 ---
const DecorativeShapes = () => (
    <div className="absolute top-0 left-0 w-full h-36 md:h-48 overflow-hidden -z-10 opacity-50">
        <svg width="100%" height="100%" viewBox="0 0 1440 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: 'var(--theme-primary)', stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--theme-secondary)', stopOpacity: 0.3 }} />
                </linearGradient>
                <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <path d="M0,80 C200,140 400,60 600,100 S1000,160 1440,120 L1440,0 L0,0 Z" fill="url(#grad1)" filter="url(#softGlow)" />
            <circle cx="15%" cy="40%" r="30" fill="var(--theme-secondary)" opacity="0.2" className="animate-pulse-slow" />
            <circle cx="85%" cy="50%" r="45" fill="var(--theme-primary)" opacity="0.15" className="animate-pulse-slower" />
            <rect x="50%" y="15%" width="60" height="60" rx="15" fill="var(--theme-primary)" opacity="0.1" transform="rotate(15 720 40)" className="animate-pulse-slowest" />
        </svg>
    </div>
);

// --- 主页组件 ---
export default function HomePage() {
    const [posts, setPosts] = useState<HomePagePostData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);

    const sentinelRef = useRef<HTMLDivElement>(null);
    const token = useUserStore((state) => state.token) || getAccessToken();

    useEffect(() => {
        if (token && PostServiceOpenAPI.TOKEN !== token) {
            PostServiceOpenAPI.TOKEN = token;
            console.log("[HomePage] 已同步 PostServiceOpenAPI.TOKEN");
        }
    }, [token]);

    const fetchHotPosts = useCallback(async (cursor?: number) => {
        if (isLoading || !hasMore) return;
        console.log("HomePage: 正在加载热门帖子，光标:", cursor);
        setIsLoading(true);
        setError(null);

        try {
            if (token && PostServiceOpenAPI.TOKEN !== token) {
                PostServiceOpenAPI.TOKEN = token;
            }

            const response: vo_ListPostsByCursorResponseWrapper = await HotPostsService.getApiV1PostHotPosts({
                limit: 6,
                lastPostId: cursor,
            });

            if (response.code === 0 && response.data) {
                const fetchedPosts = (response.data.posts || []) as vo_PostResponse[];
                const displayPosts: HomePagePostData[] = fetchedPosts
                    .filter(post => post.status === 1)
                    .map(post => ({
                        ...post,
                        formattedCreatedAt: formatTimeAgo(post.created_at),
                    }));

                setPosts(prevPosts => cursor ? [...prevPosts, ...displayPosts] : displayPosts);
                setNextCursor(response.data.next_cursor ?? undefined);
                setHasMore(!!response.data.next_cursor);

                if (!response.data.next_cursor) {
                    console.log("HomePage: 没有更多热门帖子可加载。");
                }
            } else {
                console.error("HomePage: 获取热门帖子失败或无数据", response.message);
                setError(response.message || "加载热门帖子失败");
                setHasMore(false);
            }
        } catch (err: any) {
            console.error("HomePage: 获取热门帖子时发生错误:", err);
            let errorMessage = "加载热门帖子时发生网络错误";
            if (err && typeof err === 'object' && 'body' in err && err.body && typeof err.body.message === 'string') {
                errorMessage = err.body.message;
            } else if (err && typeof err === 'object' && 'message' in err) {
                errorMessage = (err as Error).message || errorMessage;
            }
            setError(errorMessage);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, token]);

    useEffect(() => {
        setPosts([]);
        setNextCursor(undefined);
        setHasMore(true);
        fetchHotPosts(undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!hasMore || isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMore && !isLoading) {
                    console.log("HomePage: 哨兵元素可见，加载下一页，光标:", nextCursor)
                    fetchHotPosts(nextCursor);
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px 300px 0px' }
        );

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) {
                observer.unobserve(currentSentinel);
            }
        };
    }, [isLoading, hasMore, nextCursor, fetchHotPosts]);


    return (
        <div className="bg-[var(--theme-background)] relative">
            <DecorativeShapes />
            <div className="max-w-screen-lg mx-auto px-5 pt-[calc(var(--header-height)+0.5rem)] pb-10 min-h-screen">
                <div className="text-center mb-8 pt-4 md:pt-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-[var(--theme-primary)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                        <TrendingUp size={40} className="inline-block mr-3 mb-1 text-[var(--theme-secondary)] transform group-hover:rotate-[-5deg] transition-transform" />
                        热门动态
                    </h1>
                    <p className="text-md text-[var(--theme-text-secondary)]">
                        看看大家都在关注什么有趣的内容吧！
                    </p>
                </div>

                <div className="mb-8 p-3.5 bg-[var(--theme-card-bg)] rounded-xl thick-border shadow-md flex items-center justify-center text-sm text-[var(--theme-text-secondary)] space-x-2">
                    <Info size={18} className="text-[var(--theme-primary)] flex-shrink-0" />
                    <span>趣站小提示：热门榜单与围观数，每15分钟更新一次哦！🚀</span>
                </div>

                <div className="flex flex-col md:flex-row gap-x-8">
                    <main className="flex-grow max-w-2xl w-full md:w-2/3" id="postListContainer">
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm" role="alert">
                                <strong>加载出错:</strong> {error}
                            </div>
                        )}

                        {posts.map((post) => (
                            <Link
                                href={`/posts/${post.id}`}
                                key={post.id}
                                className="block bg-[var(--theme-card-bg)] thick-border rounded-xl p-6 shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1.5 cursor-pointer mb-7 no-underline"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3.5">
                                        <div className="flex items-center">
                                            <NextImage
                                                src={post.author_avatar || `https://placehold.co/48x48/${['F2C94C','82E0AA','F08080','85C1E9','BB8FCE'][Number(post.id || 0) % 5]}/3A3A3A?text=${post.author_username?.charAt(0) || '趣'}&font=ZCOOL+KuaiLe`}
                                                alt={post.author_username || '作者头像'}
                                                width={48}
                                                height={48}
                                                className="w-12 h-12 rounded-lg object-cover mr-3.5 flex-shrink-0 thick-border-light"
                                                onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/48x48/9E9E9E/FFFFFF?text=${post.author_username?.charAt(0) || '趣'}&font=ZCOOL+KuaiLe`; }}
                                            />
                                            <div>
                                                <span className="block text-lg font-bold text-[var(--theme-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                                                    {post.author_username || '匿名用户'}
                                                </span>
                                                <span className="block text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                                    {post.formattedCreatedAt}
                                                </span>
                                            </div>
                                        </div>
                                        {/* 修正：移除多余的 post.official_tag !== 0 条件 */}
                                        {post.official_tag && officialTagMap[post.official_tag] && (
                                            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm ${officialTagMap[post.official_tag]!.colorClass}`}>
                                                {officialTagMap[post.official_tag]!.icon}
                                                {officialTagMap[post.official_tag]!.text}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-bold text-[var(--theme-primary)] mb-2 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                        {post.title || '无标题帖子'}
                                    </h2>
                                    <div className="mt-4 pt-3 border-t-2 border-dashed border-[var(--theme-border-color)] dark:border-slate-600 text-sm text-[var(--theme-text-secondary)] flex items-center">
                                        <Eye size={16} className="mr-1.5 post-meta-icon" />
                                        <span>{post.view_count?.toLocaleString() || 0} 次围观</span>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {isLoading && (
                            <div className="text-center py-10 text-[var(--theme-text-secondary)] text-base flex flex-col items-center">
                                <svg className="mx-auto mb-2.5 w-8 h-8 animate-spin text-[var(--theme-primary)]" viewBox="0 0 50 50">
                                    <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="currentColor" strokeLinecap="round" strokeDasharray="80, 150" strokeDashoffset="0"></circle>
                                </svg>
                                <p className="font-medium">努力加载中...</p>
                            </div>
                        )}
                        {!isLoading && !hasMore && posts.length > 0 && (
                            <div className="text-center py-10 text-[var(--theme-text-secondary)] text-base">
                                <p className="font-medium">没有更多内容啦 (｡•́︿•̀｡)</p>
                            </div>
                        )}
                        {!isLoading && posts.length === 0 && !error && (
                            <div className="text-center py-20">
                                <MessageSquareText className="mx-auto h-20 w-20 text-slate-400 dark:text-slate-500 mb-6" />
                                <h3 className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">暂无热门帖子</h3>
                                <p className="mt-3 text-md text-slate-500 dark:text-slate-400">
                                    这里空空如也，刷新试试或稍后再来看看吧！
                                </p>
                            </div>
                        )}
                        <div ref={sentinelRef} style={{ height: '1px' }} aria-hidden="true" />
                    </main>

                    <aside className="w-full md:w-1/3 md:max-w-xs flex-shrink-0 py-6 hidden md:block">
                        <div className="sticky top-[calc(var(--header-height)+0.5rem)] space-y-7">
                            <div className="bg-[var(--theme-card-bg)] thick-border rounded-xl p-5">
                                <h3 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-4 pb-2 border-b-2 border-[var(--theme-border-color)] dark:border-slate-600" style={{ fontFamily: 'var(--font-display)' }}>热力榜</h3>
                                {posts.length > 0 ? (
                                    <ul className="space-y-3.5">
                                        {posts.slice(0, 5).map((post, index) => (
                                            <li key={`hot-${post.id || index}`}>
                                                <Link href={`/posts/${post.id}`}
                                                      className="flex items-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)] transition-colors duration-200 group no-underline">
                                                    <span className={`inline-block w-7 text-center mr-2.5 font-bold text-lg ${index < 3 ? 'text-[var(--theme-secondary)]' : 'text-slate-400'} group-hover:text-[var(--theme-primary)]`}>{index + 1}</span>
                                                    <span className="font-medium truncate">{post.title || "无标题帖子"}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-[var(--theme-text-secondary)]">暂无热力榜数据...</p>
                                )}
                            </div>
                            <div className="bg-[var(--theme-card-bg)] thick-border rounded-xl p-5 text-center">
                                <h4 className="text-xl font-bold text-[var(--theme-text-primary)] mb-3" style={{fontFamily: 'var(--font-display)'}}>趣站天气</h4>
                                <div className="flex justify-center items-center space-x-3 text-[var(--theme-secondary)]">
                                    {[<Sun key="sun" size={28}/>, <CloudDrizzle key="cloud" size={28}/>, <Moon key="moon" size={28}/>][new Date().getHours() % 3]}
                                    <span className="text-lg font-medium text-[var(--theme-text-primary)]">今日放晴</span>
                                </div>
                                <p className="text-xs text-[var(--theme-text-secondary)] mt-2">宜：摸鱼、发呆、逛趣站</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
