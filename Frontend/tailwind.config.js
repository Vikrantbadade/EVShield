/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Reference Warm Palette
        warm: {
          taupe: "#AD8B73",
          peach: "#CEAB93",
          sand: "#E3CAA5",
          cream: "#FFFBE9",
          "cream-soft": "#FFF8E8",
          white: "#FFFCF5",
          beige: "#F7EEDF",
          "sand-pale": "#F2E3CA",
          "peach-soft": "#EFD8C5",
          "peach-pale": "#F5E5D8",
          "taupe-soft": "#E8D8CC",
          "taupe-light": "#F2EAE4",
          gray: "#E8E3DD",
          // Dark text tones (NO pure black)
          text: "#3F3832",
          secondary: "#514940",
          muted: "#7A7067",
          subtle: "#A3978C",
        },
        // Cybersecurity Accent Colors
        cyber: {
          cyan: "#19BFA3",
          "cyan-soft": "#DDF7F1",
          blue: "#52A8FF",
          "blue-soft": "#E7F2FF",
          green: "#62C073",
          "green-soft": "#E8F7EC",
          amber: "#D99A32",
          "amber-soft": "#FFF2D6",
          red: "#E85C68",
          "red-soft": "#FCE7EA",
        },
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "system-ui", "sans-serif"],
        display: ["'Inter Display'", "Manrope", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Geist Mono'", "monospace"],
      },
      boxShadow: {
        glass: "0 20px 60px rgba(100,75,50,0.08), inset 0 1px 0 rgba(255,255,255,0.80)",
        "glass-hover": "0 28px 70px rgba(100,75,50,0.14), inset 0 1px 0 rgba(255,255,255,0.90)",
        "glass-sm": "0 8px 24px rgba(100,75,50,0.06), inset 0 1px 0 rgba(255,255,255,0.75)",
        "glow-taupe": "0 0 50px rgba(173,139,115,0.22)",
        "glow-peach": "0 0 50px rgba(206,171,147,0.25)",
        "glow-sand": "0 0 50px rgba(227,202,165,0.28)",
        "glow-cyan": "0 0 45px rgba(25,191,163,0.20)",
        "glow-red": "0 0 45px rgba(232,92,104,0.20)",
      },
      backdropBlur: {
        xs: "4px",
        "2xl": "32px",
        "3xl": "44px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
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
