// src/app/search/page.tsx
"use client";

import React, {ChangeEvent, FormEvent, useCallback, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import NextImage from 'next/image';
import {
    ApiError,
    type models_EsPostDocument,
    type models_HotSearchTerm,
    type models_SearchResult,
    type models_SwaggerHotSearchTermsResponse,
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
    Flame, // 新增：火焰图标
    PackageOpen,
    Search as SearchIconLucide,
    Zap
} from 'lucide-react';
import Link from "next/link";

// --- 更新的类型定义 ---
interface AdaptedEsPostDocumentForCard extends models_EsPostDocument {
    // 将 highlights 直接包含进来
}

interface HotSearchTerm extends models_HotSearchTerm {} // 方便使用

// --- 辅助函数 (保持不变) ---
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

const officialTagMap: { [key in enums_OfficialTag]?: { text: string; icon: React.ReactNode; colorClass: string } } = {
    1: { text: "官方认证", icon: <BadgeCheck size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-blue-100 text-blue-700" },
    2: { text: "保证金商家", icon: <Zap size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-green-100 text-green-700" },
    3: { text: "急速响应", icon: <Clock size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-yellow-100 text-yellow-700" },
};

// --- 更新后的搜索结果卡片组件 ---
interface InlineSearchResultCardProps {
    post: AdaptedEsPostDocumentForCard;
}

const InlineSearchResultCard: React.FC<InlineSearchResultCardProps> = ({ post }) => {
    const router = useRouter();
    const displayTime = formatTimeAgo(post.updated_at);
    const postOfficialTagDetails = post.official_tag !== undefined && post.official_tag !== 0
        ? officialTagMap[post.official_tag as Exclude<enums_OfficialTag, 0>]
        : null;

    const handleCardClick = () => {
        if (post.id !== undefined) {
            router.push(`/posts/${post.id}`);
        }
    };

    // 优先使用高亮标题，否则使用原始标题
    const titleHtml = post.highlights?.title?.join(' ... ') || post.title || '无标题帖子';
    // 优先使用高亮内容，否则截取部分原始内容作为摘要
    const contentSnippetHtml = post.highlights?.content?.join(' ... ')
        || (post.content ? `${post.content.substring(0, 100)}...` : '暂无内容摘要');

    const firstImage = post.images && post.images.length > 0 ? post.images[0]?.image_url : null;
    const authorAvatarSrc = post.author_avatar || `https://placehold.co/48x48/${['F2C94C','82E0AA','F08080','85C1E9','BB8FCE'][Number(post.id || 0) % 5]}/3A3A3A?text=${post.author_username?.charAt(0) || '趣'}&font=ZCOOL+KuaiLe`;

    return (
        <div
            onClick={handleCardClick}
            className="bg-[var(--theme-card-bg)] thick-border rounded-xl p-5 md:p-6 shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col sm:flex-row gap-5"
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
        >
            {firstImage && (
                <div className="flex-shrink-0 w-full sm:w-32 md:w-40 h-32 sm:h-auto rounded-lg overflow-hidden thick-border-light">
                    <NextImage
                        src={firstImage}
                        alt={post.title || '帖子图片'}
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="flex flex-col flex-grow">
                <div className="flex items-center mb-2.5">
                    <NextImage
                        src={authorAvatarSrc}
                        alt={post.author_username || '作者头像'}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover mr-2 flex-shrink-0"
                    />
                    <div className="text-sm text-[var(--theme-text-secondary)]">
                        <span className="font-semibold text-[var(--theme-text-primary)]">{post.author_username || '匿名用户'}</span>
                        <span className="mx-1.5">·</span>
                        <span>{displayTime}</span>
                    </div>
                </div>

                <h2
                    className="text-xl font-bold text-[var(--theme-primary)] mb-2 leading-tight search-highlight"
                    style={{ fontFamily: 'var(--font-display)' }}
                    dangerouslySetInnerHTML={{ __html: titleHtml }}
                />

                <p
                    className="text-sm text-[var(--theme-text-secondary)] mb-3 leading-relaxed search-highlight"
                    dangerouslySetInnerHTML={{ __html: contentSnippetHtml }}
                />

                <div className="mt-auto pt-3 border-t border-dashed border-[var(--theme-border-color)] text-xs text-[var(--theme-text-secondary)] flex items-center justify-between">
                    <div className="flex items-center">
                        <Eye size={14} className="mr-1.5 post-meta-icon" />
                        <span>{post.view_count?.toLocaleString() || 0} 次围观</span>
                    </div>
                    {postOfficialTagDetails && (
                        <span className={`inline-flex items-center font-semibold px-2 py-0.5 rounded-full shadow-sm ${postOfficialTagDetails.colorClass}`}>
                            {postOfficialTagDetails.icon}
                            {postOfficialTagDetails.text}
                        </span>
                    )}
                </div>
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
    const [hotTerms, setHotTerms] = useState<HotSearchTerm[]>([]); // 新增：热门搜索词状态
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);
    const [pageSize] = useState<number>(10);
    const [totalResults, setTotalResults] = useState<number>(0);

    useEffect(() => {
        if (token && PostSearchOpenAPI.TOKEN !== token) {
            PostSearchOpenAPI.TOKEN = token;
        }
        document.title = appliedQuery ? `搜索: "${appliedQuery}" - 趣站` : '探索 - 趣站';
    }, [token, appliedQuery]);

    // 新增：获取热门搜索词的 useEffect
    useEffect(() => {
        const fetchHotTerms = async () => {
            try {
                const response: models_SwaggerHotSearchTermsResponse = await SearchService.getApiV1SearchHotTerms({ limit: 8 });
                if (response.code === 0 && Array.isArray(response.data)) {
                    setHotTerms(response.data);
                }
            } catch (err) {
                console.error("获取热门搜索词失败:", err);
            }
        };
        fetchHotTerms();
    }, []);

    const fetchSearchResults = useCallback(async (query: string, page: number) => {
        if (!query.trim()) {
            setResults([]);
            setTotalResults(0);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response: models_SwaggerSearchResultResponse = await SearchService.getApiV1SearchSearch({
                q: query, page, size: pageSize, sortBy: '_score', sortOrder: 'desc',
            });

            if (response.code === 0 && response.data) {
                const searchData = response.data as models_SearchResult;
                setResults(searchData.hits || []);
                setTotalResults(searchData.total || 0);
                setCurrentPage(page);
            } else {
                setError(response.message || "搜索失败，请稍后再试。");
                setResults([]);
                setTotalResults(0);
            }
        } catch (err: unknown) {
            let errorMessage = "搜索时发生网络错误。";
            if (err instanceof ApiError) {
                errorMessage = (err.body as { message?: string })?.message || err.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
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
        if (trimmedQuery && trimmedQuery !== appliedQuery) {
            setAppliedQuery(trimmedQuery);
            setCurrentPage(1);
            router.push(`/search?q=${encodeURIComponent(trimmedQuery)}&page=1`);
        }
    };

    const handleHotTermClick = (term: string) => {
        setSearchQuery(term);
        setAppliedQuery(term);
        setCurrentPage(1);
        router.push(`/search?q=${encodeURIComponent(term)}&page=1`);
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
            <header className="mb-6 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--theme-primary)] flex items-center justify-center" style={{ fontFamily: 'var(--font-display)' }}>
                    <SearchIconLucide size={32} className="mr-3 transform group-hover:scale-110 transition-transform" /> 探索与发现
                </h1>
                <p className="text-[var(--theme-text-secondary)] mt-2 text-sm">输入关键词，找到你感兴趣的精彩内容！</p>
            </header>

            <form onSubmit={handleSearchSubmit} className="mb-4 p-4 bg-[var(--theme-card-bg)] thick-border rounded-xl shadow-lg sticky top-[var(--header-height)] z-10">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        placeholder="输入关键词开始搜索..."
                        className="form-input w-full text-base py-2.5 px-4 flex-grow"
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

            {hotTerms.length > 0 && !appliedQuery && (
                <div className="mb-8 text-center">
                    <h3 className="text-sm font-semibold text-[var(--theme-text-secondary)] mb-2 flex items-center justify-center">
                        <Flame size={16} className="mr-1.5 text-red-500" /> 热门搜索
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {hotTerms.map((hotTerm) => (
                            <button
                                key={hotTerm.term}
                                onClick={() => handleHotTermClick(hotTerm.term!)}
                                className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 hover:text-[var(--theme-primary)] transition-colors"
                            >
                                {hotTerm.term}
                            </button>
                        ))}
                    </div>
                </div>
            )}


            {error && (
                <div className="my-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center shadow" role="alert">
                    <AlertTriangle size={24} className="inline-block mr-2 align-middle" />
                    <strong className="font-bold">搜索出错:</strong> {error}
                </div>
            )}

            {appliedQuery && !isLoading && !error && (
                <div className="my-4 text-sm text-[var(--theme-text-secondary)]">
                    为“<strong className="text-[var(--theme-text-primary)]">{appliedQuery}</strong>”找到了 {totalResults} 条结果。
                </div>
            )}

            <div className="space-y-6">
                {isLoading && (
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
                    <div className="text-center py-20 text-slate-400">
                        <SearchIconLucide size={64} className="mx-auto mb-4 opacity-40" />
                        <p>输入关键词，或者点击一个热门词条开始你的探索之旅吧！</p>
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

