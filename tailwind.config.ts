import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Refined brand palette — softer, more accessible
        forest: {
          DEFAULT: "rgb(30, 70, 32)",
          50: "rgb(243, 248, 243)",
          100: "rgb(220, 237, 221)",
          200: "rgb(180, 212, 182)",
          300: "rgb(130, 180, 133)",
          400: "rgb(75, 140, 78)",
          500: "rgb(30, 70, 32)",
          600: "rgb(24, 58, 26)",
          700: "rgb(18, 45, 20)",
          800: "rgb(12, 32, 14)",
          900: "rgb(6, 18, 7)",
        },
        olive: {
          DEFAULT: "rgb(104, 132, 52)",
          50: "rgb(245, 248, 238)",
          100: "rgb(228, 236, 205)",
          200: "rgb(200, 216, 150)",
          300: "rgb(160, 186, 100)",
          400: "rgb(130, 158, 72)",
          500: "rgb(104, 132, 52)",
          600: "rgb(82, 105, 41)",
          700: "rgb(62, 79, 31)",
          800: "rgb(41, 52, 20)",
          900: "rgb(21, 26, 10)",
        },
        sand: {
          DEFAULT: "rgb(215, 213, 207)",
          50: "rgb(250, 250, 248)",
          100: "rgb(244, 243, 240)",
          200: "rgb(234, 232, 228)",
          300: "rgb(224, 222, 216)",
          400: "rgb(200, 197, 189)",
          500: "rgb(168, 165, 156)",
          600: "rgb(136, 132, 122)",
          700: "rgb(104, 100, 92)",
          800: "rgb(72, 69, 63)",
          900: "rgb(44, 42, 38)",
        },
        teal: {
          dark: "rgb(52, 108, 112)",
          light: "rgb(120, 180, 196)",
          DEFAULT: "rgb(52, 108, 112)",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        // AOS-like scroll animations
        "aos-fade-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "aos-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "aos-scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "aos-slide-right": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "fade-in": "fade-in 0.25s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "aos-fade-up": "aos-fade-up 0.5s ease-out both",
        "aos-fade-in": "aos-fade-in 0.4s ease-out both",
        "aos-scale-in": "aos-scale-in 0.4s ease-out both",
        "aos-slide-right": "aos-slide-right 0.4s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
