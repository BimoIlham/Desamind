/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Slate Dark Green
        primary: {
          DEFAULT: '#133D3A',
          50: '#EDFAF9',
          100: '#D0F2F1',
          200: '#A6E4E1',
          300: '#78D1CD',
          400: '#52BDB8',
          500: '#38A39D',
          600: '#2B827D',
          700: '#216661',
          800: '#194F4B',
          900: '#133D3A',
          950: '#0D1C1B',
        },
        // Accent: Forest Green (replaces old yellow/gold)
        accent: {
          DEFAULT: '#2B6B3E',
          50: '#F0FBF4',
          100: '#DCF5E5',
          200: '#B6E6C5',
          300: '#8BD5A2',
          400: '#62C481',
          500: '#48B168',
          600: '#398E53',
          700: '#2B6B3E',
          800: '#1F522F',
          900: '#163A21',
          950: '#081F0F',
        },
        // Background: Warm Off-White
        bg: '#F9F8F4',
        // Surface / Card: Clean White or subtle off-white
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
