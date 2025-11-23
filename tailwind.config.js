/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neo: {
          bg: 'rgb(237, 207, 207)',
          darkBg: 'rgb(20, 20, 22)',
          accent: '#8855ff',
        }
      },
      boxShadow: {
        'neu-flat': '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5)',
        'neu-pressed': 'inset 6px 6px 10px 0 rgba(163,177,198, 0.7), inset -6px -6px 10px 0 rgba(255,255,255, 0.8)',
        'neu-flat-dark': '5px 5px 10px #1f1f1f, -5px -5px 10px #3b3b3b',
        'neu-pressed-dark': 'inset 5px 5px 10px #1f1f1f, inset -5px -5px 10px #3b3b3b',
        'brutal': '4px 4px 0px 0px #000000',
      }
    }
  },
  plugins: [],
}

