// frontend/doer_hub/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthInitializer from "@/components/AuthInitializer";
import ApiClientInitializer from "@/components/ApiClientInitializer";
// import Head from "next/head"; // next/head is not needed in App Router for <link> tags in RootLayout

export const metadata: Metadata = {
    title: "趣站 - 婉约卡通风",
    description: "一个充满趣味和创造力的婉约卡通风格站点。",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN">
        {/* 确保 <head> 是 <html> 的直接子元素，并且内部没有多余的空格 */}
        <head>
            {/* Google Fonts - 放置在 <head> 内部 */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=ZCOOL+KuaiLe&display=swap" rel="stylesheet" />
            {/* 确保这里没有其他不应该在<head>中的内容或多余空格 */}
        </head>
        {/* 确保 <body> 是 <html> 的直接子元素，并且和 <head> 之间没有多余空格 */}
        <body>
        <ApiClientInitializer />
        <AuthInitializer />
        <Header />
        <main className="flex-grow container mx-auto px-5 pt-[calc(var(--header-height)+1.5rem)] min-h-screen">
            {children}
        </main>
        <Footer />
        </body>
        </html>
    );
}