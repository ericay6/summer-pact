import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1100px" },
    },
    extend: {
      colors: {
        // Warm, summery palette ("receipts, not vibes").
        sand: {
          50: "#fdf9f3",
          100: "#fbf1e4",
          200: "#f6e1c5",
          300: "#efcb9c",
        },
        sunset: {
          50: "#fff4ed",
          100: "#ffe6d5",
          200: "#fdc9a8",
          300: "#fba572",
          400: "#f77a3e",
          500: "#f25a1b",
          600: "#e34110",
          700: "#bc2f10",
        },
        peach: {
          400: "#ff9e7a",
          500: "#ff7e54",
        },
        berry: {
          400: "#f06aa6",
          500: "#e84d92",
        },
        lagoon: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        ink: "#2b2118",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        cozy: "0 8px 30px -12px rgba(226, 90, 27, 0.25)",
        card: "0 2px 14px -6px rgba(43, 33, 24, 0.18)",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "confetti-rise": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.25s ease-out",
        "confetti-rise": "confetti-rise 0.4s ease-out",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
