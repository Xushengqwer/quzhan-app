/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_ImageEventData } from './models_ImageEventData';
export type models_EsPostDocument = {
    /**
     * 作者头像的 URL 或标识符。
     */
    author_avatar?: string;
    /**
     * 作者的用户 ID。
     */
    author_id?: string;
    /**
     * 作者的用户名。
     */
    author_username?: string;
    /**
     * 联系方式
     */
    contact_info?: string;
    /**
     * 帖子内容。
     */
    content?: string;
    created_at?: number;
    /**
     * 新增：用于存储高亮片段的字段
     * 键是字段名 (如 "title", "content")，值是包含高亮HTML片段的字符串切片。
     * omitempty 表示如果 Highlights 为 nil 或空 map，则在JSON序列化时忽略此字段。
     * 我们不在 _source 中存储这个字段，它是由 Elasticsearch 在查询时动态生成的。
     * 因此，不需要 `json:"-"` 标签来阻止它被 Elasticsearch 索引，
     * 但在API响应中我们希望包含它，所以使用 `json:"highlights,omitempty"`。
     */
    highlights?: Record<string, Array<string>>;
    /**
     * 帖子唯一标识符。使用 uint64 以兼容 ES 的 long 或 unsigned_long 类型。
     */
    id?: number;
    /**
     * 图片列表
     */
    images?: Array<models_ImageEventData>;
    /**
     * 官方标签，直接使用导入的枚举类型（建议在 ES 中存储为整数或映射为 keyword）。
     */
    official_tag?: number;
    /**
     * 每单位价格（如果适用）。
     */
    price_per_unit?: number;
    /**
     * 帖子状态，直接使用导入的枚举类型（建议在 ES 中存储为整数或映射为 keyword）。
     */
    status?: number;
    /**
     * 帖子标题。
     */
    title?: string;
    /**
     * 文档在 Elasticsearch 中最后更新的时间戳。
     */
    updated_at?: string;
    /**
     * 帖子浏览量。
     */
    view_count?: number;
};

