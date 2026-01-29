/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    screens: {
    nav: "1048px",
    },
    extend: {
      colors: {
        primary: "#7c3aed",
        dark: "#0a0a0a",
        darkSecondary: "#111111",
        textPrimary: "#e5e7eb",
        textSecondary: "#9ca3af",
      },
    },
  },
  plugins: [],
};
