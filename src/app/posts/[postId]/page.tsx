// src/app/posts/[postId]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image'; // 确保 Image 组件已导入
import {
    PostsService,
    OpenAPI as PostServiceOpenAPI,
    type vo_PostDetailVO,
    type vo_PostDetailResponseWrapper,
    type enums_OfficialTag,
    type vo_PostImageVO, // <--- 确保导入 vo_PostImageVO
    ApiError,
} from '@/generated-api/post-service';
import { useUserStore } from '@/store/userStore';
import { getAccessToken } from '@/utils/tokenManager';
import { ArrowLeft, CalendarDays, RefreshCw, Tag, MessageSquare, AlertTriangle, Eye, BadgeCheck, Zap, Clock, Phone, Image as ImageIcon } from 'lucide-react'; // 新增 ImageIcon

// ... (保持 formatTimestamp 和 officialTagMap 不变) ...
function formatTimestamp(dateString?: string | null, locale: string = 'zh-CN'): string {
    if (!dateString) return '未知时间';
    try {
        return new Date(dateString).toLocaleString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (_error) {
        console.warn(`[formatTimestamp] 格式化日期时出错: ${dateString}`, _error);
        return dateString;
    }
}

const officialTagMap: { [key in enums_OfficialTag]?: { text: string; icon: React.ReactNode; colorClass: string } } = {
    1: { text: "官方认证", icon: <BadgeCheck size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-blue-100 text-blue-700" },
    2: { text: "保证金商家", icon: <Zap size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-green-100 text-green-700" },
    3: { text: "急速响应", icon: <Clock size={12} className="mr-1 official-tag-icon" />, colorClass: "bg-yellow-100 text-yellow-700" },
};


const PostDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const postIdFromUrl = params.postId ? Number(params.postId) : null;

    const token = useUserStore((state) => state.token) || getAccessToken();
    const currentUser = useUserStore((state) => state.user);

    const [postDetail, setPostDetail] = useState<vo_PostDetailVO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 用于图片模态框的状态
    const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
    const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);

    const openImageModal = (src: string) => {
        setImageModalSrc(src);
        setIsImageModalOpen(true);
    };

    const closeImageModal = () => {
        setIsImageModalOpen(false);
        setImageModalSrc(null);
    };


    useEffect(() => {
        if (token && PostServiceOpenAPI.TOKEN !== token) {
            PostServiceOpenAPI.TOKEN = token;
            console.log("[PostDetailPage] 已同步 PostServiceOpenAPI.TOKEN");
        }
    }, [token]);

    useEffect(() => {
        if (postIdFromUrl === null || isNaN(postIdFromUrl)) {
            setError("无效的帖子ID。");
            setIsLoading(false);
            return;
        }

        const fetchPostDetail = async () => {
            setIsLoading(true);
            setError(null);
            try {
                console.log(`[PostDetailPage] 正在获取帖子详情，ID: ${postIdFromUrl}`);
                const response: vo_PostDetailResponseWrapper = await PostsService.getApiV1PostPosts({
                    postId: postIdFromUrl,
                    xUserId: currentUser?.user_id || undefined,
                });
                console.log("[PostDetailPage] API 响应:", response);

                if (response.code === 0 && response.data) {
                    // 对图片按 display_order 排序
                    if (response.data.images && response.data.images.length > 0) {
                        response.data.images.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                    }
                    setPostDetail(response.data);
                } else {
                    setError(response.message || `未能加载帖子详情 (ID: ${postIdFromUrl})。`);
                    setPostDetail(null);
                }
            } catch (err: unknown) {
                console.error(`[PostDetailPage] 获取帖子详情 (ID: ${postIdFromUrl}) 时发生错误:`, err);
                let errorMessage = `加载帖子详情时发生网络错误。`;
                if (err instanceof ApiError) {
                    errorMessage = (err.body as { message?: string })?.message || err.message || errorMessage;
                } else if (err instanceof Error) {
                    errorMessage = err.message || errorMessage;
                }
                setError(errorMessage);
                setPostDetail(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPostDetail();
    }, [postIdFromUrl, token, currentUser?.user_id]);

    // ... (保持 isLoading, error, !postDetail 的返回逻辑不变) ...
    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-var(--header-height)-4rem)] pt-[var(--header-height)] text-center">
                <svg className="animate-spin h-12 w-12 text-[var(--theme-primary)] mb-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xl text-[var(--theme-text-secondary)] font-medium">正在加载帖子内容...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-var(--header-height)-4rem)] pt-[var(--header-height)] text-center px-4">
                <AlertTriangle size={64} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-semibold text-red-600 mb-2">加载失败</h2>
                <p className="text-[var(--theme-text-secondary)] mb-6">{error}</p>
                <button
                    onClick={() => router.back()}
                    className="btn-secondary px-6 py-2 flex items-center"
                >
                    <ArrowLeft size={18} className="mr-2" /> 返回上一页
                </button>
            </div>
        );
    }

    if (!postDetail) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-var(--header-height)-4rem)] pt-[var(--header-height)] text-center px-4">
                <MessageSquare size={64} className="text-slate-400 mb-4" />
                <h2 className="text-2xl font-semibold text-[var(--theme-text-primary)] mb-2">帖子未找到</h2>
                <p className="text-[var(--theme-text-secondary)] mb-6">抱歉，我们找不到您要查找的帖子，它可能已被删除或链接无效。</p>
                <button
                    onClick={() => router.back()}
                    className="btn-secondary px-6 py-2 flex items-center"
                >
                    <ArrowLeft size={18} className="mr-2" /> 返回上一页
                </button>
            </div>
        );
    }

    const authorAvatarSrc = postDetail.author_avatar || `https://placehold.co/64x64/${['F2C94C','82E0AA','F08080','85C1E9','BB8FCE'][Number(postDetail.id || 0) % 5]}/3A3A3A?text=${postDetail.author_username?.charAt(0) || '趣'}&font=ZCOOL+KuaiLe`;
    const displayTitle = postDetail.title || `帖子 ID: ${postDetail.id || '未知'}`;
    const postOfficialTagDetails = postDetail.official_tag !== undefined && postDetail.official_tag !== 0
        ? officialTagMap[postDetail.official_tag]
        : null;

    return (
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--header-height)+1.5rem)] pb-16">
            <button
                onClick={() => router.back()}
                className="btn-secondary-outline text-sm mb-6 inline-flex items-center group"
            >
                <ArrowLeft size={16} className="mr-1.5 transition-transform duration-200 group-hover:-translate-x-1" />
                返回列表
            </button>

            <article className="bg-[var(--theme-card-bg)] thick-border rounded-xl p-6 md:p-8 lg:p-10 shadow-xl">
                {/* ... (保持 header 部分不变) ... */}
                <header className="mb-6 md:mb-8">
                    <div className="flex items-start justify-between flex-wrap gap-y-2">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--theme-primary)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                            {displayTitle}
                        </h1>
                        {postOfficialTagDetails && (
                            <span className={`mt-1 md:mt-0 inline-flex items-center text-sm font-semibold px-3 py-1 rounded-full shadow-sm ${postOfficialTagDetails.colorClass}`}>
                                {postOfficialTagDetails.icon}
                                {postOfficialTagDetails.text}
                            </span>
                        )}
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-[var(--theme-text-secondary)] space-y-2 sm:space-y-0">
                        <div className="flex items-center">
                            <Image
                                src={authorAvatarSrc}
                                alt={postDetail.author_username || "作者头像"}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-lg object-cover mr-3 thick-border-light"
                                onError={(_e) => {
                                    const target = _e.target as HTMLImageElement;
                                    target.src = `https://placehold.co/40x40/9E9E9E/FFFFFF?text=${postDetail.author_username?.charAt(0) || '趣'}&font=ZCOOL+KuaiLe`;
                                }}
                            />
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)]">{postDetail.author_username || "匿名作者"}</span>
                                <div className="text-xs flex items-center mt-0.5">
                                    <CalendarDays size={12} className="mr-1" />
                                    发布于: {formatTimestamp(postDetail.created_at)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {postDetail.updated_at && postDetail.updated_at !== postDetail.created_at && (
                                <div className="text-xs flex items-center">
                                    <RefreshCw size={12} className="mr-1" />
                                    更新于: {formatTimestamp(postDetail.updated_at)}
                                </div>
                            )}
                            {typeof postDetail.view_count === 'number' && (
                                <div className="text-xs flex items-center">
                                    <Eye size={14} className="mr-1" />
                                    {postDetail.view_count.toLocaleString()} 次围观
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* --- 新增：帖子详情图片展示区 --- */}
                {postDetail.images && postDetail.images.length > 0 && (
                    <div className="my-6 md:my-8">
                        <h3 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-4 flex items-center" style={{ fontFamily: 'var(--font-display)' }}>
                            <ImageIcon size={20} className="mr-2 text-[var(--theme-primary)]" />
                            帖子图片
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                            {postDetail.images.map((image: vo_PostImageVO, index: number) => (
                                image.image_url && ( // 确保 image_url 存在
                                    <div
                                        key={image.object_key || `post-image-${index}`}
                                        className="relative aspect-square rounded-lg overflow-hidden shadow-md cursor-pointer hover:shadow-xl transition-shadow duration-300 thick-border-light"
                                        onClick={() => openImageModal(image.image_url!)}
                                    >
                                        <Image
                                            src={image.image_url}
                                            alt={`帖子图片 ${index + 1}`}
                                            layout="fill"
                                            objectFit="cover"
                                            className="hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}
                {/* --- 帖子图片展示区结束 --- */}


                <div
                    className="prose prose-sm sm:prose-base lg:prose-lg max-w-none text-[var(--theme-text-primary)] leading-relaxed selection:bg-[var(--theme-secondary)] selection:text-[var(--theme-text-primary)]"
                >
                    {postDetail.content?.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph || '\u00A0'}</p>
                    ))}
                    {(!postDetail.content || postDetail.content.trim() === "") && (
                        <p className="italic text-slate-500">(作者太懒了，什么内容都木有留下～)</p>
                    )}
                </div>

                {/* ... (保持价格和联系方式部分不变) ... */}
                {(typeof postDetail.price_per_unit === 'number' || postDetail.contact_info) && (
                    <div className="mt-8 pt-6 border-t-2 border-dashed border-[var(--theme-border-color)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {typeof postDetail.price_per_unit === 'number' && postDetail.price_per_unit >= 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--theme-text-primary)] mb-2 flex items-center">
                                        <Tag size={18} className="mr-2 text-[var(--theme-primary)]"/> 参考价格
                                    </h3>
                                    <p className="text-2xl font-bold text-[var(--theme-secondary)]" style={{fontFamily: 'var(--font-display)'}}>
                                        ¥{Number(postDetail.price_per_unit).toFixed(2)}
                                    </p>
                                </div>
                            )}
                            {postDetail.contact_info && (
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--theme-text-primary)] mb-2 flex items-center">
                                        <Phone size={18} className="mr-2 text-[var(--theme-primary)]"/> 联系方式
                                    </h3>
                                    <p className="text-base text-[var(--theme-text-primary)] bg-slate-50 p-3 rounded-md border border-slate-200">
                                        {postDetail.contact_info}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </article>

            {/* 图片模态框 */}
            {isImageModalOpen && imageModalSrc && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4" // 确保 z-index 足够高
                    onClick={closeImageModal}
                >
                    <div
                        className="relative max-w-3xl max-h-[80vh] bg-white p-2 rounded-lg shadow-xl"
                        onClick={(e) => e.stopPropagation()} // 防止点击图片本身关闭模态框
                    >
                        <Image
                            src={imageModalSrc}
                            alt="图片大图预览"
                            width={800} // 根据需要调整
                            height={600} // 根据需要调整
                            objectFit="contain"
                            className="max-w-full max-h-[calc(80vh-1rem)] rounded"
                        />
                        <button
                            onClick={closeImageModal}
                            className="absolute -top-3 -right-3 bg-white text-slate-700 hover:text-red-500 p-1.5 rounded-full shadow-lg transition-colors"
                            aria-label="关闭预览"
                        >
                            <RefreshCw size={20} /> {/* 你可能想用 X 图标 (X from lucide-react) */}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostDetailPage;