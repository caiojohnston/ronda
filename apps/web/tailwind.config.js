/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        risk: {
          low: "#22c55e",
          mid: "#eab308",
          high: "#f97316",
          critical: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
