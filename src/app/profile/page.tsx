// src/app/profile/page.tsx
"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent, useRef } from 'react';
import Image from 'next/image';
import {
    ApiError, // ** 新增：导入 ApiError 用于类型检查 **
    ProfileManagementService,
    OpenAPI as UserHubOpenAPI,
    type vo_MyAccountDetailVO,
    type dto_UpdateProfileDTO,
    type enums_Gender,
    type enums_UserRole,
    type enums_UserStatus,
} from '@/generated-api/user-hub';
import { useUserStore } from '@/store/userStore';
import { getAccessToken } from '@/utils/tokenManager';
import withAuth from '@/components/auth/withAuth';
import { ROLES } from '@/config/authConfig';
import { User as UserIconLucide, Edit3, Save, CalendarDays, MapPin, AlertTriangle, CheckCircle, ShieldCheck, VenetianMask, Ban, Verified, RotateCcw, ImageUp, Check, UserCog } from 'lucide-react';
import '@/app/login/login-styles.css';
import './profile-styles.css';

// --- 辅助类型和映射 ---
const genderMap: { [key in enums_Gender]?: string } = { 0: '保密', 1: '男', 2: '女' };

const userStatusMap: { [key in enums_UserStatus]: { text: string; icon: React.ReactNode; badgeClass: string } } = {
    0: { text: '正常', icon: <Verified size={14} className="mr-1" />, badgeClass: 'status-normal' },
    1: { text: '已封禁', icon: <Ban size={14} className="mr-1" />, badgeClass: 'status-banned' },
};

