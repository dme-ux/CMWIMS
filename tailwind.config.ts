import type { Config } from "tailwindcss";

/**
 * CMW ERP — Tailwind config
 * Brand palette derived from the Capital Motor Works shield logo:
 * royal/electric blue on white, with a corporate ink for text.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd2ff",
          300: "#8eb4ff",
          400: "#598cff",
          500: "#2563eb", // primary
          600: "#1e40af", // deep (logo)
          700: "#1b3a9c",
          800: "#1c357f",
          900: "#1c3169",
          950: "#131f42",
        },
        ink: {
          DEFAULT: "#0f172a",
          soft: "#334155",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(30, 64, 175, 0.12)",
        "glass-lg": "0 20px 60px -12px rgba(30, 64, 175, 0.25)",
        card: "0 1px 3px rgba(15,23,42,0.06), 0 8px 24px -8px rgba(15,23,42,0.10)",
      },
      backdropBlur: { xs: "2px" },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-18px) rotate(6deg)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        "float-slow": "float 12s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
