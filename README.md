# 趣站 - 前端项目

欢迎来到“趣站”的前端代码库！“趣站”是一个以“婉约卡通风格”为设计理念的社区应用。 本平台允许用户分享想法、经验、发布和浏览帖子、搜索内容以及管理个人资料。管理员拥有专属的管理面板，用于内容审核和用户管理。

## ✨ 主要功能

* **用户认证与授权：**
    * 支持账号（用户名/密码）注册和登录。
    * 支持手机号注册/登录，通过短信验证码进行验证。(需要后端支持)
    * 安全的基于令牌的认证机制（访问令牌 + 刷新令牌）。
    * 访问令牌过期后自动刷新。
    * 基于角色的访问控制（管理员、用户），通过高阶组件（HOC）实现。
* **帖子管理：**
    * 创建、查看和管理个人帖子。
    * 查看帖子详情，包括图片和作者信息。/page.tsx]
    * 浏览“热门”和“最新”帖子时间线。
* **搜索功能：**
    * 基于关键词搜索帖子，支持分页和排序。
* **个人资料管理：**
    * 查看和更新用户个人资料（昵称、性别、所在地）。
    * 上传和更改头像。
* **管理员面板：**
    * 查看、筛选和排序所有帖子。
    * 审核帖子（批准、拒绝）。
    * 更新帖子的官方标签。
    * 删除帖子。
* **响应式设计：**
    * 用户界面适配不同屏幕尺寸。
    * 移动端友好的导航菜单。
* **类型安全的 API 客户端：**
    * 通过 OpenAPI 规范自动生成针对用户中心、帖子服务和帖子搜索服务的 API 客户端，确保类型安全并减少冗余代码。

## 🚀 技术栈

* **框架：** Next.js 13+ (App Router)
* **语言：** TypeScript
* **样式：** Tailwind CSS (在 `globals.css` 中包含自定义主题和工具类)
* **状态管理：** Zustand
* **HTTP 客户端：** Axios (包含用于认证和错误处理的拦截器)
* **API 规范：** OpenAPI (Swagger) V2 & V3，用于生成 API 客户端
* **API 客户端生成：** `openapi-typescript-codegen` (根据生成的代码结构和 `src/lib/api/customRequest.ts` 中的注释推断)
* **图标库：** Lucide React
* **代码检查/格式化：** (推测为 ESLint, Prettier - Next.js 项目常用配置)

## 📁 项目结构

```
├── src/
│   ├── app/                  # Next.js App Router：页面和布局
│   │   ├── (page-routes)/    # 各路由文件夹 (例如：login, profile, admin)
│   │   │   ├── page.tsx      # 路由的 UI 组件
│   │   │   └── components/   # 特定于路由的子组件 (若有)
│   │   ├── globals.css       # 全局样式和 Tailwind 指令
│   │   └── layout.tsx        # 应用的根布局
│   ├── components/           # 共享 UI 组件
│   │   ├── ApiClientInitializer.ts # 初始化 API 客户端配置
│   │   ├── AuthInitializer.tsx   # 应用加载时处理认证状态
│   │   ├── Footer.tsx          # 全站页脚
│   │   ├── Header.tsx          # 全站页头与导航
│   │   └── auth/
│   │       └── withAuth.tsx    # 用于路由保护的高阶组件
│   ├── config/
│   │   └── authConfig.ts     # 角色定义和重定向路径
│   ├── generated-api/        # 自动生成的 API 客户端代码
│   │   ├── post-search/      # 帖子搜索服务的客户端
│   │   ├── post-service/     # 帖子服务的客户端
│   │   └── user-hub/         # 用户中心服务的客户端
│   ├── lib/
│   │   └── api/
│   │       ├── customRequest.ts # openapi-typescript-codegen 请求函数的自定义模板
│   │       └── request.ts       # 中心化的 Axios 实例和拦截器
│   ├── store/
│   │   └── userStore.ts      # Zustand store，用于用户会话和个人资料
│   ├── styles/               # (可能用于组件特定 CSS，如果未使用 Tailwind)
│   ├── types/                # OpenAPI/Swagger 定义文件 (JSON)
│   └── utils/
│       └── tokenManager.ts   # 管理 localStorage 中的访问令牌
├── public/                   # 静态资源
├── .env.local.example        # 环境变量示例文件
├── next.config.js            # Next.js 配置文件
├── package.json
└── tsconfig.json
```

## 🏁 快速开始

### 环境要求

* Node.js (>= 18.x 推荐)
* npm, yarn, 或 pnpm

### 安装步骤

1.  **克隆代码库：**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```
2.  **安装依赖：**
    ```bash
    npm install
    # 或
    yarn install
    # 或
    pnpm install
    ```

### 环境变量

在项目根目录下，通过复制 `.env.local.example` 文件来创建一个 `.env.local` 文件，并填入所需的环境变量。

**`.env.local.example`：**
```env
NEXT_PUBLIC_GATEWAY_HOST_AND_PORT=http://localhost:8080
```

* `NEXT_PUBLIC_GATEWAY_HOST_AND_PORT`：API 网关的基础 URL，用于路由到后端微服务的请求。

### 运行开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```
应用通常会在 `http://localhost:3000` (如果 3000 端口被占用，则会使用其他端口) 启动。

## 🔧 API 服务概览

前端通过 API 网关与三个主要的后端微服务进行交互：

1.  **用户中心服务 (`user-hub`)：**
    * 处理用户注册、登录（账号和手机）、令牌刷新、个人资料管理和用户管理。
    * 原始基础 URL (网关前)：`http://localhost:8081`
    * 生成的客户端：`src/generated-api/user-hub/`
2.  **帖子服务 (`post-service`)：**
    * 管理帖子的创建、检索、更新和删除，包括管理员操作如审核和标签管理。
    * 原始基础 URL (网关前)：`http://localhost:8082`
    * 生成的客户端：`src/generated-api/post-service/`
3.  **帖子搜索服务 (`post-search`)：**
    * 提供从 Kafka 事件索引的帖子搜索功能。
    * 原始基础 URL (网关前)：`http://localhost:8083`
    * 生成的客户端：`src/generated-api/post-search/`

所有来自前端的 API 请求都将通过 `NEXT_PUBLIC_GATEWAY_HOST_AND_PORT` (例如 `http://localhost:8080`) 进行路由。`src/lib/api/request.ts` 中的 `initializeApiClient` 函数会为所有生成的 API 客户端配置此网关 URL 作为基础 URL。

## 🔐 认证流程

1.  **登录/注册：** 用户通过账号密码或手机号（带短信验证码）进行登录或注册。
2.  **令牌颁发：** 成功认证后，后端颁发访问令牌（Access Token）和刷新令牌（Refresh Token）。访问令牌在响应体中返回，刷新令牌预期为 HttpOnly Cookie。
3.  **令牌存储：**
    * 访问令牌存储在 `localStorage`（由 `src/utils/tokenManager.ts` 管理）和 Zustand `userStore` 中。
    * `userStore` 会在令牌变更时更新所有相关 API 服务客户端的 `OpenAPI.TOKEN` 配置。
4.  **认证请求：**
    * `customRequest.ts` 模板（由生成的 API 客户端使用）会从相应 `OpenAPI.TOKEN` 配置中读取令牌，并附加到传出请求的 `Authorization` 头部（作为 Bearer Token）。
5.  **令牌刷新：**
    * `src/lib/api/request.ts` 中的 Axios 响应拦截器会检测特定的业务错误码（例如 `40102`），表明访问令牌已过期。
    * 检测到过期后，会自动调用用户中心服务的 `/auth/refresh-token` 接口。由于 Axios 配置了 `withCredentials: true`，浏览器会自动发送 HttpOnly 的刷新令牌 Cookie。
    * 如果刷新成功，新的访问令牌会被存储，`userStore` 更新，并且原始失败的请求会被重试。
    * 如果刷新失败（例如刷新令牌也无效，业务码 `40103`），用户会话将被清除，并重定向到登录页。
