import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C5CFA',
          50: '#F4F0FF',
          100: '#E8E0FF',
          200: '#D2C2FE',
          500: '#7C5CFA',
          600: '#6845E8',
          700: '#5535C9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
