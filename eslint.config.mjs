import next from 'eslint-config-next';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        // 忽略 .next 目录中的文件
        ignores: ['.next/**'],
    },
    // 应用 Next.js 的基础配置和核心性能指标配置
    ...next.configs.base,
    ...next.configs['core-web-vitals'],
    // 应用 typescript-eslint 的推荐规则
    ...tseslint.configs.recommended,
    {
        // 自定义规则配置
        rules: {
            // 关闭字体警告，因为它对 App Router 是一个误报
            '@next/next/no-page-custom-font': 'off',
            // 关闭 typescript-eslint 的 no-unused-vars 规则，Next.js 会处理它
            '@typescript-eslint/no-unused-vars': 'off',
            // 关闭 no-explicit-any 规则
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
);