// src/app/admin/page.tsx
"use client";

import React, {ChangeEvent, FormEvent, useCallback, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
    AdminPostsService,
    AdminService, // 新增：导入 AdminService 用于删除操作
    ApiError,
    type dto_AuditPostRequest,
    type dto_UpdateOfficialTagRequest,
    type enums_OfficialTag,
    type enums_Status,
    OpenAPI as PostServiceOpenAPI,
    type vo_BaseResponseWrapper,
    type vo_ListPostsAdminResponseWrapper,
    type vo_PostResponse,
} from '@/generated-api/post-service';
import {useUserStore} from '@/store/userStore';
import {getAccessToken} from '@/utils/tokenManager';
import withAuth from '@/components/auth/withAuth';
import {ROLES} from '@/config/authConfig';
import {
    AlertTriangle,
    BadgeCheck,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit,
    Eye,
    Filter,
    HelpCircle,
    MessageSquareText,
    RotateCcw,
    Search,
    Settings,
    Tag as TagIcon,
    Trash2,
    XCircle,
    Zap
} from 'lucide-react'; // 移除了未使用的 Info

// --- 类型定义 ---
// 将 interface AdminPostData 改为 type alias，因为没有额外成员
type AdminPostData = vo_PostResponse;

interface Filters {
    id?: number;
    title?: string;
    authorUsername?: string;
    status?: enums_Status | undefined;
    officialTag?: enums_OfficialTag;
    viewCountMin?: number;
    viewCountMax?: number;
    orderBy?: 'created_at' | 'updated_at';
    orderDesc?: boolean;
}

// --- 辅助函数与映射表 ---
const formatAdminTimestamp = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return dateString; }
};

const statusMapAdmin: { [key in enums_Status]: { text: string; icon: React.ReactNode; colorClass: string; badgeClass: string } } = {
    0: { text: "待审核", icon: <HelpCircle size={14} />, colorClass: "text-yellow-600", badgeClass: "bg-yellow-100 text-yellow-700" },
    1: { text: "已发布", icon: <CheckCircle size={14} />, colorClass: "text-green-600", badgeClass: "bg-green-100 text-green-700" },
    2: { text: "已拒绝", icon: <XCircle size={14} />, colorClass: "text-red-600", badgeClass: "bg-red-100 text-red-700" },
};

const officialTagMapAdmin: { [key in enums_OfficialTag]: { text: string; icon?: React.ReactNode; colorClass?: string; badgeClass: string } } = {
    0: { text: "无标签", badgeClass: "bg-slate-100 text-slate-600" },
    1: { text: "官方认证", icon: <BadgeCheck size={14} />, badgeClass: "bg-blue-100 text-blue-700" },
    2: { text: "保证金", icon: <Zap size={14} />, badgeClass: "bg-green-100 text-green-700" },
    3: { text: "急速响应", icon: <Clock size={14} />, badgeClass: "bg-orange-100 text-orange-700" },
};

// --- 模态框组件 ---

// 审核帖子模态框 (AuditPostModal)
interface AuditPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: AdminPostData | null;
    onSubmit: (postId: number, status: enums_Status, reason?: string) => Promise<void>;
}

