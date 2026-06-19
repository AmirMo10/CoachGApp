import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16A34A',
          dark: '#15803D',
        },
        ink: '#0F172A',
      },
    },
  },
  plugins: [],
};

export default config;
