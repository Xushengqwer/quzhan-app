// E:\frontend\doer_hub\tailwind.config.js (完整内容)
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'theme-primary': 'var(--theme-primary)',
        'theme-primary-hover': 'var(--theme-primary-hover)',
        'theme-secondary': 'var(--theme-secondary)',
        'theme-text-primary': 'var(--theme-text-primary)',
        'theme-text-secondary': 'var(--theme-text-secondary)',
        'theme-background': 'var(--theme-background)',
        'theme-card-bg': 'var(--theme-card-bg)',
        'theme-border-color': 'var(--theme-border-color)',
        'theme-border-strong-color': 'var(--theme-border-strong-color)',
      },
      fontFamily: {
        display: ['ZCOOL KuaiLe', 'cursive'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      height: {
        'header': 'var(--header-height)',
      },
      borderColor: {
        'theme-default': 'var(--theme-border-color)',
        'theme-strong': 'var(--theme-border-strong-color)',
        'theme-primary': 'var(--theme-primary)',
        'theme-primary-hover': 'var(--theme-primary-hover)',
      },
      boxShadow: {
        'theme-default': 'var(--theme-shadow)',
        'theme-strong': 'var(--theme-strong-shadow)',
      }
    },
  },
  plugins: [],
};