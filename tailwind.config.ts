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
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        /* ===== Premium red & gold brand palette (selaras logo Grebeg Suro) ===== */
        brand: {
          DEFAULT: "#C1121F", // Merah utama
          50: "#FDF3F2",
          100: "#FBE4E2",
          200: "#F6C6C2",
          300: "#EC9C97",
          400: "#DC5C58",
          500: "#C1121F",
          600: "#9E1B22",
          700: "#7A0E16", // Maroon
          800: "#5C0A12",
          900: "#42060C",
        },
        navy: "#42060C", // maroon paling gelap (dipertahankan namanya)
        cyan: "#C9A227", // Emas (nilai diubah agar semua class cyan jadi emas)
        ink: "#0A1633", // Heading text (tetap gelap)
        body: "#5B4A4A", // Body text (hangat)
        soft: "#FCEAE7", // Soft section (merah muda hangat)
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
        soft: "0 1px 2px rgba(40,10,12,0.05), 0 8px 24px -12px rgba(40,10,12,0.16)",
        card: "0 1px 2px rgba(40,10,12,0.05), 0 12px 32px -16px rgba(122,14,22,0.20)",
        glow: "0 12px 36px -10px rgba(193,18,31,0.5)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #C1121F 0%, #9E1B22 52%, #7A0E16 100%)",
        "brand-gradient-vivid":
          "linear-gradient(135deg, #C9A227 0%, #C1121F 50%, #7A0E16 100%)",
        "hero-mesh":
          "radial-gradient(40% 55% at 12% 8%, rgba(201,162,39,0.18), transparent 60%), radial-gradient(45% 60% at 88% 0%, rgba(193,18,31,0.18), transparent 60%), radial-gradient(60% 70% at 50% 110%, rgba(122,14,22,0.12), transparent 60%)",
        "soft-radial":
          "radial-gradient(ellipse at top, rgba(193,18,31,0.10), transparent 60%)",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(193,18,31,0.45)" },
          "50%": { boxShadow: "0 0 0 14px rgba(193,18,31,0)" },
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
