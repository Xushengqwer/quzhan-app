// frontend/doer_hub/eslint.config.mjs

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
  // 继承 Next.js 的核心 linting 规则
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 新增一个配置对象，用于定义我们自己的规则
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], // 此规则应用于所有 JS/TS 文件
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // 核心：修改此规则以忽略以下划线开头的未使用变量
      '@typescript-eslint/no-unused-vars': [
        'error', // 或者 'warn'，如果你希望它只作为警告而不是错误
        {
          'args': 'all',
          'argsIgnorePattern': '^_', // 忽略以下划线开头的函数参数
          'varsIgnorePattern': '^_', // 忽略以下划线开头的变量
          'caughtErrors': 'all',
          'caughtErrorsIgnorePattern': '^_',
          'destructuredArrayIgnorePattern': '^_',
          'ignoreRestSiblings': true
        }
      ]
    }
  }
];

export default eslintConfig;