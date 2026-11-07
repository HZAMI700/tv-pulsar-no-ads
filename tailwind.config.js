/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bgBase: '#07080D',
        bgSurface: '#0E1018',
        bgElevated: '#151722',
        primary: {
          DEFAULT: '#FF1838',
          hover: '#FF3853',
        },
        liveGreen: '#00E676',
        gold: '#FFB800',
        tech4k: '#00F2FE',
      },
      fontFamily: {
        sans: ['Cairo', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
