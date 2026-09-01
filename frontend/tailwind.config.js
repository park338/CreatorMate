/** Tailwind 配置 —— 小悠涨粉搭子视觉规范 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8',
          300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899',
          600: '#db2777', 700: '#be185d',
        },
        grape: {
          400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
        },
        mint: { 400: '#34d399', 500: '#10b981' },
        orange: { 400: '#fb923c', 500: '#f97316' },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans CJK SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.06)',
        glow: '0 8px 40px rgba(236,72,153,0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
