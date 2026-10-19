/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0B0D", // near-black background
          900: "#111318",
          800: "#171A21", // charcoal surface
          700: "#20232C",
          600: "#2B2F3A",
        },
        marquee: {
          DEFAULT: "#E3A337", // signature accent: marquee-light gold
          bright: "#F4C56B",
          dim: "#B87F26",
        },
        mist: {
          DEFAULT: "#9AA0AC", // muted gray text
          light: "#C7CBD3",
        },
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "fade-bottom": "linear-gradient(to top, #0A0B0D 0%, rgba(10,11,13,0.7) 30%, rgba(10,11,13,0) 100%)",
        "fade-nav": "linear-gradient(to bottom, rgba(10,11,13,0.9) 0%, rgba(10,11,13,0) 100%)",
      },
      boxShadow: {
        card: "0 8px 24px -8px rgba(0,0,0,0.55)",
        glow: "0 0 0 1px rgba(227,163,55,0.35), 0 0 24px -4px rgba(227,163,55,0.35)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "pulse-ring": { "0%": { boxShadow: "0 0 0 0 rgba(227,163,55,0.45)" }, "100%": { boxShadow: "0 0 0 14px rgba(227,163,55,0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out both",
        "pulse-ring": "pulse-ring 1.4s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};
