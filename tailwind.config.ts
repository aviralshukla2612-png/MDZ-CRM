import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Remap indigo to luxury gold tones for universal theme coherence
        indigo: {
          50: "#FDFBF7",
          100: "#F9F3E5",
          200: "#F3E5C8",
          300: "#E8D29B",
          400: "#DFBE6F",
          500: "#D4AF37",
          600: "#C5A059",
          700: "#A38038",
          800: "#7E6128",
          900: "#5A431A",
          950: "#2F220B",
        },
        gold: {
          50: "#FDFBF7",
          100: "#F9F3E5",
          200: "#F3E5C8",
          300: "#E8D29B",
          400: "#DFBE6F",
          500: "#D4AF37",
          600: "#C5A059",
          700: "#A38038",
          800: "#7E6128",
          900: "#5A431A",
          DEFAULT: "#D4AF37",
          hover: "#B38F2A",
        },
        mdz: {
          50: "#fdfbf7",
          100: "#f9f3e5",
          200: "#f3e5c8",
          300: "#e8d29b",
          400: "#dfbe6f",
          500: "#d4af37",
          600: "#c5a059",
          700: "#a38038",
          800: "#7e6128",
          900: "#5a431a",
          gold: "#d4af37",
          goldHover: "#b89628",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 25px rgba(212, 175, 55, 0.35)",
        card: "0 4px 20px -2px rgba(197, 160, 89, 0.15)",
        gold: "0 4px 14px 0 rgba(212, 175, 55, 0.39)",
      },
    },
  },
  plugins: [],
};
export default config;
