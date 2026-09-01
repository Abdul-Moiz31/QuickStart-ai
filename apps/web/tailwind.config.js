/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        clay: "#E2E4F6",
        white: "#FFFFFF",
        porcelain: "#F3F3FE",
        ink: "#1E213A",
        mute: "#797EA4",
        line: "rgba(30,33,58,0.08)",
        inkHover: "#15172A",
        accent: "#5C4EEC",
        accentHover: "#594BEC",
        canvas: "#DCDEF0",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 20px 50px rgba(26, 0, 108, 0.06)",
        nav: "inset 0 -3px 0 0 rgba(223,222,251,1), inset 0 1px 0 0 rgba(255,255,255,1), 0 3px 3px rgba(26,0,108,0.02), 0 7px 5px rgba(26,0,108,0.03), 0 13px 10px rgba(26,0,108,0.04), 0 22px 18px rgba(26,0,108,0.04), 0 42px 33px rgba(26,0,108,0.05)",
        btn: "0 1px 2px rgba(26,0,108,0.06), 0 4px 8px rgba(61,47,98,0.10), 0 12px 24px rgba(61,47,98,0.14)",
      },
      backgroundImage: {
        "btn-primary": "linear-gradient(103deg, #4A3681 -17%, #1E213A 100%)",
        "btn-light": "linear-gradient(103deg, #FFFFFF 0%, #FFFFFF 100%)",
      },
    },
  },
  plugins: [],
};
