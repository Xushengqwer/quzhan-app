// src/app/latest/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image'; // 明确导入并使用 NextImage
import {
    PostsService,
    OpenAPI as PostServiceOpenAPI,
    type vo_PostResponse,
    type enums_OfficialTag,
    type vo_PostTimelinePageResponseWrapper,
    ApiError, // 导入 ApiError 用于类型检查
    // 移除了未使用的 vo_PostTimelinePageVO
} from '@/generated-api/post-service';
import { useUserStore } from '@/store/userStore';
import { getAccessToken } from '@/utils/tokenManager';
import { MessageSquareText, PackageOpen, Filter, Search, RotateCcw, Clock, Eye, BadgeCheck, Zap } from 'lucide-react'; // 添加 Eye, BadgeCheck, Zap 图标

// 定义帖子卡片期望的数据结构 (驼峰命名)
interface LatestPostDataForCard {
    id?: number;
    title?: string;
    authorUsername?: string;
    authorAvatar?: string;
    createdAt?: string;
    viewCount?: number;
    officialTag?: enums_OfficialTag;
}

// --- 辅助函数 (从原 TimelinePostCard 移入) ---
function formatTimeAgo(dateString?: string | null): string {
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

// 官方标签映射表 (从原 TimelinePostCard 移入)
const officialTagMap: { [key in enums_OfficialTag]?: { text: string; icon: React.ReactNode; colorClass: string } } = {
    1: { text: "官方认证", icon: <BadgeCheck size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-blue-100 text-blue-700" },
    2: { text: "保证金商家", icon: <Zap size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-green-100 text-green-700" },
    3: { text: "急速响应", icon: <Clock size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-yellow-100 text-yellow-700" },
};


// --- 内联帖子卡片组件 ---
interface InlinePostCardProps {
    post: LatestPostDataForCard;
}

const InlinePostCard: React.FC<InlinePostCardProps> = ({ post }) => {
    const router = useRouter(); // router 在这里被使用了，所以保留
    const displayTime = formatTimeAgo(post.createdAt);
    const postOfficialTagDetails = post.officialTag !== undefined && post.officialTag !== 0
        ? officialTagMap[post.officialTag as Exclude<enums_OfficialTag, 0>]
        : null;

    const handleCardClick = () => {
        if (post.id !== undefined) {
            console.log(`[InlinePostCard] 导航到帖子详情: /posts/${post.id}`);
            router.push(`/posts/${post.id}`);
        } else {
            console.warn("[InlinePostCard] 帖子 ID 未定义，无法导航。");
        }
    };

    const authorAvatarSrc = post.authorAvatar || `https://placehold.co/48x48/${['F2C94C','82E0AA','F08080','85C1E9','BB8FCE'][Number(post.id || 0) % 5]}/3A3A3A?text=${post.authorUsername?.charAt(0) || '趣'}&font=ZCOOL+KuaiLe`;

    return (
        <div
            onClick={handleCardClick}
            className="bg-[var(--theme-card-bg)] thick-border rounded-xl p-5 md:p-6 shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
        >
            <div className="flex items-center mb-3.5">
                <NextImage
                    src={authorAvatarSrc}
                    alt={post.authorUsername || '作者头像'}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg object-cover mr-3.5 flex-shrink-0 thick-border-light"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/48x48/9E9E9E/FFFFFF?text=${post.authorUsername?.charAt(0) || '趣'}&font=ZCOOL+KuaiLe`; }}
                />
                <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2">
                        <span className="block text-lg font-bold text-[var(--theme-text-primary)] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                            {post.authorUsername || '匿名用户'}
                        </span>
                        {postOfficialTagDetails && (
                            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm ${postOfficialTagDetails.colorClass}`}>
                                {postOfficialTagDetails.icon}
                                {postOfficialTagDetails.text}
                            </span>
                        )}
                    </div>
                    <span className="block text-xs text-[var(--theme-text-secondary)] mt-0.5">
                        {displayTime}
                    </span>
                </div>
            </div>
            <h2
                className="text-xl md:text-2xl font-bold text-[var(--theme-primary)] mb-3 leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
            >
                {post.title || '无标题帖子'}
            </h2>
            <div className="mt-4 pt-3 border-t-2 border-dashed border-[var(--theme-border-color)] text-sm text-[var(--theme-text-secondary)] flex items-center">
                <Eye size={16} className="mr-1.5 post-meta-icon" />
                <span>{post.viewCount?.toLocaleString() || 0} 次围观</span>
            </div>
        </div>
    );
};


const LatestPostsPage = () => {
    const token = useUserStore((state) => state.token) || getAccessToken();
    // 移除了未使用的 router
    // const router = useRouter();

    const [posts, setPosts] = useState<LatestPostDataForCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [lastCreatedAt, setLastCreatedAt] = useState<string | undefined>(undefined);
    const [lastPostId, setLastPostId] = useState<number | undefined>(undefined);
    // 移除了未使用的 setPageSize
    const [pageSize] = useState(10);
    const [hasMore, setHasMore] = useState(true);

    const [filterTitle, setFilterTitle] = useState<string>("");
    const [filterAuthorUsername, setFilterAuthorUsername] = useState<string>("");
    const [filterOfficialTag, setFilterOfficialTag] = useState<enums_OfficialTag | "">("");

    const [appliedFilters, setAppliedFilters] = useState<{
        title?: string;
        authorUsername?: string;
        officialTag?: enums_OfficialTag;
    }>({});

    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (token && PostServiceOpenAPI.TOKEN !== token) {
            PostServiceOpenAPI.TOKEN = token;
        }
    }, [token]);

    const fetchLatestPosts = useCallback(async (reset: boolean = false, currentFilters = appliedFilters) => {
        if (isLoading && !reset) return;
        if (!hasMore && !reset) return;

        console.log(`[LatestPostsPage] 正在获取帖子。是否重置: ${reset}, 筛选条件:`, currentFilters);
        setIsLoading(true);
        setError(null);

        const nextLastCreatedAt = reset ? undefined : lastCreatedAt;
        const nextLastPostId = reset ? undefined : lastPostId;

        if (reset) {
            setPosts([]);
            setHasMore(true);
        }

        try {
            if (token && PostServiceOpenAPI.TOKEN !== token) {
                PostServiceOpenAPI.TOKEN = token;
            }

            const response: vo_PostTimelinePageResponseWrapper = await PostsService.getApiV1PostPostsTimeline({
                lastCreatedAt: nextLastCreatedAt,
                lastPostId: nextLastPostId,
                pageSize: pageSize,
                title: currentFilters.title || undefined,
                authorUsername: currentFilters.authorUsername || undefined,
                officialTag: currentFilters.officialTag,
            });

            if (response.code === 0 && response.data) {
                const fetchedRawPosts = (response.data.posts || []) as vo_PostResponse[];
                const newPostsForCardList: LatestPostDataForCard[] = fetchedRawPosts.map(rawPost => ({
                    id: rawPost.id,
                    title: rawPost.title,
                    authorUsername: rawPost.author_username,
                    authorAvatar: rawPost.author_avatar,
                    createdAt: rawPost.created_at,
                    viewCount: rawPost.view_count,
                    officialTag: rawPost.official_tag,
                }));

                setPosts(prevPosts => reset ? newPostsForCardList : [...prevPosts, ...newPostsForCardList]);
                setLastCreatedAt(response.data.nextCreatedAt || undefined);
                setLastPostId(response.data.nextPostId || undefined);

                if (!response.data.nextPostId || newPostsForCardList.length < pageSize) {
                    setHasMore(false);
                    console.log("[LatestPostsPage] 没有更多帖子可加载。");
                } else {
                    setHasMore(true);
                }
            } else {
                console.error("[LatestPostsPage] 获取帖子失败或无帖子数据", response.message);
                setError(response.message || "加载最新帖子失败");
                setHasMore(false);
            }
        } catch (err: unknown) { // 修改为 unknown
            console.error("[LatestPostsPage] 获取最新帖子时发生错误:", err);
            let errorMessage = "加载帖子时发生网络错误";
            if (err instanceof ApiError) {
                // 假设 ApiError.body 可能包含 message 字段
                const body = err.body as { message?: string };
                errorMessage = body?.message || err.message || errorMessage;
            } else if (err instanceof Error) {
                errorMessage = err.message || errorMessage;
            }
            setError(errorMessage);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [token, pageSize, appliedFilters, isLoading, hasMore, lastCreatedAt, lastPostId]);

    useEffect(() => {
        fetchLatestPosts(true, appliedFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters]);

    useEffect(() => {
        if (isLoading || !hasMore) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    fetchLatestPosts(false, appliedFilters);
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px 300px 0px' }
        );
        const currentSentinel = sentinelRef.current;
        if (currentSentinel) observer.observe(currentSentinel);
        return () => { if (currentSentinel) observer.unobserve(currentSentinel); };
    }, [isLoading, hasMore, fetchLatestPosts, appliedFilters]);

    const handleApplyFilters = () => {
        setAppliedFilters({
            title: filterTitle || undefined,
            authorUsername: filterAuthorUsername || undefined,
            officialTag: filterOfficialTag === "" ? undefined : filterOfficialTag as enums_OfficialTag,
        });
    };

    const handleResetFilters = () => {
        setFilterTitle("");
        setFilterAuthorUsername("");
        setFilterOfficialTag("");
        setAppliedFilters({});
    };

    return (
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--header-height)+1.5rem)] pb-16 min-h-screen">
            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--theme-primary)] flex items-center justify-center" style={{ fontFamily: 'var(--font-display)' }}>
                    <Clock size={32} className="mr-3 transform group-hover:rotate-[-10deg] transition-transform" /> 最新动态
                </h1>
                <p className="text-[var(--theme-text-secondary)] mt-2 text-sm">发现社区里正在发生的新鲜事！</p>
            </div>

            <div className="bg-[var(--theme-card-bg)] thick-border rounded-xl p-4 md:p-6 mb-8 shadow-md">
                <h2 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-4 flex items-center">
                    <Filter size={20} className="mr-2 text-[var(--theme-primary)]" /> 筛选动态
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label htmlFor="filterTitleLatest" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">标题</label>
                        <input
                            type="text"
                            id="filterTitleLatest"
                            value={filterTitle}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterTitle(e.target.value)}
                            placeholder="搜索帖子标题..."
                            className="form-input w-full text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="filterAuthorLatest" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">作者用户名</label>
                        <input
                            type="text"
                            id="filterAuthorLatest"
                            value={filterAuthorUsername}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterAuthorUsername(e.target.value)}
                            placeholder="搜索作者..."
                            className="form-input w-full text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="filterOfficialTagLatest" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">官方标签</label>
                        <select
                            id="filterOfficialTagLatest"
                            value={filterOfficialTag}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterOfficialTag(e.target.value === "" ? "" : Number(e.target.value) as enums_OfficialTag | "")}
                            className="form-select w-full text-sm"
                        >
                            <option value="">全部标签</option>
                            <option value="0">无标签</option>
                            <option value="1">官方认证</option>
                            <option value="2">保证金商家</option>
                            <option value="3">急速响应</option>
                        </select>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                        onClick={handleResetFilters}
                        className="btn-secondary text-sm px-4 py-2 flex items-center justify-center"
                    >
                        <RotateCcw size={16} className="mr-1.5" /> 重置
                    </button>
                    <button
                        onClick={handleApplyFilters}
                        className="btn-primary text-sm px-5 py-2 flex items-center justify-center"
                    >
                        <Search size={16} className="mr-1.5" /> 应用筛选
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center shadow" role="alert">
                    <strong className="font-bold">加载出错:</strong> {error}
                </div>
            )}

            <div id="latestPostListContainer" className="space-y-7">
                {posts.map((post) => (
                    <InlinePostCard
                        key={post.id}
                        post={post}
                    />
                ))}
            </div>

            <div ref={sentinelRef} id="latestPostsLoaderIndicator" className="text-center py-10 text-[var(--theme-text-secondary)] text-base">
                {isLoading && (
                    <>
                        <svg className="mx-auto mb-2.5 w-8 h-8 animate-spin text-[var(--theme-primary)]" viewBox="0 0 50 50">
                            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="currentColor" strokeLinecap="round" strokeDasharray="80, 150" strokeDashoffset="0"></circle>
                        </svg>
                        <p className="font-medium">努力加载中...</p>
                    </>
                )}
                {!isLoading && !hasMore && posts.length > 0 && (
                    <div className="text-center py-10 text-[var(--theme-text-secondary)] text-base">
                        <PackageOpen size={48} className="mx-auto mb-3 text-slate-400" />
                        <p className="font-medium">没有更多动态啦 (｡•́︿•̀｡)</p>
                    </div>
                )}
                {!isLoading && posts.length === 0 && !error && (
                    <div className="text-center py-20">
                        <MessageSquareText className="mx-auto h-20 w-20 text-slate-400 dark:text-slate-500 mb-6" />
                        <h3 className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100" style={{fontFamily: 'var(--font-display)'}}>暂无动态</h3>
                        <p className="mt-3 text-md text-slate-500 dark:text-slate-400">
                            这里空空如也，调整筛选条件或稍后再来看看吧！
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LatestPostsPage;