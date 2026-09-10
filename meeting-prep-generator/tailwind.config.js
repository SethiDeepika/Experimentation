/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5d9e2",
          300: "#b0b8c7",
          400: "#8590a6",
          500: "#66718a",
          600: "#515a70",
          700: "#42495b",
          800: "#393e4d",
          900: "#242731",
        },
        brand: {
          50: "#f1f4ff",
          100: "#e2e8ff",
          200: "#c9d3ff",
          300: "#a3b3ff",
          400: "#7688ff",
          500: "#4f5cf5",
          600: "#3b3fdb",
          700: "#3130b0",
          800: "#292a8c",
          900: "#252770",
        },
      },
    },
  },
  plugins: [],
};
