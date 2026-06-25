import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Koda brand — Purple + Amber, from kodaapp DESIGN_STANDARDS
                koda: {
                    purple: '#534AB7',
                    'purple-hover': '#453DA0',
                    'purple-soft': '#F0EEF9',
                    'purple-accent': '#7C6DD8',
                    amber: '#EF9F27',
                    'amber-hover': '#E08B10',
                    'amber-soft': '#FFF8EB',
                },
                // brand-* mirrors koda purple so existing classes keep working
                brand: {
                    DEFAULT: '#534AB7',
                    50: '#F0EEF9',
                    100: '#DDD8F3',
                    200: '#C5BDEA',
                    400: '#7C6DD8',
                    500: '#534AB7',
                    600: '#453DA0',
                    700: '#3A3489',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            boxShadow: {
                'koda-glow': '0 16px 30px rgba(83, 74, 183, 0.20)',
                'koda-amber-glow': '0 16px 30px rgba(239, 159, 39, 0.20)',
            },
            backgroundImage: {
                'koda-gradient': 'linear-gradient(135deg, #534AB7 0%, #7C6DD8 100%)',
                'koda-amber-gradient': 'linear-gradient(135deg, #EF9F27 0%, #E08B10 100%)',
            },
        },
    },
    plugins: [],
} satisfies Config;
