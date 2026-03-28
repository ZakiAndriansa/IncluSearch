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
        // Brand palette
        forest: {
          DEFAULT: "rgb(25, 53, 12)",
          50: "rgb(240, 245, 237)",
          100: "rgb(210, 225, 200)",
          200: "rgb(160, 190, 140)",
          300: "rgb(110, 155, 80)",
          400: "rgb(70, 110, 40)",
          500: "rgb(25, 53, 12)",
          600: "rgb(20, 42, 10)",
          700: "rgb(15, 32, 7)",
          800: "rgb(10, 21, 5)",
          900: "rgb(5, 11, 2)",
        },
        olive: {
          DEFAULT: "rgb(104, 125, 49)",
          50: "rgb(243, 246, 234)",
          100: "rgb(220, 230, 185)",
          200: "rgb(185, 205, 125)",
          300: "rgb(150, 175, 80)",
          400: "rgb(125, 148, 60)",
          500: "rgb(104, 125, 49)",
          600: "rgb(82, 99, 39)",
          700: "rgb(62, 75, 29)",
          800: "rgb(41, 50, 20)",
          900: "rgb(21, 25, 10)",
        },
        sand: {
          DEFAULT: "rgb(213, 211, 204)",
          50: "rgb(252, 252, 251)",
          100: "rgb(245, 244, 242)",
          200: "rgb(235, 234, 230)",
          300: "rgb(225, 223, 218)",
          400: "rgb(213, 211, 204)",
          500: "rgb(190, 187, 178)",
          600: "rgb(155, 151, 140)",
          700: "rgb(120, 116, 105)",
          800: "rgb(85, 82, 73)",
          900: "rgb(50, 48, 42)",
        },
        teal: {
          dark: "rgb(64, 103, 104)",
          light: "rgb(111, 169, 187)",
          DEFAULT: "rgb(64, 103, 104)",
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
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
