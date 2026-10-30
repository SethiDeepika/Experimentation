/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dae6ff',
          500: '#4f6bed',
          600: '#3d55d6',
          700: '#3244ad',
        },
      },
    },
  },
  plugins: [],
}
