/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        clay: "#F7F5F1",
        white: "#FFFFFF",
        porcelain: "#FAF8F5",
        ink: "#0A0A0A",
        mute: "#5C5A56",
        line: "rgba(10,10,10,0.08)",
        inkHover: "#1A1A1A",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 20px 50px rgba(10, 10, 10, 0.06)",
      },
    },
  },
  plugins: [],
