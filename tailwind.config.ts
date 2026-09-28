import type { Config } from "tailwindcss";

// Design tokens for the Study Empire design system (spec section 30 / 56).
// Dark-first, Spotify-inspired: deep neutral backgrounds, one bold accent,
// large rounded cards, strong type hierarchy. No copyrighted assets/marks.
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0a0a0d",
          900: "#111114",
          800: "#18181c",
          700: "#212126",
          600: "#2c2c33",
          500: "#3d3d46",
        },
        accent: {
          DEFAULT: "#22e07a",
          muted: "#1a9a58",
          soft: "#173423",
        },
        empire: {
          gold: "#f2b13d",
          danger: "#e0523a",
          info: "#3d9be0",
        },
        text: {
          primary: "#f5f5f7",
          secondary: "#a6a6ae",
          muted: "#6c6c76",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(34,224,122,0.25), 0 0 24px rgba(34,224,122,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
