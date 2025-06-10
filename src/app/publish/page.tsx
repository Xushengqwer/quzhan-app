// src/app/publish/page.tsx
"use client";

import React, {ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import NextImage from 'next/image';
import {useUserStore} from '@/store/userStore';
import {
    ApiError, // 确保导入 ApiError
    OpenAPI as PostServiceOpenAPI,
    PostsService,
    type vo_PostDetailResponseWrapper,
} from '@/generated-api/post-service';
import {getAccessToken} from '@/utils/tokenManager';
import withAuth from '@/components/auth/withAuth';
import {ROLES} from '@/config/authConfig';
import {AlertTriangle, CheckCircle, GripVertical, PlusCircle, Trash2, X} from 'lucide-react';

// 定义图片项的接口
interface ImageListItem {
    id: string;
    file: File;
    previewUrl: string;
}

// 定义表单数据接口
interface PostFormData {
    title: string;
    content: string;
    pricePerUnit?: number | string;
    contactInfo?: string;
}

const MAX_IMAGES = 9; // 最大图片数量

const PublishPostPage: React.FC = () => {
    const currentUser = useUserStore((state) => state.user);
    const token = useUserStore((state) => state.token) || getAccessToken();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<PostFormData>({
        title: '',
        content: '',
        pricePerUnit: '',
        contactInfo: '',
    });
    const [imageList, setImageList] = useState<ImageListItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
    const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);

    useEffect(() => {
        if (token && PostServiceOpenAPI.TOKEN !== token) {
            PostServiceOpenAPI.TOKEN = token;
        }
    }, [token]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const currentErrorAccumulator: string[] = [];
        const newImageItemsFromFileDialog: ImageListItem[] = [];

        Array.from(files).forEach(file => {
            if (imageList.length + newImageItemsFromFileDialog.length >= MAX_IMAGES) {
                currentErrorAccumulator.push(`最多只能上传 ${MAX_IMAGES} 张图片。部分文件未添加。`);
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                currentErrorAccumulator.push(`图片 "${file.name}" 太大了 (最大 5MB)。`);
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                currentErrorAccumulator.push(`图片 "${file.name}" 的格式不支持 (仅支持 JPG, PNG, GIF)。`);
                return;
            }
            newImageItemsFromFileDialog.push({
                id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                file: file,
                previewUrl: URL.createObjectURL(file),
            });
        });

        if (currentErrorAccumulator.length > 0) {
            setError(currentErrorAccumulator.join("\n"));
        } else if (newImageItemsFromFileDialog.length > 0) {
            setError(null);
        }

        if (newImageItemsFromFileDialog.length > 0) {
            setImageList(prevList => {
                const combined = [...prevList, ...newImageItemsFromFileDialog];
                if (combined.length > MAX_IMAGES) {
                    setError((prevError) => (prevError ? prevError + "\n" : "") + `最多只能上传 ${MAX_IMAGES} 张图片。已选择超出部分未添加。`);
                    return combined.slice(0, MAX_IMAGES);
                }
                return combined;
            });
        }

        if (e.target) {
            e.target.value = '';
        }
    };

    useEffect(() => {
        return () => {
            imageList.forEach(item => URL.revokeObjectURL(item.previewUrl));
        };
    }, [imageList]);

    const removeImage = (idToRemove: string) => {
        setImageList(prevList => {
            const itemToRemove = prevList.find(item => item.id === idToRemove);
            if (itemToRemove) {
                URL.revokeObjectURL(itemToRemove.previewUrl);
            }
            return prevList.filter(item => item.id !== idToRemove);
        });
    };

    const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
        setDraggedItemId(id);
        e.dataTransfer.effectAllowed = "move";
        e.currentTarget.classList.add("opacity-50", "ring-2", "ring-[var(--theme-primary)]");
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const targetElement = e.currentTarget;
        targetElement.classList.add("border-[var(--theme-primary)]", "border-2", "scale-105");
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove("border-[var(--theme-primary)]", "border-2", "scale-105");
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, targetItemId: string) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-[var(--theme-primary)]", "border-2", "scale-105", "opacity-50");
        if (!draggedItemId || draggedItemId === targetItemId) {
            setDraggedItemId(null);
            document.querySelectorAll('.image-preview-item.opacity-50').forEach(el => el.classList.remove('opacity-50', 'ring-2', 'ring-[var(--theme-primary)]'));
            return;
        }

        const newList = [...imageList];
        const draggedItemIndex = newList.findIndex(item => item.id === draggedItemId);
        const targetItemIndex = newList.findIndex(item => item.id === targetItemId);

        if (draggedItemIndex === -1 || targetItemIndex === -1) return;

        const [draggedItem] = newList.splice(draggedItemIndex, 1);
        newList.splice(targetItemIndex, 0, draggedItem);

        setImageList(newList);
        setDraggedItemId(null);
        document.querySelectorAll('.image-preview-item.opacity-50').forEach(el => el.classList.remove('opacity-50', 'ring-2', 'ring-[var(--theme-primary)]'));
    };

    const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove("opacity-50", "ring-2", "ring-[var(--theme-primary)]");
        document.querySelectorAll('.image-preview-item.border-\\[var\\(--theme-primary\\)\\]').forEach(el => el.classList.remove('border-[var(--theme-primary)]', 'border-2', 'scale-105'));
        setDraggedItemId(null);
    };

    const openImageModal = (src: string) => {
        setImageModalSrc(src);
        setIsImageModalOpen(true);
    };

    const closeImageModal = () => {
        setIsImageModalOpen(false);
        setImageModalSrc(null);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentUser?.user_id || !currentUser?.nickname) {
            setError("无法获取完整的用户信息，请尝试重新登录。");
            setIsLoading(false);
            return;
        }
        if (!formData.title.trim() || !formData.content.trim()) {
            setError("帖子标题和内容不能为空！");
            setIsLoading(false);
            return;
        }
        if (imageList.length === 0) {
            setError("请至少上传一张帖子图片。");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        // *** 修复：使用 eslint-disable-next-line 注释来忽略此处的 any 类型错误 ***
        // 这是一个临时的、务实的解决方案，以避免与错误的生成类型冲突
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const submissionPayload: any = {
            title: formData.title.trim(),
            content: formData.content.trim(),
            author_id: currentUser.user_id,
            author_username: currentUser.nickname,
            images: imageList.map(item => item.file),
        };
        if (formData.pricePerUnit) {
            const price = parseFloat(String(formData.pricePerUnit));
            if (!isNaN(price)) submissionPayload.price_per_unit = price;
        }
        if (formData.contactInfo && formData.contactInfo.trim()) {
            submissionPayload.contact_info = formData.contactInfo.trim();
        }
        if (currentUser.avatar_url) {
            submissionPayload.author_avatar = currentUser.avatar_url;
        }

        console.log("[PublishPostPage] 正在提交帖子数据:", submissionPayload);
        console.log("[PublishPostPage] 准备提交的文件数量:", submissionPayload.images.length);

        try {
            const response: vo_PostDetailResponseWrapper = await PostsService.postApiV1PostPosts({
                formData: submissionPayload,
            });

            if (response.code === 0 && response.data) {
                setSuccessMessage("帖子发布成功！");
                setFormData({ title: '', content: '', pricePerUnit: '', contactInfo: '' });
                setImageList([]);

                if (response.data.id) {
                    router.push(`/posts/${response.data.id}`);
                } else {
                    router.push('/');
                }
            } else {
                setError(response.message || "帖子发布失败，请稍后再试。");
            }
        } catch (err: unknown) {
            console.error("[PublishPostPage] 提交帖子时发生错误:", err);
            let errorMessage = "帖子发布时发生错误。";
            if (err instanceof ApiError) {
                errorMessage = (err.body as { message?: string })?.message || err.message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser && !useUserStore.getState().initialized) {
            console.log("[PublishPostPage] 等待认证初始化...");
        }
    }, [currentUser]);

    return (
        <div className="max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--header-height)+2rem)] pb-16 min-h-screen">
            <div className="bg-[var(--theme-card-bg)] thick-border rounded-xl p-6 md:p-10 shadow-lg">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--theme-primary)] mb-8 text-center" style={{ fontFamily: 'var(--font-display)' }}>
                    <span className="inline-block mr-2 transform group-hover:rotate-[-12deg] transition-transform duration-300">📝</span> 发布你的帖子
                </h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md text-sm flex items-start" role="alert">
                        <AlertTriangle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
                        <div className="whitespace-pre-line">
                            <strong className="font-bold">哎呀！</strong> {error}
                        </div>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md text-sm flex items-center" role="alert">
                        <CheckCircle size={20} className="mr-2 flex-shrink-0" />
                        <div>
                            <strong className="font-bold">太棒啦！</strong> {successMessage}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="form-label block mb-1.5">帖子标题<span className="text-red-500 ml-1">*</span></label>
                        <input type="text" id="title" name="title" className="form-input w-full text-base" placeholder="给你的帖子起个可爱的名字吧！" required maxLength={100} value={formData.title} onChange={handleChange} disabled={isLoading} />
                        <p className="text-xs text-slate-500 mt-1">最多100个字哦～</p>
                    </div>
                    <div>
                        <label htmlFor="content" className="form-label block mb-1.5">帖子内容<span className="text-red-500 ml-1">*</span></label>
                        <textarea id="content" name="content" rows={8} className="form-textarea w-full text-base" placeholder="分享你的奇思妙想或者开心瞬间吧！" required maxLength={1000} value={formData.content} onChange={handleChange} disabled={isLoading} />
                        <p className="text-xs text-slate-500 mt-1">尽情发挥，最多1000个字！</p>
                    </div>
                    <div>
                        <label htmlFor="pricePerUnit" className="form-label block mb-1.5">单价 (可选)</label>
                        <div className="relative"><span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--theme-text-secondary)] text-base">¥</span>
                            <input type="number" id="pricePerUnit" name="pricePerUnit" className="form-input w-full pl-7 text-base" placeholder="0.00" step="0.01" min="0" value={formData.pricePerUnit} onChange={handleChange} disabled={isLoading} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="contactInfo" className="form-label block mb-1.5">联系方式 (可选)</label>
                        <input type="text" id="contactInfo" name="contactInfo" className="form-input w-full text-base" placeholder="例如：微信 an_example_wx / QQ 12345678" maxLength={100} value={formData.contactInfo} onChange={handleChange} disabled={isLoading} />
                        <p className="text-xs text-slate-500 mt-1">留下你的联系方式，方便他人找到你。</p>
                    </div>

                    <div>
                        <label className="form-label block mb-1.5">帖子图片<span className="text-red-500 ml-1">*</span> (最多 {MAX_IMAGES} 张, 可拖拽排序)</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-3 p-3 border border-slate-200 rounded-lg bg-slate-50 min-h-[80px]">
                            {imageList.map((item, index) => (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item.id)}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, item.id)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => openImageModal(item.previewUrl)}
                                    className="image-preview-item relative aspect-square border border-slate-300 rounded-md overflow-hidden shadow-sm cursor-grab group bg-slate-100 hover:shadow-md"
                                >
                                    <NextImage src={item.previewUrl} alt={`图片预览 ${index + 1}`} layout="fill" objectFit="cover" />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeImage(item.id); }}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10"
                                        aria-label="移除图片"
                                        disabled={isLoading}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs text-center py-0.5">
                                        {index + 1}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity bg-black bg-opacity-20">
                                        <GripVertical size={20} className="text-white" />
                                    </div>
                                </div>
                            ))}
                            {imageList.length < MAX_IMAGES && (
                                <label htmlFor="imagesUpload" className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-[var(--theme-primary)] rounded-lg text-slate-400 hover:text-[var(--theme-primary)] cursor-pointer transition-colors">
                                    <PlusCircle size={32} />
                                    <span className="text-xs mt-1">添加图片</span>
                                </label>
                            )}
                        </div>
                        <input
                            type="file"
                            id="imagesUpload"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/png, image/jpeg, image/gif"
                            multiple
                            onChange={handleFileChange}
                            disabled={isLoading || imageList.length >= MAX_IMAGES}
                        />
                        <p className="text-xs text-slate-500 mt-1">支持 JPG, PNG, GIF (每张最大 5MB)。已选 {imageList.length}/{MAX_IMAGES} 张。</p>
                    </div>

                    <div className="pt-6 text-center">
                        <button
                            type="submit"
                            className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white font-bold py-3 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[var(--theme-primary-rgb)] focus:ring-opacity-30 thick-border disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={isLoading || imageList.length === 0}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    发射中...
                                </>
                            ) : (
                                <>
                                    <span className="inline-block mr-2 transform group-hover:rotate-12 transition-transform duration-300">🚀</span>
                                    发射！
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {isImageModalOpen && imageModalSrc && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={closeImageModal}
                >
                    <div
                        className="relative max-w-3xl max-h-[80vh] bg-white p-2 rounded-lg shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <NextImage src={imageModalSrc} alt="图片大图预览" width={800} height={600} objectFit="contain" className="max-w-full max-h-[calc(80vh-1rem)] rounded" />
                        <button
                            onClick={closeImageModal}
                            className="absolute -top-3 -right-3 bg-white text-slate-700 hover:text-red-500 p-1.5 rounded-full shadow-lg transition-colors"
                            aria-label="关闭预览"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default withAuth(PublishPostPage, { allowedRoles: [ROLES.USER, ROLES.ADMIN] });
