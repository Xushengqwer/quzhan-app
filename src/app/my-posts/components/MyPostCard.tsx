// src/app/my-posts/components/MyPostCard.tsx
"use client";

import React from 'react';
import NextImage from 'next/image'; // 使用 NextImage 避免与 HTMLImageElement 冲突
import { useRouter } from 'next/navigation';
import { Eye, Edit2, Trash2, BadgeCheck, Zap, Clock, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
// 直接从 post-service 导入所需类型
import type { vo_PostResponse, enums_OfficialTag, enums_Status } from '@/generated-api/post-service';

// --- 类型定义 ---
// MyPostData 现在直接是 vo_PostResponse 的别名，或者 MyPostCardProps 直接使用 vo_PostResponse
export type MyPostData = vo_PostResponse;

interface MyPostCardProps {
    post: vo_PostResponse; // 直接使用 API 返回的帖子类型
    onEdit: (postId?: number) => void;
    onDelete: (postId?: number) => Promise<void>;
    isDeleting: boolean;
    currentDeletingPostId: number | null | undefined;
}

// --- 辅助函数 ---
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
    // 0 (无标签) 通常不在此映射中显示，或根据 UI 需求处理
};

const statusMap: { [key in enums_Status]: { text: string; icon: React.ReactNode; colorClass: string } } = {
    0: { text: "待审核", icon: <HelpCircle size={12} className="mr-1" />, colorClass: "bg-yellow-100 text-yellow-700" },
    1: { text: "已发布", icon: <CheckCircle size={12} className="mr-1" />, colorClass: "bg-green-100 text-green-700" },
    2: { text: "已拒绝", icon: <XCircle size={12} className="mr-1" />, colorClass: "bg-red-100 text-red-700" },
};


const MyPostCard: React.FC<MyPostCardProps> = ({ post, onEdit, onDelete, isDeleting, currentDeletingPostId }) => {
    const router = useRouter();
    const isCurrentPostDeleting = isDeleting && currentDeletingPostId === post.id;

    // 使用 API 返回的 snake_case 字段
    const displayTime = formatTimeAgo(post.created_at); // API 返回 created_at
    const postStatus = post.status !== undefined ? statusMap[post.status as enums_Status] : null;
    const postOfficialTag = post.official_tag !== undefined && post.official_tag !== 0
        ? officialTagMap[post.official_tag as Exclude<enums_OfficialTag, 0>] // 排除 0，因为 0 代表无标签
        : null;

    const handleTitleClick = () => {
        if (post.id !== undefined) {
            console.log(`[MyPostCard] 导航到帖子详情: /posts/${post.id}`);
            router.push(`/posts/${post.id}`);
        } else {
            console.warn("[MyPostCard] 帖子 ID 未定义，无法导航。");
        }
    };

    const authorAvatarSrc = post.author_avatar || `https://placehold.co/48x48/${['F2C94C','82E0AA','F08080','85C1E9','BB8FCE'][Number(post.id || 0) % 5]}/3A3A3A?text=${post.author_username?.charAt(0) || '趣'}&font=ZCOOL+KuaiLe`;

    return (
        <div
            className="bg-[var(--theme-card-bg)] thick-border rounded-xl p-5 md:p-6 shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1"
            // 为卡片本身添加点击事件，如果整个卡片都可点击的话
            // onClick={handleTitleClick} // 如果希望整个卡片可点击，取消注释这行
        >
            <div className="flex items-start justify-between mb-3.5">
                <div className="flex items-center flex-grow min-w-0">
                    <NextImage // 使用 NextImage
                        src={authorAvatarSrc}
                        alt={post.author_username || '作者头像'}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover mr-3.5 flex-shrink-0 thick-border-light"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/48x48/9E9E9E/FFFFFF?text=${post.author_username?.charAt(0) || '趣'}&font=ZCOOL+KuaiLe`; }}
                    />
                    <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-x-2">
                            <span className="block text-lg font-bold text-[var(--theme-text-primary)] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                                {post.author_username || '匿名用户'}
                            </span>
                            {postOfficialTag && (
                                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm ${postOfficialTag.colorClass}`}>
                                    {postOfficialTag.icon}
                                    {postOfficialTag.text}
                                </span>
                            )}
                        </div>
                        <span className="block text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            {displayTime}
                        </span>
                    </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0 ml-2">
                    <button
                        title="编辑帖子"
                        onClick={() => onEdit(post.id)}
                        disabled={isCurrentPostDeleting}
                        className="p-2 rounded-full text-[var(--theme-primary)] hover:bg-blue-100 hover:text-[var(--theme-primary-hover)] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary-hover)] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        title="删除帖子"
                        onClick={() => onDelete(post.id)}
                        disabled={isCurrentPostDeleting}
                        className="p-2 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCurrentPostDeleting ? (
                            <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <Trash2 size={18} />
                        )}
                    </button>
                </div>
            </div>
            <h2
                className="text-xl md:text-2xl font-bold text-[var(--theme-primary)] mb-2 leading-tight hover:underline cursor-pointer"
                style={{ fontFamily: 'var(--font-display)' }}
                onClick={handleTitleClick} // 标题点击导航
            >
                {post.title || '无标题帖子'}
            </h2>
            <div className="mt-4 pt-3 border-t-2 border-dashed border-[var(--theme-border-color)] text-sm text-[var(--theme-text-secondary)] flex items-center justify-between">
                <div className="flex items-center">
                    <Eye size={16} className="mr-1.5 post-meta-icon" />
                    <span>{post.view_count?.toLocaleString() || 0} 次围观</span>
                </div>
                {postStatus && (
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md ${postStatus.colorClass}`}>
                        {postStatus.icon}
                        {postStatus.text}
                    </span>
                )}
            </div>
        </div>
    );
};

export default MyPostCard;