const AuditPostModal: React.FC<AuditPostModalProps> = ({ isOpen, onClose, post, onSubmit }) => {
    const [selectedStatus, setSelectedStatus] = useState<enums_Status | "">("");
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    useEffect(() => {
        if (post && isOpen) {
            const currentStatus = post.status;
            if (typeof currentStatus === 'number' && (currentStatus === 0 || currentStatus === 1 || currentStatus === 2)) {
                setSelectedStatus(currentStatus as enums_Status);
            } else {
                setSelectedStatus("");
            }
            setReason(post.audit_reason || '');
        }
        setModalError(null);
    }, [post, isOpen]);

    if (!isOpen || !post) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (selectedStatus === "") {
            setModalError("请选择审核状态。");
            return;
        }
        setIsSubmitting(true);
        setModalError(null);
        try {
            if (typeof post.id === 'undefined') {
                throw new Error("帖子ID未定义，无法提交审核。");
            }
            await onSubmit(post.id, selectedStatus as enums_Status, reason);
            onClose();
        } catch (error: unknown) { // 修改为 unknown
            if (error instanceof Error) {
                setModalError(error.message || "审核操作失败。");
            } else {
                setModalError("审核操作失败，发生未知错误。");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentPostStatusDetail = (typeof post.status === 'number' && (post.status === 0 || post.status === 1 || post.status === 2))
        ? statusMapAdmin[post.status as enums_Status]
        : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
            <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-2xl w-full max-w-md thick-border transform transition-all duration-300 scale-100">
                <h3 className="text-xl font-semibold text-[var(--theme-primary)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>审核帖子: #{post.id}</h3>
                <p className="text-sm text-[var(--theme-text-secondary)] mb-1">标题: <span className="font-medium text-[var(--theme-text-primary)]">{post.title}</span></p>
                <p className="text-sm text-[var(--theme-text-secondary)] mb-4">当前状态:
                    {currentPostStatusDetail ? (
                        <span className={`font-medium px-2 py-0.5 rounded-md text-xs ${currentPostStatusDetail.badgeClass}`}>{currentPostStatusDetail.text}</span>
                    ) : (
                        <span className="font-medium text-xs">未知</span>
                    )}
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="auditStatus" className="form-label block mb-1">新的审核状态 <span className="text-red-500">*</span></label>
                        <select
                            id="auditStatus"
                            value={selectedStatus}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedStatus(val === "" ? "" : Number(val) as enums_Status);
                            }}
                            className="form-select w-full"
                            required
                        >
                            <option value="" disabled>请选择...</option>
                            <option value={1 as number}>通过 (已发布)</option>
                            <option value={2 as number}>拒绝</option>
                            <option value={0 as number}>重置为待审核</option>
                        </select>
                    </div>
                    {selectedStatus === (2 as enums_Status) && (
                        <div className="mb-4">
                            <label htmlFor="auditReason" className="form-label block mb-1">拒绝理由 (可选)</label>
                            <textarea
                                id="auditReason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="输入拒绝该帖子的原因..."
                                rows={3}
                                className="form-textarea w-full"
                            />
                        </div>
                    )}
                    {modalError && <p className="text-red-500 text-sm mb-3">{modalError}</p>}
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="btn-secondary px-4 py-2" disabled={isSubmitting}>取消</button>
                        <button type="submit" className="btn-primary px-4 py-2" disabled={isSubmitting}>
                            {isSubmitting ? '提交中...' : '确认提交'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 更新官方标签模态框 (UpdateOfficialTagModal)
interface UpdateOfficialTagModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: AdminPostData | null;
    onSubmit: (postId: number, officialTag: enums_OfficialTag) => Promise<void>;
}
const UpdateOfficialTagModal: React.FC<UpdateOfficialTagModalProps> = ({ isOpen, onClose, post, onSubmit }) => {
    const [selectedTag, setSelectedTag] = useState<enums_OfficialTag | "">("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    useEffect(() => {
        if (post && isOpen) {
            const currentTag = post.official_tag;
            if (typeof currentTag === 'number' && (currentTag === 0 || currentTag === 1 || currentTag === 2 || currentTag === 3)) {
                setSelectedTag(currentTag as enums_OfficialTag);
            } else {
                setSelectedTag("");
            }
        }
        setModalError(null);
    }, [post, isOpen]);

    if (!isOpen || !post) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (selectedTag === "") {
            setModalError("请选择一个官方标签。");
            return;
        }
        setIsSubmitting(true);
        setModalError(null);
        try {
            if (typeof post.id === 'undefined') {
                throw new Error("帖子ID未定义，无法更新标签。");
            }
            await onSubmit(post.id, selectedTag as enums_OfficialTag);
            onClose();
        } catch (error: unknown) { // 修改为 unknown
            if (error instanceof Error) {
                setModalError(error.message || "更新标签失败。");
            } else {
                setModalError("更新标签失败，发生未知错误。");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentPostTagDetail = (typeof post.official_tag === 'number' && (post.official_tag === 0 || post.official_tag === 1 || post.official_tag === 2 || post.official_tag === 3))
        ? officialTagMapAdmin[post.official_tag as enums_OfficialTag]
        : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-2xl w-full max-w-md thick-border">
                <h3 className="text-xl font-semibold text-[var(--theme-primary)] mb-4" style={{fontFamily: 'var(--font-display)'}}>更新官方标签: #{post.id}</h3>
                <p className="text-sm text-[var(--theme-text-secondary)] mb-1">标题: <span className="font-medium text-[var(--theme-text-primary)]">{post.title}</span></p>
                <p className="text-sm text-[var(--theme-text-secondary)] mb-4">当前标签:
                    {currentPostTagDetail ? (
                        <span className={`font-medium px-2 py-0.5 rounded-md text-xs ${currentPostTagDetail.badgeClass}`}>{currentPostTagDetail.text}</span>
                    ) : (
                        <span className="font-medium text-xs">未知</span>
                    )}
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="officialTagSelect" className="form-label block mb-1">选择新标签 <span className="text-red-500">*</span></label>
                        <select
                            id="officialTagSelect"
                            value={selectedTag}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedTag(val === "" ? "" : Number(val) as enums_OfficialTag);
                            }}
                            className="form-select w-full"
                            required
                        >
                            <option value="" disabled>请选择...</option>
                            {Object.entries(officialTagMapAdmin).map(([key, value]) => (
                                <option key={key} value={key}>{value.text}</option>
                            ))}
                        </select>
                    </div>
                    {modalError && <p className="text-red-500 text-sm mb-3">{modalError}</p>}
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="btn-secondary px-4 py-2" disabled={isSubmitting}>取消</button>
                        <button type="submit" className="btn-primary px-4 py-2" disabled={isSubmitting}>
                            {isSubmitting ? '更新中...' : '确认更新'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- 新增：删除帖子确认模态框 ---
interface DeletePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    postTitle: string | undefined | null;
    postId: number | undefined | null;
    onConfirmDelete: () => Promise<void>;
    isDeleting: boolean;
}

const DeletePostModal: React.FC<DeletePostModalProps> = ({ isOpen, onClose, postTitle, postId, onConfirmDelete, isDeleting }) => {
    if (!isOpen || typeof postId === 'undefined' || postId === null) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-2xl w-full max-w-md thick-border">
                <h3 className="text-xl font-semibold text-red-600 mb-3 flex items-center">
                    <AlertTriangle size={22} className="mr-2" /> 确认删除
                </h3>
                <p className="text-[var(--theme-text-secondary)] mb-1">
                    您确定要删除帖子: <strong className="text-[var(--theme-text-primary)]">“{postTitle || `ID: ${postId}`}”</strong> 吗?
                </p>
                <p className="text-sm text-red-500 mb-6">此操作不可撤销。</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="btn-secondary px-4 py-2" disabled={isDeleting}>
                        取消
                    </button>
                    <button onClick={onConfirmDelete} className="btn-danger px-4 py-2" disabled={isDeleting}>
                        {isDeleting ? '删除中...' : '确认删除'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- 主要页面组件 ---
const AdminPostsManagementPage = () => {
    const router = useRouter();
    const token = useUserStore((state) => state.token) || getAccessToken();

    const [posts, setPosts] = useState<AdminPostData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    // 移除了未使用的 setPageSize
    const [pageSize] = useState(10); // 如果 pageSize 不需要改变，可以直接用 const
    const [totalPosts, setTotalPosts] = useState(0);

    const [filters, setFilters] = useState<Filters>({ orderBy: 'created_at', orderDesc: true });
    const [tempFilters, setTempFilters] = useState<Filters>({ orderBy: 'created_at', orderDesc: true });

    const [showAuditModal, setShowAuditModal] = useState(false);
    const [showTagModal, setShowTagModal] = useState(false);
    const [selectedPostForAction, setSelectedPostForAction] = useState<AdminPostData | null>(null);

    // 新增状态：删除确认模态框
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState<AdminPostData | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);


    useEffect(() => {
        if (token && PostServiceOpenAPI.TOKEN !== token) {
            PostServiceOpenAPI.TOKEN = token;
        }
    }, [token]);

    const fetchAdminPosts = useCallback(async (page = currentPage, currentFilters = filters) => {
        setIsLoading(true);
        setError(null);
        console.log("[AdminPage] 正在获取帖子，筛选条件:", currentFilters, "页码:", page);
        try {
            const response: vo_ListPostsAdminResponseWrapper = await AdminPostsService.getApiV1PostAdminPosts({
                page: page,
                pageSize: pageSize,
                id: currentFilters.id ? Number(currentFilters.id) : undefined,
                title: currentFilters.title || undefined,
                authorUsername: currentFilters.authorUsername || undefined,
                status: currentFilters.status,
                officialTag: currentFilters.officialTag,
                viewCountMin: currentFilters.viewCountMin ? Number(currentFilters.viewCountMin) : undefined,
                viewCountMax: currentFilters.viewCountMax ? Number(currentFilters.viewCountMax) : undefined,
                orderBy: currentFilters.orderBy,
                orderDesc: currentFilters.orderDesc,
            });

            if (response.code === 0 && response.data) {
                setPosts(response.data.posts || []);
                setTotalPosts(response.data.total || 0);
                setCurrentPage(page);
            } else {
                setError(response.message || "获取帖子列表失败");
                setPosts([]);
                setTotalPosts(0);
            }
        } catch (err: unknown) {
            console.error("[AdminPage] 获取帖子时发生错误:", err);
            let fetchErrorMessage = "获取帖子列表时发生网络错误"; // 重命名以避免与外部 error 状态冲突
            if (err instanceof ApiError) {
                const body = err.body as { message?: string };
                fetchErrorMessage = body?.message || err.message || fetchErrorMessage;
            } else if (err instanceof Error) {
                fetchErrorMessage = err.message || fetchErrorMessage;
            }
            setError(fetchErrorMessage);
            setPosts([]);
            setTotalPosts(0);
        } finally {
            setIsLoading(false);
        }
    }, [pageSize, currentPage, filters]); // 确保 pageSize 在依赖数组中

    useEffect(() => {
        setSuccessMessage(null);
        fetchAdminPosts(1, filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]); // fetchAdminPosts 已经包含了 pageSize, currentPage 等依赖

    const handleFilterInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let processedValue: string | number | boolean | undefined | enums_Status | enums_OfficialTag = value;


        if (type === 'number' || name === 'id' || name === 'viewCountMin' || name === 'viewCountMax') {
            processedValue = value === '' ? undefined : Number(value);
        } else if (name === 'status') {
            const numVal = Number(value);
            processedValue = value === "" ? undefined : (numVal === 0 || numVal === 1 || numVal === 2 ? numVal as enums_Status : undefined);
        } else if (name === 'officialTag') {
            const numVal = Number(value);
            processedValue = value === "" ? undefined : (numVal === 0 || numVal === 1 || numVal === 2 || numVal === 3 ? numVal as enums_OfficialTag : undefined);
        } else if (type === 'checkbox' && name === 'orderDesc' && e.target instanceof HTMLInputElement) {
            processedValue = e.target.checked;
        }
        setTempFilters(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleApplyFilters = (e?: FormEvent) => {
        e?.preventDefault();
        setCurrentPage(1);
        setFilters(tempFilters);
    };

    const handleResetFilters = () => {
        const initialFilters: Filters = { orderBy: 'created_at', orderDesc: true };
        setTempFilters(initialFilters);
        setFilters(initialFilters);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= Math.ceil(totalPosts / pageSize)) {
            fetchAdminPosts(newPage, filters);
        }
    };

    const openAuditModal = (post: AdminPostData) => { setSelectedPostForAction(post); setShowAuditModal(true); };
    const openTagModal = (post: AdminPostData) => { setSelectedPostForAction(post); setShowTagModal(true); };

    const openDeleteModal = (post: AdminPostData) => {
        setPostToDelete(post);
        setShowDeleteModal(true);
    };

    const handleAuditSubmit = async (postId: number, status: enums_Status, reason?: string) => {
        console.log(`[AdminPage] 正在审核帖子 ${postId}，状态改为 ${status}，原因: ${reason}`);
        try {
            const requestBody: dto_AuditPostRequest = { post_id: postId, status, reason };
            const response: vo_BaseResponseWrapper = await AdminPostsService.postApiV1PostAdminPostsAudit({ requestBody });
            if (response.code === 0) {
                const statusDetail = statusMapAdmin[status];
                setSuccessMessage(`帖子 #${postId} 审核状态已更新为 "${statusDetail ? statusDetail.text : status}"。`);
                fetchAdminPosts(currentPage, filters); // 重新获取数据
            } else {
                throw new Error(response.message || "审核操作失败");
            }
        } catch (err: unknown) { // 修改为 unknown
            // 此处的 errorMessage 变量实际上未使用，因为错误直接被 re-throw
            // let errorMessage = "审核操作时发生错误";
            // if (err instanceof ApiError) {
            //     const body = err.body as { message?: string };
            //     errorMessage = body?.message || err.message || errorMessage;
            // } else if (err instanceof Error) {
            //     errorMessage = err.message || errorMessage;
            // }
            // setError(errorMessage); // 错误由模态框内部处理
            throw err; // 将原始错误抛给模态框处理
        }
    };

    const handleTagUpdateSubmit = async (postId: number, officialTag: enums_OfficialTag) => {
        console.log(`[AdminPage] 正在更新帖子 ${postId} 的官方标签为 ${officialTag}`);
        try {
            const requestBody: dto_UpdateOfficialTagRequest = { post_id: postId, official_tag: officialTag };
            const response: vo_BaseResponseWrapper = await AdminPostsService.putApiV1PostAdminPostsOfficialTag({ id: postId, requestBody });
            if (response.code === 0) {
                const tagDetail = officialTagMapAdmin[officialTag];
                setSuccessMessage(`帖子 #${postId} 官方标签已更新为 "${tagDetail ? tagDetail.text : officialTag}"。`);
                fetchAdminPosts(currentPage, filters); // 重新获取数据
            } else {
                throw new Error(response.message || "更新标签失败");
            }
        } catch (err: unknown) { // 修改为 unknown
            // 此处的 errorMessage 变量实际上未使用
            // let errorMessage = "更新标签时发生错误";
            // if (err instanceof ApiError) {
            //      const body = err.body as { message?: string };
            //      errorMessage = body?.message || err.message || errorMessage;
            // } else if (err instanceof Error) {
            //     errorMessage = err.message || errorMessage;
            // }
            // setError(errorMessage);
            throw err; // 将原始错误抛给模态框处理
        }
    };

    const handleDeletePostConfirm = async () => {
        if (!postToDelete || typeof postToDelete.id === 'undefined') {
            setError("无法确定要删除的帖子。");
            return;
        }
        setIsDeletingPost(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await AdminService.deleteApiV1PostAdminPosts({ postId: String(postToDelete.id) });
            if (response.code === 0) {
                setSuccessMessage(`帖子 "${postToDelete.title || `ID: ${postToDelete.id}`}" 已成功删除。`);
                setShowDeleteModal(false);
                setPostToDelete(null);
                fetchAdminPosts(1, filters);
            } else {
                setError(response.message || "删除帖子失败。");
            }
        } catch (err: unknown) {
            let deleteErrorMessage = "删除帖子时发生网络错误"; // 重命名
            if (err instanceof ApiError) {
                const body = err.body as { message?: string };
                deleteErrorMessage = body?.message || err.message || deleteErrorMessage;
            } else if (err instanceof Error) {
                deleteErrorMessage = err.message || deleteErrorMessage;
            }
            setError(deleteErrorMessage);
        } finally {
            setIsDeletingPost(false);
        }
    };


    const totalPages = Math.ceil(totalPosts / pageSize);

    return (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--header-height)+1.5rem)] pb-16 min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--theme-primary)] flex items-center" style={{ fontFamily: 'var(--font-display)' }}>
                    <Settings size={36} className="mr-3 text-[var(--theme-primary-hover)]" /> 帖子管理中心
                </h1>
                <p className="text-[var(--theme-text-secondary)] mt-1">在这里管理和审核社区的帖子内容。</p>
            </header>

            <form onSubmit={handleApplyFilters} className="bg-[var(--theme-card-bg)] thick-border rounded-xl p-4 md:p-6 mb-8 shadow-lg">
                <h2 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-4 flex items-center">
                    <Filter size={20} className="mr-2 text-[var(--theme-primary)]" /> 筛选与排序
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 mb-4 items-end">
                    <div>
                        <label htmlFor="filterId" className="form-label">帖子 ID</label>
                        <input type="number" id="filterId" name="id" value={tempFilters.id ?? ''} onChange={handleFilterInputChange} placeholder="精确ID" className="form-input"/>
                    </div>
                    <div>
                        <label htmlFor="filterTitle" className="form-label">标题</label>
                        <input type="text" id="filterTitle" name="title" value={tempFilters.title ?? ''}  onChange={handleFilterInputChange} placeholder="模糊搜索..." className="form-input"/>
                    </div>
                    <div>
                        <label htmlFor="filterAuthorUsername" className="form-label">作者用户名</label>
                        <input type="text" id="filterAuthorUsername" name="authorUsername" value={tempFilters.authorUsername ?? ''} onChange={handleFilterInputChange} placeholder="模糊搜索..." className="form-input"/>
                    </div>
                    <div>
                        <label htmlFor="filterStatus" className="form-label">审核状态</label>
                        <select id="filterStatus" name="status" value={tempFilters.status ?? ""} onChange={handleFilterInputChange} className="form-select">
                            <option value="">全部状态</option>
                            {Object.entries(statusMapAdmin).map(([key, val]) => <option key={key} value={key}>{val.text}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filterOfficialTag" className="form-label">官方标签</label>
                        <select id="filterOfficialTag" name="officialTag" value={tempFilters.officialTag ?? ""} onChange={handleFilterInputChange} className="form-select">
                            <option value="">全部标签</option>
                            {Object.entries(officialTagMapAdmin).map(([key, val]) => <option key={key} value={key}>{val.text}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filterViewCountMin" className="form-label">最小浏览量</label>
                        <input type="number" id="filterViewCountMin" name="viewCountMin" value={tempFilters.viewCountMin ?? ''} onChange={handleFilterInputChange} placeholder="例如: 100" className="form-input"/>
                    </div>
                    <div>
                        <label htmlFor="filterViewCountMax" className="form-label">最大浏览量</label>
                        <input type="number" id="filterViewCountMax" name="viewCountMax" value={tempFilters.viewCountMax ?? ''} onChange={handleFilterInputChange} placeholder="例如: 1000" className="form-input"/>
                    </div>
                    <div>
                        <label htmlFor="filterOrderBy" className="form-label">排序字段</label>
                        <select id="filterOrderBy" name="orderBy" value={tempFilters.orderBy ?? 'created_at'} onChange={handleFilterInputChange} className="form-select">
                            <option value="created_at">创建时间</option>
                            <option value="updated_at">更新时间</option>
                        </select>
                    </div>
                    <div className="flex items-center pt-6">
                        <input type="checkbox" id="filterOrderDesc" name="orderDesc" checked={tempFilters.orderDesc ?? true} onChange={handleFilterInputChange} className="form-checkbox mr-2"/>
                        <label htmlFor="filterOrderDesc" className="form-label mb-0">降序排列</label>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-5">
                    <button type="button" onClick={handleResetFilters} className="btn-secondary px-5 py-2.5 flex items-center justify-center">
                        <RotateCcw size={16} className="mr-2" /> 重置筛选
                    </button>
                    <button type="submit" className="btn-primary px-6 py-2.5 flex items-center justify-center">
                        <Search size={18} className="mr-2" /> 应用筛选
                    </button>
                </div>
            </form>

            {successMessage && <div className="my-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm text-center shadow">{successMessage}</div>}
            {error && <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center shadow"><strong className="font-bold">操作失败:</strong> {error}</div>}

            <div className="bg-[var(--theme-card-bg)] thick-border rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm text-left text-[var(--theme-text-secondary)]">
                    <thead className="text-xs text-[var(--theme-text-primary)] uppercase bg-slate-50 border-b border-[var(--theme-border-color)]" style={{backgroundColor: "var(--theme-background)"}}>
                    <tr>
                        <th scope="col" className="px-4 py-3">ID</th>
                        <th scope="col" className="px-4 py-3 min-w-[200px]">标题</th>
                        <th scope="col" className="px-4 py-3">作者</th>
                        <th scope="col" className="px-4 py-3">状态</th>
                        <th scope="col" className="px-4 py-3">官方标签</th>
                        <th scope="col" className="px-4 py-3">浏览量</th>
                        <th scope="col" className="px-4 py-3">创建时间</th>
                        <th scope="col" className="px-4 py-3">更新时间</th>
                        <th scope="col" className="px-4 py-3 text-center sticky right-0 bg-[var(--theme-background)] z-10 border-l border-[var(--theme-border-color)]">操作</th>
                    </tr>
                    </thead>
                    <tbody>
                    {isLoading && !posts.length && (
                        <tr><td colSpan={9} className="text-center py-10">
                            <svg className="mx-auto mb-2 w-8 h-8 animate-spin text-[var(--theme-primary)]" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="currentColor"></circle></svg>
                            努力加载中...
                        </td></tr>
                    )}
                    {!isLoading && posts.length === 0 && (
                        <tr><td colSpan={9} className="text-center py-10">
                            <MessageSquareText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                            没有找到符合条件的帖子。
                        </td></tr>
                    )}
                    {posts.map((post) => {
                        const statusDetail = (typeof post.status === 'number' && (post.status === 0 || post.status === 1 || post.status === 2))
                            ? statusMapAdmin[post.status as enums_Status]
                            : null;
                        const officialTagDetail = (typeof post.official_tag === 'number' && (post.official_tag === 0 || post.official_tag === 1 || post.official_tag === 2 || post.official_tag === 3))
                            ? officialTagMapAdmin[post.official_tag as enums_OfficialTag]
                            : null;
                        return (
                            <tr key={post.id} className="border-b border-[var(--theme-border-color)] hover:bg-slate-50 transition-colors duration-150">
                                <td className="px-4 py-3 font-medium text-[var(--theme-text-primary)]">{post.id}</td>
                                <td className="px-4 py-3 max-w-[250px] truncate" title={post.title ?? ""}>{post.title || "-"}</td>
                                <td className="px-4 py-3">{post.author_username || "-"}</td>
                                <td className="px-4 py-3">
                                    {statusDetail ? (
                                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-md ${statusDetail.badgeClass}`}>
                                            {statusDetail.icon}
                                            <span className="ml-1">{statusDetail.text}</span>
                                        </span>
                                    ) : (<span className="text-xs text-slate-400">未知</span>) }
                                </td>
                                <td className="px-4 py-3">
                                    {officialTagDetail ? (
                                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-md ${officialTagDetail.badgeClass}`}>
                                            {officialTagDetail.icon}
                                            <span className="ml-1">{officialTagDetail.text}</span>
                                        </span>
                                    ) : (<span className="text-xs text-slate-400">无</span>) }
                                </td>
                                <td className="px-4 py-3">{post.view_count?.toLocaleString() ?? "-"}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{formatAdminTimestamp(post.created_at)}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{formatAdminTimestamp(post.updated_at)}</td>
                                <td className="px-4 py-3 text-center sticky right-0 bg-white hover:bg-slate-50 z-10 border-l border-[var(--theme-border-color)]">
                                    <div className="flex items-center justify-center space-x-1">
                                        <button onClick={() => { if(post.id !== undefined) router.push(`/posts/${post.id}`)}} title="查看详情" className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md"><Eye size={16}/></button>
                                        <button onClick={() => openAuditModal(post)} title="审核帖子" className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-md"><Edit size={16}/></button>
                                        <button onClick={() => openTagModal(post)} title="设置标签" className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-md"><TagIcon size={16}/></button>
                                        {/* 新增删除按钮 */}
                                        <button onClick={() => openDeleteModal(post)} title="删除帖子" className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>

            {totalPosts > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                    <span className="text-sm text-[var(--theme-text-secondary)]">
                        共 {totalPosts} 条记录，当前第 {currentPage} / {totalPages} 页
                    </span>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handlePageChange(1)} disabled={currentPage === 1 || isLoading} className="btn-pagination">首页</button>
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} className="btn-pagination">
                            <ChevronLeft size={18}/>
                        </button>
                        <span className="px-3 py-1.5 border border-[var(--theme-border-color)] rounded-md text-sm bg-[var(--theme-card-bg)] shadow-sm">
                            {currentPage}
                        </span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading} className="btn-pagination">
                            <ChevronRight size={18}/>
                        </button>
                        <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || isLoading} className="btn-pagination">末页</button>
                    </div>
                </div>
            )}

            <AuditPostModal isOpen={showAuditModal} onClose={() => setShowAuditModal(false)} post={selectedPostForAction} onSubmit={handleAuditSubmit} />
            <UpdateOfficialTagModal isOpen={showTagModal} onClose={() => setShowTagModal(false)} post={selectedPostForAction} onSubmit={handleTagUpdateSubmit} />
            {/* 新增：渲染删除确认模态框 */}
            <DeletePostModal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setPostToDelete(null); }}
                postTitle={postToDelete?.title}
                postId={postToDelete?.id}
                onConfirmDelete={handleDeletePostConfirm}
                isDeleting={isDeletingPost}
            />
        </div>
    );
};

export default withAuth(AdminPostsManagementPage, {
    allowedRoles: [ROLES.ADMIN],
    LoadingComponent: () => (
        <div className="flex justify-center items-center min-h-screen pt-[var(--header-height)]">
            <svg className="animate-spin h-10 w-10 text-[var(--theme-primary)]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-lg text-[var(--theme-text-secondary)]">正在加载管理后台...</p>
        </div>
    ),
});