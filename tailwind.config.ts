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

        /* ===== Premium blue brand palette ===== */
        brand: {
          DEFAULT: "#2184FF", // Primary Bright Blue
          50: "#F5F9FF",
          100: "#EAF2FF",
          200: "#D6E4FF",
          300: "#ADC8FF",
          400: "#5C95FF",
          500: "#2184FF",
          600: "#1A6AD1",
          700: "#00308F", // Secondary Navy
          800: "#00194F", // Primary Dark Navy
          900: "#001236",
        },
        navy: "#00194F",
        cyan: "#35D6FF", // Accent Cyan
        ink: "#0A1633", // Heading Text
        body: "#4B5B7A", // Body Text
        soft: "#EAF2FF", // Soft Section
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
        soft: "0 1px 2px rgba(10,22,51,0.04), 0 8px 24px -12px rgba(10,22,51,0.12)",
        card: "0 1px 2px rgba(10,22,51,0.04), 0 12px 32px -16px rgba(0,49,143,0.18)",
        glow: "0 12px 36px -10px rgba(33,132,255,0.5)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #2184FF 0%, #1A6AD1 52%, #00308F 100%)",
        "brand-gradient-vivid":
          "linear-gradient(135deg, #35D6FF 0%, #2184FF 45%, #00308F 100%)",
        "hero-mesh":
          "radial-gradient(40% 55% at 12% 8%, rgba(53,214,255,0.18), transparent 60%), radial-gradient(45% 60% at 88% 0%, rgba(33,132,255,0.20), transparent 60%), radial-gradient(60% 70% at 50% 110%, rgba(0,48,143,0.14), transparent 60%)",
        "soft-radial":
          "radial-gradient(ellipse at top, rgba(33,132,255,0.10), transparent 60%)",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(33,132,255,0.45)" },
          "50%": { boxShadow: "0 0 0 14px rgba(33,132,255,0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "pulse-brand": "pulse-brand 2s infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
