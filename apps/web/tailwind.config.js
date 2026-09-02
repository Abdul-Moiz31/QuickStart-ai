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
        accent: "#0A0A0A",
        accentHover: "#1A1A1A",
        canvas: "#F7F5F1",
      },
      fontFamily: {
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 20px 50px rgba(10,10,10,0.06)",
        nav: "inset 0 -3px 0 0 rgba(10,10,10,0.04), inset 0 1px 0 0 rgba(255,255,255,1), 0 3px 3px rgba(10,10,10,0.02), 0 7px 5px rgba(10,10,10,0.03), 0 13px 10px rgba(10,10,10,0.04), 0 22px 18px rgba(10,10,10,0.04), 0 42px 33px rgba(10,10,10,0.05)",
        btn: "0 1px 2px rgba(10,10,10,0.06), 0 4px 8px rgba(10,10,10,0.10), 0 12px 24px rgba(10,10,10,0.14)",
      },
      backgroundImage: {
        "btn-primary": "linear-gradient(103deg, #1A1A1A -17%, #0A0A0A 100%)",
        "btn-light": "linear-gradient(103deg, #FFFFFF 0%, #FFFFFF 100%)",
      },
    },
  },
  plugins: [],
};