const userRoleMap: { [key in enums_UserRole]: { text: string; icon: React.ReactNode; badgeClass: string } } = {
    0: { text: '管理员', icon: <UserCog size={14} className="mr-1" />, badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-200' },
    1: { text: '用户', icon: <ShieldCheck size={14} className="mr-1" />, badgeClass: 'role-user' },
    2: { text: '访客', icon: <VenetianMask size={14} className="mr-1" />, badgeClass: 'bg-gray-100 text-gray-700' },
};


const formatProfileTimestamp = (dateString?: string | null): string => {
    if (!dateString) return '未知';
    try {
        return new Date(dateString).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateString; }
};

interface EditFormData {
    nickname: string;
    gender: enums_Gender;
    city: string;
    province: string;
}

const UserProfilePage = () => {
    const token = useUserStore((state) => state.token) || getAccessToken();
    const loadUserStoreInfo = useUserStore((state) => state.loadUserInfo);
    const currentUserFromStore = useUserStore((state) => state.user);


    const [profileData, setProfileData] = useState<vo_MyAccountDetailVO | null>(null);
    const [editFormData, setEditFormData] = useState<EditFormData>({
        nickname: '',
        gender: 0 as enums_Gender,
        city: '',
        province: '',
    });
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [editMode, setEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (token && UserHubOpenAPI.TOKEN !== token) {
            UserHubOpenAPI.TOKEN = token;
        }
    }, [token]);

    const fetchPageProfileData = useCallback(async (showSuccessMsg: boolean = false) => {
        if (!editMode) setIsLoading(true);
        setError(null);
        if (!showSuccessMsg) setSuccessMessage(null);

        try {
            const response = await ProfileManagementService.getApiV1UserHubProfile();
            if (response.code === 0 && response.data) {
                const accountDetail = response.data;
                setProfileData(accountDetail);
                setEditFormData({
                    nickname: accountDetail.nickname || '',
                    gender: typeof accountDetail.gender === 'number' ? accountDetail.gender : (0 as enums_Gender),
                    city: accountDetail.city || '',
                    province: accountDetail.province || '',
                });
                setAvatarPreview(accountDetail.avatar_url || null);
            } else {
                setError(response.message || "获取用户资料失败。");
            }
        } catch (err: unknown) { // *** 修复 1 ***
            let message = "获取用户资料时发生网络错误。";
            if (err instanceof ApiError) {
                message = (err.body as { message?: string })?.message || err.message;
            } else if (err instanceof Error) {
                message = err.message;
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [editMode]);

    useEffect(() => {
        fetchPageProfileData();
    }, [fetchPageProfileData]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: name === 'gender' ? parseInt(value, 10) as enums_Gender : value,
        }));
    };

    const defaultAvatarSrc = `https://placehold.co/128x128/${['F2C94C','82E0AA','F08080','85C1E9','BB8FCE'][Number(profileData?.user_id?.charCodeAt(0) || currentUserFromStore?.user_id?.charCodeAt(0) || 0) % 5]}/3A3A3A?text=${encodeURIComponent((profileData?.nickname || currentUserFromStore?.nickname || '趣').charAt(0))}&font=ZCOOL+KuaiLe`;


    const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError("头像文件不能超过2MB。");
                setSelectedAvatarFile(null);
                setAvatarPreview(profileData?.avatar_url || defaultAvatarSrc);
                if(avatarInputRef.current) avatarInputRef.current.value = "";
                return;
            }
            setSelectedAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setError(null);
        }
    };

    const handleUploadAvatar = async () => {
        if (!selectedAvatarFile) {
            setError("请先选择一个头像文件。");
            return;
        }
        setIsUploadingAvatar(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await ProfileManagementService.postApiV1UserHubProfileAvatar({
                formData: { avatar: selectedAvatarFile },
            });
            if (response.code === 0 && response.data?.avatar_url) {
                setSuccessMessage("头像上传成功！");
                setSelectedAvatarFile(null);
                if(avatarInputRef.current) avatarInputRef.current.value = "";
                await loadUserStoreInfo();
                await fetchPageProfileData(true);
            } else {
                setError(response.message || "头像上传失败。");
            }
        } catch (err: unknown) { // *** 修复 2 ***
            let message = "头像上传时发生网络错误。";
            if (err instanceof ApiError) {
                message = (err.body as { message?: string })?.message || err.message;
            } else if (err instanceof Error) {
                message = err.message;
            }
            setError(message);
        } finally {
            setIsUploadingAvatar(false);
        }
    };


    const handleEditToggle = () => {
        if (editMode && profileData) {
            setEditFormData({
                nickname: profileData.nickname || '',
                gender: profileData.gender ?? 0 as enums_Gender,
                city: profileData.city || '',
                province: profileData.province || '',
            });
            setSelectedAvatarFile(null);
            setAvatarPreview(profileData.avatar_url || null);
            if(avatarInputRef.current) avatarInputRef.current.value = "";
        }
        setEditMode(!editMode);
        setError(null);
        setSuccessMessage(null);
    };

    const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setError(null);
        setSuccessMessage(null);

        const profileUpdateData: dto_UpdateProfileDTO = {
            nickname: editFormData.nickname,
            gender: editFormData.gender,
            city: editFormData.city,
            province: editFormData.province,
        };

        try {
            const response = await ProfileManagementService.putApiV1UserHubProfile({
                requestBody: profileUpdateData,
            });
            if (response.code === 0) {
                setSuccessMessage("用户资料更新成功！");
                setEditMode(false);
                await loadUserStoreInfo();
                await fetchPageProfileData(true);
            } else {
                setError(response.message || "更新用户资料失败。");
            }
        } catch (err: unknown) { // *** 修复 3 ***
            let message = "保存用户资料时发生网络错误。";
            if (err instanceof ApiError) {
                message = (err.body as { message?: string })?.message || err.message;
            } else if (err instanceof Error) {
                message = err.message;
            }
            setError(message);
        } finally {
            setIsSavingProfile(false);
        }
    };

    // ** 移除了未使用的变量 **
    // const initialCharForAvatar = (profileData?.nickname || currentUserFromStore?.nickname || '趣').charAt(0);
    // const userIdForAvatarColor = profileData?.user_id || currentUserFromStore?.user_id || '0';
    const currentAvatarDisplay = avatarPreview || profileData?.avatar_url || defaultAvatarSrc;


    if (isLoading) {
        return (
            <div className="profile-loading-container">
                <svg className="animate-spin h-12 w-12 text-[var(--theme-primary)] mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="text-xl text-[var(--theme-text-secondary)] font-medium">正在加载您的资料...</p>
            </div>
        );
    }

    if (error && !profileData) {
        return (
            <div className="profile-loading-container">
                <AlertTriangle size={64} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-semibold text-red-600 mb-2">加载资料失败</h2>
                <p className="text-[var(--theme-text-secondary)] mb-6">{error}</p>
                <button onClick={() => fetchPageProfileData(false)} className="btn-primary px-6 py-2 flex items-center">
                    <RotateCcw size={18} className="mr-2" /> 重试
                </button>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="profile-page-container">
                <header className="profile-header">
                    <h1 className="profile-title">
                        <UserIconLucide size={36} className="mr-3 icon-趣蓝" />
                        我的资料
                    </h1>
                    <p className="profile-subtitle">在这里管理您的个人信息和偏好设置。</p>
                </header>
                <div className="profile-card thick-border text-center">
                    <VenetianMask size={56} className="mx-auto text-slate-400 mb-4" />
                    <p className="text-xl text-[var(--theme-text-secondary)]">未能加载用户资料，或资料不存在。</p>
                    <button onClick={() => fetchPageProfileData(false)} className="btn-primary mt-6 px-6 py-2 flex items-center mx-auto">
                        <RotateCcw size={18} className="mr-2" /> 重新加载资料
                    </button>
                </div>
            </div>
        );
    }

    const displayStatus = profileData.status ?? 0;
    const displayRole = profileData.user_role ?? ROLES.USER;

    const statusInfo = userStatusMap[displayStatus as enums_UserStatus] || { text: '未知状态', icon: <AlertTriangle size={14} className="mr-1" />, badgeClass: 'bg-gray-100 text-gray-700' };
    const roleInfo = userRoleMap[displayRole as enums_UserRole] || { text: '未知角色', icon: <UserIconLucide size={14} className="mr-1" />, badgeClass: 'bg-gray-100 text-gray-700' };


    return (
        <div className="profile-page-container">
            <header className="profile-header">
                <h1 className="profile-title">
                    <UserIconLucide size={36} className="mr-3 icon-趣蓝" />
                    我的资料
                </h1>
                <p className="profile-subtitle">在这里管理您的个人信息和偏好设置。</p>
            </header>

            {error && (
                <div className="form-feedback error-feedback mb-6">
                    <AlertTriangle size={18} /> <span>{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="form-feedback success-feedback mb-6">
                    <CheckCircle size={18} /> <span>{successMessage}</span>
                </div>
            )}

            <div className="profile-card thick-border">
                <div className="profile-main-info-grid">
                    <div className="profile-avatar-section group">
                        <Image
                            src={currentAvatarDisplay}
                            alt={profileData.nickname || "用户头像"}
                            width={128}
                            height={128}
                            className="profile-avatar-image group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).src = defaultAvatarSrc; }}
                            priority
                        />
                        {editMode && (
                            <>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/gif"
                                    ref={avatarInputRef}
                                    onChange={handleAvatarFileChange}
                                    className="hidden"
                                    id="avatarUploadInput"
                                    disabled={isUploadingAvatar || isSavingProfile}
                                />
                                <label htmlFor="avatarUploadInput" className="profile-avatar-change-button" title="选择新头像">
                                    <ImageUp size={20} />
                                </label>
                                {selectedAvatarFile && (
                                    <button
                                        type="button"
                                        onClick={handleUploadAvatar}
                                        className="btn-secondary-outline text-xs px-3 py-1.5 mt-3 w-full flex items-center justify-center"
                                        disabled={isUploadingAvatar || isSavingProfile}
                                    >
                                        {isUploadingAvatar ? (
                                            <><svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>上传中...</>
                                        ) : (
                                            <><Check size={16} className="mr-1.5" />确认上传此头像</>
                                        )}
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    <div className="profile-user-details">
                        <h2 className="profile-nickname">
                            {profileData.nickname || '未设置昵称'}
                        </h2>
                        <p className="profile-userid">用户ID: {profileData.user_id}</p>
                        <div className="profile-tags-container">
                            <span className={`profile-tag ${statusInfo.badgeClass}`}>
                                {statusInfo.icon}
                                {statusInfo.text}
                            </span>
                            <span className={`profile-tag ${roleInfo.badgeClass}`}>
                                {roleInfo.icon}
                                {roleInfo.text}
                            </span>
                        </div>
                        {!editMode && (
                            <button onClick={handleEditToggle} className="btn-edit-profile btn-secondary-outline">
                                <Edit3 size={16} className="mr-2" /> 编辑资料
                            </button>
                        )}
                    </div>
                </div>

                {editMode ? (
                    <form onSubmit={handleSaveProfile} className="profile-edit-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="nickname" className="form-label">昵称</label>
                                <input type="text" id="nickname" name="nickname" value={editFormData.nickname} onChange={handleInputChange} className="form-input" placeholder="您的昵称" disabled={isSavingProfile || isUploadingAvatar} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="gender" className="form-label">性别</label>
                                <select id="gender" name="gender" value={editFormData.gender} onChange={handleInputChange} className="form-select" disabled={isSavingProfile || isUploadingAvatar}>
                                    <option value={0 as enums_Gender}>保密</option>
                                    <option value={1 as enums_Gender}>男</option>
                                    <option value={2 as enums_Gender}>女</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="province" className="form-label">省份</label>
                                <input type="text" id="province" name="province" value={editFormData.province} onChange={handleInputChange} className="form-input" placeholder="例如：广东" disabled={isSavingProfile || isUploadingAvatar} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="city" className="form-label">城市</label>
                                <input type="text" id="city" name="city" value={editFormData.city} onChange={handleInputChange} className="form-input" placeholder="例如：深圳" disabled={isSavingProfile || isUploadingAvatar} />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" onClick={handleEditToggle} className="btn-secondary px-6 py-2.5" disabled={isSavingProfile || isUploadingAvatar}>取消</button>
                            <button type="submit" className="btn-primary px-6 py-2.5 flex items-center justify-center" disabled={isSavingProfile || isUploadingAvatar}>
                                {isSavingProfile ? (
                                    <><svg className="animate-spin -ml-1 mr-3 h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>保存中...</>
                                ) : (
                                    <><Save size={18} className="mr-2" /> 保存资料</>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-display-section">
                        <div className="profile-info-item">
                            <span className="profile-info-label"><UserIconLucide size={16} className="mr-2 icon-secondary" />昵称:</span>
                            <span className="profile-info-value">{profileData.nickname || '未设置'}</span>
                        </div>
                        <div className="profile-info-item">
                            <span className="profile-info-label"><VenetianMask size={16} className="mr-2 icon-secondary" />性别:</span>
                            <span className="profile-info-value">
                                {typeof profileData.gender === 'number' && (0 as enums_Gender) <= profileData.gender && profileData.gender <= (2 as enums_Gender)
                                    ? (genderMap[profileData.gender as (0 | 1 | 2)] || '未知')
                                    : '未设置'
                                }
                            </span>
                        </div>
                        <div className="profile-info-item">
                            <span className="profile-info-label"><MapPin size={16} className="mr-2 icon-secondary" />地区:</span>
                            <span className="profile-info-value">
                                {profileData.province || profileData.city ? `${profileData.province || ''} ${profileData.city || ''}`.trim() : '未设置'}
                            </span>
                        </div>
                        <div className="profile-info-item">
                            <span className="profile-info-label"><CalendarDays size={16} className="mr-2 icon-secondary" />加入时间:</span>
                            <span className="profile-info-value">{formatProfileTimestamp(profileData.created_at)}</span>
                        </div>
                        <div className="profile-info-item">
                            <span className="profile-info-label"><CalendarDays size={16} className="mr-2 icon-secondary" />最后更新:</span>
                            <span className="profile-info-value">{formatProfileTimestamp(profileData.updated_at)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default withAuth(UserProfilePage, {
    allowedRoles: [ROLES.USER, ROLES.ADMIN],
    LoadingComponent: () => (
        <div className="profile-loading-container">
            <svg className="animate-spin h-12 w-12 text-[var(--theme-primary)] mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-xl text-[var(--theme-text-secondary)] font-medium">正在准备您的个人资料页面...</p>
        </div>
    ),
});
