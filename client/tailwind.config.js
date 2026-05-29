/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          900: "#1e1b4b",
        },
        surface: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          800: "#1e293b",
          850: "#162032",
          900: "#0f172a",
          950: "#080e1a",
        },
      },
      animation: {
        "fade-in":   "fadeIn .4s ease both",
        "slide-up":  "slideUp .4s ease both",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        pulseDot: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
      },
    },
  },
  plugins: [],
};
