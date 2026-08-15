/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        risk: {
          low: "#2ecc71",
          mid: "#f1c40f",
          high: "#e67e22",
          critical: "#e74c3c",
        },
      },
    },
  },
  plugins: [],
};
