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
      padding: "1.5rem",
      screens: { "2xl": "1240px" },
    },
    extend: {
      height: {
        "13": "3.25rem",
        "18": "4.5rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        /* ===== Cinematic cyber-ethnic festival palette (Grebeg Suro 2026) ===== */
        brand: {
          DEFAULT: "#1F6DFF", // Neon blue highlight
          50: "#EAF2FF",
          100: "#C9DCFF",
          200: "#9CC0FF",
          300: "#5E97FF",
          400: "#3B82FF",
          500: "#1F6DFF",
          600: "#1857D6",
          700: "#1442A8",
          800: "#0E2E73",
          900: "#081B44",
        },
        navy: "#050816", // Primary dark background
        cyan: "#12E0D3", // Cyan peacock accent
        purple: "#6B3CC9", // Purple glow
        culture: "#C21E2B", // Cultural red accent
        ink: "#F5F7FF", // Primary text (terang)
        body: "#C9D4FF", // Secondary text (terang)
        soft: "#081B44", // Surface / band gelap
        success: "#19C37D",
        warning: "#FFB020",
        error: "#FF4D67",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.5), 0 8px 24px -12px rgba(0,0,0,0.7)",
        card: "0 1px 2px rgba(0,0,0,0.5), 0 18px 44px -18px rgba(0,0,0,0.8), 0 0 0 1px rgba(31,109,255,0.06)",
        glow: "0 0 40px -6px rgba(31,109,255,0.6)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #1F6DFF 0%, #6B3CC9 100%)",
        "brand-gradient-vivid":
          "linear-gradient(135deg, #12E0D3 0%, #1F6DFF 55%, #6B3CC9 100%)",
        "hero-mesh":
          "radial-gradient(45% 60% at 12% 8%, rgba(18,224,211,0.18), transparent 60%), radial-gradient(45% 60% at 88% 0%, rgba(31,109,255,0.24), transparent 60%), radial-gradient(60% 70% at 50% 112%, rgba(107,60,201,0.22), transparent 60%)",
        "soft-radial":
          "radial-gradient(ellipse at top, rgba(31,109,255,0.18), transparent 60%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-brand": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(31,109,255,0.5)" },
          "50%": { boxShadow: "0 0 0 14px rgba(31,109,255,0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "pulse-brand": "pulse-brand 2s infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 14s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