6.  **会话初始化 (`AuthInitializer`)：**
    * 应用加载时，如果 `userStore` 中的认证状态尚未初始化：
        * `userStore` 中的 `loadUserInfo` 函数被调用。
        * 此函数尝试从 `userStore` 或 `localStorage` 获取令牌。
        * 如果存在令牌，则调用用户中心服务的 `/profile` 接口以获取当前用户的完整账户详情（包括角色、个人资料等）。
        * 获取到的用户数据和令牌将用于更新 `userStore`，并将认证状态标记为已初始化。
        * 如果无令牌或获取失败，则清除会话。
7.  **路由保护 (`withAuth` HOC)：**
    * 包装需要认证或特定角色的页面/组件。
    * 检查 `userStore` 中的认证状态和用户角色。
    * 根据 `src/config/authConfig.ts` 中的定义，如果用户未认证则重定向到 `/login`，如果角色不满足要求则重定向到 `/unauthorized`。

## 🧩 关键组件与模块

* **`src/app/layout.tsx`：** 根布局，包含全局样式、字体设置、`ApiClientInitializer`、`AuthInitializer`、`Header` 和 `Footer`。
* **`src/lib/api/request.ts`：** 配置共享的 Axios 实例，包括对认证至关重要的请求/响应拦截器（令牌注入、刷新逻辑）。
* **`src/store/userStore.ts`：** Zustand store，管理全局用户状态、认证令牌和初始化状态。处理用户信息的获取和持久化。
* **`src/components/AuthInitializer.tsx`：** 确保应用启动时加载或清除用户会话。
* **`src/components/ApiClientInitializer.ts`：** 应用启动时为所有生成的 API 客户端配置基础 URL 和令牌。
* **`src/components/auth/withAuth.tsx`：** 用于基于认证状态和用户角色保护路由的高阶组件。
* **生成的 API 客户端 (`src/generated-api/`)：** 提供类型安全的方法与后端服务交互。每个服务（user-hub, post-service, post-search）都有其独立的生成客户端。

## 🎨 样式

* **Tailwind CSS：** 用于大部分样式的原子化 CSS 框架。
* **全局样式 (`src/app/globals.css`)：** 包含 Tailwind 的 base/components/utilities 指令、用于主题化的 CSS 变量（颜色、字体、尺寸）以及一些全局组件样式。
* **自定义字体：** “ZCOOL KuaiLe”（用于展示/Logo）和 “Noto Sans SC”（用于正文）通过 Google Fonts 在 `src/app/layout.tsx` 中导入。
* **页面特定样式：** 某些页面（例如 `login`, `profile`）拥有其专属的 CSS 文件（`login-styles.css`, `profile-styles.css`），以满足更具体或复杂的样式需求。

## 📜 API 文档与生成

* OpenAPI (Swagger) 规范文件 (V2 和 V3) 位于 `src/types/` 目录下。
    * `openapi-v3-*.json`
    * `swagger-v2-*.json`
* 这些规范用于通过 `openapi-typescript-codegen` 生成位于 `src/generated-api/` 的 API 客户端库。
* 这些生成客户端的自定义请求逻辑定义在 `src/lib/api/customRequest.ts` 中。

## 🧪 代码检查与格式化

*(假设配置 - 如果您的设置不同，请具体说明)*
* **ESLint：** 用于代码检查。
* **Prettier：** 用于代码格式化。
    ```bash
    npm run lint
    npm run format
    ```

## ☁️ 部署

*(在此处添加您的部署策略详情，例如 Vercel, Docker 等)*
该应用按标准 Next.js 项目构建：
```bash
npm run build
npm start # 用于生产服务器
```

## 🤝 贡献代码

*(如果适用，请在此处添加项目贡献指南)*