/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'esto-primary': '#B25D42', // Terracotta extracted from logo
        'esto-primary-dark': '#8E4A35',
        'esto-bg': '#FDFBF7', // Very light beige/cream for contrast
        'esto-surface': '#FFFFFF', // Pure white for cards/header
        'esto-text': '#362E2A', // Warm dark gray
        'esto-muted': '#847974', // Muted gray-brown
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in-right': {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'zoom-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-down': 'fade-in-down 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-left': 'fade-in-left 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-right': 'fade-in-right 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'zoom-in': 'zoom-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
