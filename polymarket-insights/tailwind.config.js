/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        ink: {
          50: "#f6f7f9", 100: "#eceef2", 200: "#d5d9e2", 300: "#b0b8c7", 400: "#8590a6",
          500: "#66718a", 600: "#515a70", 700: "#42495b", 800: "#393e4d", 900: "#242731",
        },
        brand: {
          50: "#eef5ff", 100: "#d9e8ff", 200: "#bcd7ff", 300: "#8ebeff", 400: "#5999ff",
          500: "#2e72f6", 600: "#1d56d9", 700: "#1a45b0", 800: "#1c3c8b", 900: "#1c356f",
        },
      },
    },
  },
  plugins: [],
};
