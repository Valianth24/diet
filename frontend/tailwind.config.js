/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4CAF50',
        secondary: '#26C6DA',
        warning: '#FF9800',
        danger: '#F44336',
        'dark-text': '#212121',
        'light-text': '#757575',
      }
    },
  },
  plugins: [],
};