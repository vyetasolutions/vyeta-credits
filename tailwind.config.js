/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0A0C12",
          900: "#0E1117",
          850: "#11141C",
          800: "#161A24",
          700: "#1F2430",
          600: "#2B3140",
        },
        ink: {
          100: "#F5F6FA",
          300: "#C2C6D4",
          500: "#8A8FA3",
          700: "#5B6072",
        },
        mint: {
          400: "#21E6A1",
          500: "#0FD18C",
          600: "#0BB276",
        },
        violet: {
          400: "#8B7CFF",
          500: "#6E5BFF",
          600: "#5847E0",
        },
        flame: {
          400: "#FF6B5E",
          500: "#FF4D3D",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(33,230,161,0.35)",
        card: "0 10px 30px -12px rgba(0,0,0,0.55)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        riseIn: "riseIn 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
