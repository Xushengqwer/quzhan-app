// src/app/my-posts/page.tsx
"use client";

import React, {ChangeEvent, useCallback, useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
    type enums_OfficialTag,
    type enums_Status,
    OpenAPI as PostServiceOpenAPI,
    PostsService,
    type vo_BaseResponseWrapper,
    type vo_ListUserPostPageResponseWrapper,
    type vo_PostResponse,
} from '@/generated-api/post-service';
import {useUserStore} from '@/store/userStore';
import {getAccessToken} from '@/utils/tokenManager';
import withAuth from '@/components/auth/withAuth';
import {ROLES} from '@/config/authConfig';
import {AlertTriangle, CheckCircle, Filter, MessageSquareText, PackageOpen, RotateCcw, Search} from 'lucide-react';
import MyPostCard from './components/MyPostCard';

// --- 我的帖子页面组件 ---
const MyPostsPage = () => {
    const router = useRouter();
    const token = useUserStore((state) => state.token) || getAccessToken();

    const [posts, setPosts] = useState<vo_PostResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentDeletingPostId, setCurrentDeletingPostId] = useState<number | null | undefined>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const [totalPosts, setTotalPosts] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [filterTitle, setFilterTitle] = useState<string>("");
    const [filterOfficialTag, setFilterOfficialTag] = useState<enums_OfficialTag | "">("");
    const [filterStatus, setFilterStatus] = useState<enums_Status | "">("");

    const [appliedFilters, setAppliedFilters] = useState<{
        title?: string;
        officialTag?: enums_OfficialTag;
        status?: enums_Status;
    }>({});

    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (token && PostServiceOpenAPI.TOKEN !== token) {
            PostServiceOpenAPI.TOKEN = token;
            console.log("[MyPostsPage] 已同步 PostServiceOpenAPI.TOKEN");
        }
    }, [token]);

    const fetchMyPosts = useCallback(async (pageToFetch: number, reset: boolean = false, currentFilters = appliedFilters) => {
        if (isLoading && !reset) return;
        if (!hasMore && pageToFetch > currentPage && !reset) return;

        console.log(`[MyPostsPage] 正在获取帖子。页码: ${pageToFetch}, 是否重置: ${reset}, 筛选条件:`, currentFilters);
        setIsLoading(true);
        setError(null);

        let currentPostsState: vo_PostResponse[] = [];
        if (reset) {
            setPosts([]);
            setCurrentPage(1);
            setHasMore(true);
            pageToFetch = 1;
        } else {
            currentPostsState = posts;
        }

        try {
            if (token && PostServiceOpenAPI.TOKEN !== token) {
                PostServiceOpenAPI.TOKEN = token;
            }

            const response: vo_ListUserPostPageResponseWrapper = await PostsService.getApiV1PostPostsMine({
                page: pageToFetch,
                pageSize: pageSize,
                title: currentFilters.title || undefined,
                officialTag: currentFilters.officialTag,
                status: currentFilters.status,
            });

            if (response.code === 0 && response.data) {
                const fetchedPosts = (response.data.posts || []);
                setPosts(prevPosts => (pageToFetch === 1 || reset) ? fetchedPosts : [...prevPosts, ...fetchedPosts]);
                setTotalPosts(response.data.total || 0);

                const newTotalFetched = (pageToFetch === 1 || reset) ? fetchedPosts.length : currentPostsState.length + fetchedPosts.length;

                if (newTotalFetched >= (response.data.total || 0) || fetchedPosts.length < pageSize) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
                setCurrentPage(pageToFetch);
            } else {
                console.error("[MyPostsPage] 获取帖子失败或无数据", response.message);
                setError(response.message || "加载我的帖子失败");
                setHasMore(false);
            }
        } catch (err: unknown) { // *** 第 1 处修复 ***
            console.error("[MyPostsPage] 获取我的帖子时发生错误:", err);
            let errorMessage = "加载帖子时发生网络错误";
            // 安全地检查 err.body 和 err.body.message
            if (typeof err === 'object' && err !== null && 'body' in err && typeof (err as { body: unknown }).body === 'object' && (err as { body: object | null }).body !== null && 'message' in (err as { body: object }).body) {
                errorMessage = (err as { body: { message: string } }).body.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setError(errorMessage);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [token, pageSize, appliedFilters, posts, currentPage, hasMore, isLoading]);

    useEffect(() => {
        fetchMyPosts(1, true, appliedFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters]);

    useEffect(() => {
        if (isLoading || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    console.log("[MyPostsPage] 哨兵元素可见，获取下一页。");
                    fetchMyPosts(currentPage + 1, false, appliedFilters);
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
    }, [isLoading, hasMore, currentPage, fetchMyPosts, appliedFilters]);

    const handleApplyFilters = () => {
        setSuccessMessage(null);
        setError(null);
        setAppliedFilters({
            title: filterTitle || undefined,
            officialTag: filterOfficialTag === "" ? undefined : filterOfficialTag,
            status: filterStatus === "" ? undefined : filterStatus,
        });
    };

    const handleResetFilters = () => {
        setSuccessMessage(null);
        setError(null);
        setFilterTitle("");
        setFilterOfficialTag("");
        setFilterStatus("");
        setAppliedFilters({});
    };

    const handleEditPost = (postId?: number) => {
        if (typeof postId === 'undefined') return;
        router.push(`/publish?edit=${postId}`);
    };

    const handleDeletePost = async (postId?: number) => {
        if (typeof postId === 'undefined' || isDeleting) return;

        const confirmed = window.confirm(`确定要删除帖子ID为 ${postId} 的帖子吗？此操作不可撤销。`);

        if (!confirmed) return;

        setIsDeleting(true);
        setCurrentDeletingPostId(postId);
        setError(null); setSuccessMessage(null);

        try {
            const response: vo_BaseResponseWrapper = await PostsService.deleteApiV1PostPosts({ id: postId });
            if (response.code === 0) {
                setSuccessMessage(`帖子 #${postId} 删除成功！`);
                setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
                const newTotal = totalPosts - 1;
                setTotalPosts(newTotal);
                if (posts.filter(p => p.id !== postId).length === 0 && currentPage > 1) {
                    fetchMyPosts(currentPage - 1, false, appliedFilters);
                } else if (newTotal === 0) {
                    setHasMore(false);
                }
            } else {
                setError(response.message || `删除帖子 #${postId} 失败`);
            }
        } catch (err: unknown) { // *** 第 2 处修复 ***
            let errorMessage = `删除帖子 #${postId} 时发生网络错误`;
            // 安全地检查 err.body 和 err.body.message
            if (typeof err === 'object' && err !== null && 'body' in err && typeof (err as { body: unknown }).body === 'object' && (err as { body: object | null }).body !== null && 'message' in (err as { body: object }).body) {
                errorMessage = (err as { body: { message: string } }).body.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setIsDeleting(false);
            setCurrentDeletingPostId(null);
        }
    };

    return (
        <div className="max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--header-height)+1.5rem)] pb-16 min-h-screen">
            <div className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--theme-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                    <span className="inline-block mr-2 transform group-hover:rotate-[-5deg] transition-transform">📜</span> 我的帖子们
                </h1>
                <p className="text-[var(--theme-text-secondary)] mt-2 text-sm">这里记录了你所有的奇思妙想和开心瞬间！</p>
            </div>

            <div className="bg-[var(--theme-card-bg)] thick-border rounded-xl p-4 md:p-6 mb-8 shadow-md">
                <h2 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-4 flex items-center">
                    <Filter size={20} className="mr-2 text-[var(--theme-primary)]" /> 筛选帖子
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label htmlFor="filterTitle" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">标题</label>
                        <input
                            type="text"
                            id="filterTitle"
                            value={filterTitle}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterTitle(e.target.value)}
                            placeholder="搜索帖子标题..."
                            className="form-input w-full text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="filterOfficialTag" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">官方标签</label>
                        <select
                            id="filterOfficialTag"
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
                    <div>
                        <label htmlFor="filterStatus" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">审核状态</label>
                        <select
                            id="filterStatus"
                            value={filterStatus}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value === "" ? "" : Number(e.target.value) as enums_Status | "")}
                            className="form-select w-full text-sm"
                        >
                            <option value="">所有状态</option>
                            <option value="0">待审核</option>
                            <option value="1">已发布</option>
                            <option value="2">已拒绝</option>
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

            {successMessage && (
                <div className="mb-6 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-lg text-sm text-center shadow flex items-center" role="alert">
                    <CheckCircle size={20} className="mr-2 flex-shrink-0" /> {successMessage}
                </div>
            )}
            {error && (
                <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg text-center shadow flex items-center" role="alert">
                    <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                    <strong className="font-bold">出错了:</strong> {error}
                </div>
            )}

            <div className="mb-4 text-sm text-[var(--theme-text-secondary)]">
                共找到 {totalPosts} 条帖子
            </div>

            <div id="myPostListContainer" className="space-y-7">
                {posts.map((post) => (
                    <MyPostCard
                        key={post.id}
                        post={post}
                        onEdit={handleEditPost}
                        onDelete={handleDeletePost}
                        isDeleting={isDeleting && currentDeletingPostId === post.id}
                        currentDeletingPostId={currentDeletingPostId}
                    />
                ))}
            </div>

            <div ref={sentinelRef} id="myPostsLoaderIndicator" className="text-center py-10 text-[var(--theme-text-secondary)] text-base">
                {isLoading && !isDeleting && (
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
                        <p className="font-medium">没有更多帖子啦 (｡•́︿•̀｡)</p>
                    </div>
                )}
                {!isLoading && posts.length === 0 && !error && (
                    <div className="text-center py-20">
                        <MessageSquareText className="mx-auto h-20 w-20 text-slate-400 dark:text-slate-500 mb-6" />
                        <h3 className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100" style={{fontFamily: 'var(--font-display)'}}>空空如也</h3>
                        <p className="mt-3 text-md text-slate-500 dark:text-slate-400">
                            没有找到符合条件的帖子，调整筛选试试？或者<a href="/publish" className="text-[var(--theme-primary)] hover:underline font-semibold">发布</a>一个新帖子！
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default withAuth(MyPostsPage, {
    allowedRoles: [ROLES.USER, ROLES.ADMIN],
    LoadingComponent: () => (
        <div className="flex justify-center items-center min-h-screen pt-[var(--header-height)]">
            <svg className="animate-spin h-10 w-10 text-[var(--theme-primary)]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-lg text-[var(--theme-text-secondary)]">正在加载页面...</p>
        </div>
    ),
});
