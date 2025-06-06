// src/app/search/page.tsx
"use client";

import React, {ChangeEvent, FormEvent, useCallback, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import NextImage from 'next/image'; // 明确导入并使用 NextImage
import {
    type models_SearchResult,
    type models_SwaggerSearchResultResponse,
    OpenAPI as PostSearchOpenAPI,
    SearchService,
} from '@/generated-api/post-search';
import {type enums_OfficialTag} from '@/generated-api/post-service';
import {useUserStore} from '@/store/userStore';
import {getAccessToken} from '@/utils/tokenManager';
import {
    AlertTriangle,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    PackageOpen,
    Search as SearchIconLucide,
    Zap
} from 'lucide-react'; // 添加 Eye, BadgeCheck, Zap, Clock
import Link from "next/link";

// 定义帖子卡片期望的数据结构 (驼峰命名)
interface AdaptedEsPostDocumentForCard {
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

// --- 内联搜索结果帖子卡片组件 ---
interface InlineSearchResultCardProps {
    post: AdaptedEsPostDocumentForCard;
}

const InlineSearchResultCard: React.FC<InlineSearchResultCardProps> = ({ post }) => {
    const router = useRouter();
    const displayTime = formatTimeAgo(post.createdAt);
    const postOfficialTagDetails = post.officialTag !== undefined && post.officialTag !== 0
        ? officialTagMap[post.officialTag as Exclude<enums_OfficialTag, 0>]
        : null;

    const handleCardClick = () => {
        if (post.id !== undefined) {
            console.log(`[InlineSearchResultCard] 导航到帖子详情: /posts/${post.id}`);
            router.push(`/posts/${post.id}`);
        } else {
            console.warn("[InlineSearchResultCard] 帖子 ID 未定义，无法导航。");
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


const SearchPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = useUserStore((state) => state.token) || getAccessToken();

    const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
    const [appliedQuery, setAppliedQuery] = useState<string>(searchParams.get('q') || '');

    const [results, setResults] = useState<AdaptedEsPostDocumentForCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
    const [pageSize] = useState<number>(10);
    const [totalResults, setTotalResults] = useState<number>(0);

    useEffect(() => {
        if (token && PostSearchOpenAPI.TOKEN !== token) {
            PostSearchOpenAPI.TOKEN = token;
        }
        document.title = appliedQuery ? `搜索: ${appliedQuery} - 趣站` : '搜索 - 趣站';
    }, [token, appliedQuery]);

    const fetchSearchResults = useCallback(async (query: string, page: number) => {
        if (!query.trim()) {
            setResults([]);
            setTotalResults(0);
            setError(null);
            return;
        }

        console.log(`[SearchPage] 正在获取搜索结果，查询: "${query}", 页码: ${page}`);
        setIsLoading(true);
        setError(null);

        try {
            const response: models_SwaggerSearchResultResponse = await SearchService.getApiV1SearchSearch({
                q: query,
                page: page,
                size: pageSize,
                sortBy: '_score',
                sortOrder: 'desc',
            });

            if (response.code === 0 && response.data) {
                const searchData = response.data as models_SearchResult;
                const adaptedResults: AdaptedEsPostDocumentForCard[] = (searchData.hits || []).map(doc => {
                    let createdAtString: string | undefined = doc.updated_at;
                    if (!createdAtString && typeof doc.created_at === 'number') {
                        try {
                            createdAtString = new Date(doc.created_at * 1000).toISOString();
                        } catch (e) {
                            console.warn(`无法将时间戳 ${doc.created_at} 转换为日期字符串`, e);
                            createdAtString = undefined;
                        }
                    }

                    return {
                        id: doc.id,
                        title: doc.title,
                        authorUsername: doc.author_username,
                        authorAvatar: doc.author_avatar,
                        createdAt: createdAtString,
                        viewCount: doc.view_count,
                        officialTag: doc.official_tag as enums_OfficialTag,
                    };
                });
                setResults(adaptedResults);
                setTotalResults(searchData.total || 0);
                setCurrentPage(page);
            } else {
                setError(response.message || "搜索失败，请稍后再试。");
                setResults([]);
                setTotalResults(0);
            }
        } catch (err: any) {
            console.error("[SearchPage] 获取搜索结果时发生错误:", err);
            let errorMessage = "搜索时发生网络错误。";
            if(err.body && err.body.message) errorMessage = err.body.message;
            else if (err.message) errorMessage = err.message;
            setError(errorMessage);
            setResults([]);
            setTotalResults(0);
        } finally {
            setIsLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        if (appliedQuery) {
            fetchSearchResults(appliedQuery, currentPage);
        } else {
            setResults([]);
            setTotalResults(0);
        }
    }, [appliedQuery, currentPage, fetchSearchResults]);


    const handleSearchSubmit = (e?: FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery) {
            setAppliedQuery(trimmedQuery);
            setCurrentPage(1);
            router.push(`/search?q=${encodeURIComponent(trimmedQuery)}&page=1`);
        } else {
            setAppliedQuery("");
            setResults([]);
            setTotalResults(0);
            router.push('/search');
        }
    };

    const totalPages = Math.ceil(totalResults / pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            setCurrentPage(newPage);
            router.push(`/search?q=${encodeURIComponent(appliedQuery)}&page=${newPage}`);
        }
    };


    return (
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--header-height)+1.5rem)] pb-16 min-h-screen">
            <header className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--theme-primary)] flex items-center justify-center" style={{ fontFamily: 'var(--font-display)' }}>
                    <SearchIconLucide size={32} className="mr-3 transform group-hover:scale-110 transition-transform" /> 探索与发现
                </h1>
                <p className="text-[var(--theme-text-secondary)] mt-2 text-sm">输入关键词，找到你感兴趣的精彩内容！</p>
            </header>

            <form onSubmit={handleSearchSubmit} className="mb-8 p-4 md:p-6 bg-[var(--theme-card-bg)] thick-border rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        placeholder="输入关键词开始搜索..."
                        className="form-input w-full text-base py-2.5 px-4 flex-grow"
                        aria-label="搜索框"
                    />
                    <button
                        type="submit"
                        className="btn-primary w-full sm:w-auto px-6 py-2.5 text-base flex items-center justify-center"
                        disabled={isLoading}
                    >
                        <SearchIconLucide size={18} className="mr-2" />
                        {isLoading ? "搜索中..." : "搜索"}
                    </button>
                </div>
            </form>

            {error && (
                <div className="my-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center shadow" role="alert">
                    <AlertTriangle size={24} className="inline-block mr-2 align-middle" />
                    <strong className="font-bold">搜索出错:</strong> {error}
                </div>
            )}

            {appliedQuery && !isLoading && !error && (
                <div className="mb-4 text-sm text-[var(--theme-text-secondary)]">
                    为“<strong className="text-[var(--theme-text-primary)]">{appliedQuery}</strong>”找到了 {totalResults} 条结果。
                </div>
            )}

            <div className="space-y-7">
                {isLoading && results.length === 0 && (
                    <div className="text-center py-10">
                        <svg className="mx-auto mb-2.5 w-10 h-10 animate-spin text-[var(--theme-primary)]" viewBox="0 0 50 50">
                            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="currentColor"></circle>
                        </svg>
                        <p className="font-medium text-[var(--theme-text-secondary)]">正在努力搜索中...</p>
                    </div>
                )}

                {!isLoading && results.length === 0 && appliedQuery && !error && (
                    <div className="text-center py-20">
                        <PackageOpen size={64} className="mx-auto mb-4 text-slate-400" />
                        <h3 className="text-2xl font-semibold text-[var(--theme-text-primary)] mb-2" style={{fontFamily: 'var(--font-display)'}}>什么也没找到</h3>
                        <p className="text-[var(--theme-text-secondary)]">
                            尝试更换关键词，或者看看<Link href="/latest" className="text-[var(--theme-primary)] hover:underline font-semibold">最新动态</Link>吧！
                        </p>
                    </div>
                )}

                {!isLoading && results.length === 0 && !appliedQuery && !error && (
                    <div className="text-center py-20 text-slate-500">
                        <SearchIconLucide size={64} className="mx-auto mb-4 opacity-50" />
                        <p>输入关键词开始你的探索之旅吧！</p>
                    </div>
                )}

                {results.map((post) => (
                    <InlineSearchResultCard key={post.id} post={post} />
                ))}
            </div>

            {totalResults > pageSize && !isLoading && (
                <div className="mt-10 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                    <span className="text-sm text-[var(--theme-text-secondary)]">
                        共 {totalResults} 条结果，当前第 {currentPage} / {totalPages} 页
                    </span>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="btn-pagination">首页</button>
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="btn-pagination">
                            <ChevronLeft size={18}/>
                        </button>
                        <span className="px-3 py-1.5 border border-[var(--theme-border-color)] rounded-md text-sm bg-[var(--theme-card-bg)] shadow-sm">
                            {currentPage}
                        </span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="btn-pagination">
                            <ChevronRight size={18}/>
                        </button>
                        <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="btn-pagination">末页</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
