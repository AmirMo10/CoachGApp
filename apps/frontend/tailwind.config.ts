import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#10b981',
        },
        ink: {
          DEFAULT: '#0b1220',
          soft: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-vazir)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)',
        card: '0 1px 3px rgb(16 24 40 / 0.05), 0 8px 24px -12px rgb(16 24 40 / 0.10)',
        glow: '0 0 0 1px rgb(16 185 129 / 0.15), 0 12px 40px -12px rgb(16 185 129 / 0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'mesh':
          'radial-gradient(60% 60% at 20% 10%, rgba(16,185,129,0.20) 0%, rgba(2,6,23,0) 60%), radial-gradient(50% 50% at 90% 20%, rgba(56,189,248,0.14) 0%, rgba(2,6,23,0) 55%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
