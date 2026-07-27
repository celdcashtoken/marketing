/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.18s ease-out',
      },
      colors: {
        brand: '#00C896',
        'brand-soft': '#ECFDF5',
        'cmo-accent': '#B45309',
        'creatives-accent': '#7C3AED',
        'socials-accent': '#DB2777',
        'assistant-accent': '#059669',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

