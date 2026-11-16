/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#000000',
        accent: {
          DEFAULT: '#e50914',
          hover: '#f40612',
        },
        surface: {
          DEFAULT: '#232323',
          2: '#2d2d2d',
        },
        ink: '#ffffff',
        obsidian: '#090A0F',
        slate: '#131620',
        elevated: '#1E2230',
        glass: 'rgba(22, 26, 37, 0.85)',
        crimson: {
          DEFAULT: '#FF2A4B',
          soft: 'rgba(255, 42, 75, 0.16)',
          hover: '#FF4765',
        },
        emerald: {
          DEFAULT: '#10B981',
          soft: 'rgba(16, 185, 129, 0.16)',
        },
        primaryText: '#F8FAFC',
        secondaryText: '#94A3B8',
        mutedText: '#64748B',
        hairline: 'rgba(255, 255, 255, 0.08)',
        bgBase: '#090A0F',
        bgSurface: '#131620',
        bgElevated: '#1E2230',
        primary: {
          DEFAULT: '#FF2A4B',
          hover: '#FF4765',
        },
        liveGreen: '#10B981',
        gold: '#F59E0B',
        tech4k: '#38BDF8',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Cairo', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
