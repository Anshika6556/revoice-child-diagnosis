/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f6f6fb',
        brand: {
          50: '#eef0ff',
          100: '#e0e3ff',
          200: '#c6caff',
          300: '#a3a6fd',
          400: '#8381f8',
          500: '#6a5ff1',
          600: '#5a45e5',
          700: '#4c37ca',
          800: '#3e2fa3',
          900: '#352d81',
          950: '#211a4b',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Baloo 2"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', 'Inter', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 16px -4px rgb(15 23 42 / 0.06)',
        lift: '0 2px 4px rgb(15 23 42 / 0.04), 0 16px 40px -12px rgb(76 55 202 / 0.18)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'level': {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
        'level': 'level 0.9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
