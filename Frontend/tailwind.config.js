/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cohesive Lighter Dark-Violet Master Palette
        midnight: {
          bg: "#11111F",
          secondary: "#17172A",
          card: "#1D1D35",
          elevated: "#252542",
          hover: "#303052",
          border: "rgba(196, 181, 253, 0.16)",
          "border-hover": "rgba(155, 123, 255, 0.48)",
        },
        violet: {
          DEFAULT: "#9B7BFF",
          strong: "#8055F6",
          soft: "#C4B5FD",
          hover: "#A78BFA",
          dark: "#6D28D9",
        },
        cyber: {
          cyan: "#4DD9F0",
          "cyan-soft": "#A5F3FC",
          blue: "#38BDF8",
          green: "#34D399",
          "green-soft": "#D1FAE5",
          amber: "#FBBF24",
          "amber-soft": "#FEF3C7",
          red: "#FB7185",
          "red-soft": "#FFE4E6",
        },
        // Semantic text tokens
        text: {
          primary: "#F5F3FF",
          secondary: "#C4C2D6",
          muted: "#9896B0",
        },
        // Backward compatibility mappings
        warm: {
          taupe: "#9B7BFF",
          peach: "#C4B5FD",
          sand: "#252542",
          cream: "#1D1D35",
          "cream-soft": "#252542",
          white: "#252542",
          beige: "#17172A",
          "sand-pale": "#303052",
          "peach-soft": "#303052",
          "peach-pale": "#252542",
          "taupe-soft": "#38385E",
          "taupe-light": "#303052",
          gray: "#252542",
          text: "#F5F3FF",
          secondary: "#C4C2D6",
          muted: "#9896B0",
          subtle: "#7E7C99",
        },
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "system-ui", "sans-serif"],
        display: ["'Inter Display'", "Manrope", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Geist Mono'", "monospace"],
      },
      boxShadow: {
        glass: "0 20px 60px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(196, 181, 253, 0.16)",
        "glass-hover": "0 28px 70px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(155, 123, 255, 0.35)",
        "glass-sm": "0 8px 24px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(196, 181, 253, 0.14)",
        "glow-violet": "0 0 50px rgba(155, 123, 255, 0.22)",
        "glow-cyan": "0 0 45px rgba(77, 217, 240, 0.22)",
        "glow-red": "0 0 45px rgba(251, 113, 133, 0.22)",
      },
      backdropBlur: {
        xs: "4px",
        "2xl": "32px",
        "3xl": "44px",
      },
      animation: {
        "float-slow": "float 14s ease-in-out infinite",
        "float-slower": "float 18s ease-in-out infinite reverse",
        "float-blob-1": "blob1 16s ease-in-out infinite alternate",
        "float-blob-2": "blob2 14s ease-in-out infinite alternate-reverse",
        "float-blob-3": "blob3 18s ease-in-out infinite alternate",
        "fade-up": "fadeUp 0.7s ease-out forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-in-down": "slideInDown 0.5s ease-out forwards",
        "slide-in-up": "slideInUp 0.6s ease-out forwards",
        "slide-in-right": "slideInRight 0.4s ease-out forwards",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        "spin-slow": "spin 22s linear infinite",
        "spin-slow-reverse": "spin 16s linear infinite reverse",
        "node-pulse": "nodePulse 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "50%": { transform: "translateY(-16px) scale(1.02)" },
        },
        blob1: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "100%": { transform: "translate(40px, -30px) scale(1.08)" },
        },
        blob2: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "100%": { transform: "translate(-35px, 25px) scale(1.05)" },
        },
        blob3: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "100%": { transform: "translate(30px, 35px) scale(1.06)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        nodePulse: {
          "0%, 100%": { opacity: "0.7", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
      },
    },
  },
  plugins: [],
};
