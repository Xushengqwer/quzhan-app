// src/config/authConfig.ts
import type {enums_UserRole} from '@/generated-api'; // [cite: uploaded:doer_hub/src/generated-api/models/enums_UserRole.ts]

// 定义角色常量，使其更具可读性
// 值应与您的 enums_UserRole.ts 中的定义匹配 (0=Admin, 1=User, 2=Guest) [cite: uploaded:doer_hub/src/generated-api/models/enums_UserRole.ts]
export const ROLES = {
    ADMIN: 0 as enums_UserRole,
    USER: 1 as enums_UserRole,
    GUEST: 2 as enums_UserRole, // 通常 GUEST 不会出现在 allowedRoles 中，除非是特定公共内容
};

// 定义哪些路由路径需要哪些角色才能访问
// 键是路由路径 (相对于 /app 目录，或者您在 HOC 中匹配的路径格式)
// 值是允许的角色数组
export const ROUTE_PERMISSIONS: Record<string, enums_UserRole[]> = {
    '/admin': [ROLES.ADMIN], // 整个 /admin 路径下的页面都需要管理员权限 (可以在布局层级使用)
    '/admin/dashboard': [ROLES.ADMIN], // 特定的管理员仪表盘页面
    '/profile': [ROLES.ADMIN, ROLES.USER], // 个人资料页，管理员和普通用户都可以访问
    '/posts/create': [ROLES.ADMIN, ROLES.USER], // 创建帖子页面
    // ... 您可以根据需要添加更多路由和对应的权限
    // 例如：
    // '/settings': [ROLES.USER], // 只有普通用户能访问的设置页 (管理员可能通过其他方式访问)
};

// 定义重定向路径
export const UNAUTHORIZED_REDIRECT_PATH = '/unauthorized'; // 权限不足时的跳转页面
export const LOGIN_REDIRECT_PATH = '/login';         // 未登录时的跳转页面