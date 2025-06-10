import { Suspense } from 'react';
import SearchPageComponent from './SearchPageComponent';

// 为 Suspense 创建一个加载状态的UI组件，提升用户体验
const SearchPageLoading = () => {
    return (
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(var(--header-height)+1.5rem)] pb-16 min-h-screen">
            <div className="text-center py-20">
                <svg className="mx-auto mb-4 h-12 w-12 animate-spin text-[var(--theme-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg text-[var(--theme-text-secondary)]">正在加载搜索页面...</p>
            </div>
        </div>
    );
};

// 这是新的 page.tsx，它是一个服务器组件
export default function SearchPage() {
    return (
        <Suspense fallback={<SearchPageLoading />}>
            <SearchPageComponent />
        </Suspense>
    );
}