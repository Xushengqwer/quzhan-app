// src/components/Footer.tsx
import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer style={{
            backgroundColor: '#333',
            color: 'white',
            padding: '30px 20px', // 增加了上下内边距
            textAlign: 'center',
            borderTop: '1px solid #444' // 添加了上边框
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <p style={{ margin: '0 0 10px 0' }}>
                    &copy; {currentYear} 社区应用. 保留所有权利. {/* 记得替换成你的应用名称 */}
                </p>
                <nav>
                    <a href="/privacy-policy" style={{ color: '#aaa', margin: '0 10px', textDecoration: 'none' }}>
                        隐私政策
                    </a>
                    <span style={{ color: '#555' }}>|</span>
                    <a href="/terms-of-service" style={{ color: '#aaa', margin: '0 10px', textDecoration: 'none' }}>
                        服务条款
                    </a>
                    <span style={{ color: '#555' }}>|</span>
                    <a href="/contact-us" style={{ color: '#aaa', margin: '0 10px', textDecoration: 'none' }}>
                        联系我们
                    </a>
                </nav>
            </div>
        </footer>
    );
};

export default Footer;