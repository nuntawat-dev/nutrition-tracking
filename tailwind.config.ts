import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Macro accent hues, used across rings, chips and the mesh background.
        cal: "#f59e0b", // amber  — calories
        protein: "#f43f5e", // rose  — protein
        carb: "#38bdf8", // sky    — carbs
        fat: "#a78bfa", // violet — fat
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        glass:
          "0 8px 32px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255,255,255,0.35)",
        "glass-dark":
          "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pop": {
          "0%": { transform: "scale(0.96)" },
          "60%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-18px,0)" },
        },
      },
      animation: {
        "rise-in": "rise-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        pop: "pop 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        "float-slow": "float-slow 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
