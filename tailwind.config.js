/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        islamic: {
          green: '#1a6b3c',
          'green-light': '#2d8a52',
          'green-dark': '#0f4a28',
          gold: '#c9a84c',
          'gold-light': '#e0c066',
          'gold-dark': '#a0853a',
          cream: '#f8f5e8',
          white: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
