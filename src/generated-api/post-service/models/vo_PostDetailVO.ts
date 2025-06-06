/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { enums_OfficialTag } from './enums_OfficialTag';
import type { vo_PostImageVO } from './vo_PostImageVO';
export type vo_PostDetailVO = {
    /**
     * 作者头像URL
     */
    author_avatar?: string;
    /**
     * 作者ID
     */
    author_id?: string;
    /**
     * 作者用户名
     */
    author_username?: string;
    /**
     * 联系方式 (手机号、微信号、QQ号等)
     */
    contact_info?: string;
    /**
     * --- 来自 PostDetail 实体 ---
     */
    content?: string;
    /**
     * 创建时间
     */
    created_at?: string;
    /**
     * --- 来自 Post 实体 ---
     */
    id?: number;
    /**
     * --- 来自 PostDetailImage 实体列表 ---
     * Images 字段存储了帖子的所有详情图片，并已按 DisplayOrder 排序。
     */
    images?: Array<vo_PostImageVO>;
    /**
     * 官方标签 (参考 enums.OfficialTag)
     */
    official_tag?: enums_OfficialTag;
    /**
     * 单价 (单位：元)
     */
    price_per_unit?: number;
    /**
     * 帖子标题
     */
    title?: string;
    /**
     * 更新时间
     */
    updated_at?: string;
    /**
     * 浏览量
     */
    view_count?: number;
};

