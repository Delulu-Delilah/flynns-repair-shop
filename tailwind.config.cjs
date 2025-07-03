const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      borderRadius: {
        DEFAULT: "4px",
        secondary: "2px",
        container: "8px",
      },
      boxShadow: {
        DEFAULT: "0 0 10px rgba(0, 255, 255, 0.3)",
        hover: "0 0 20px rgba(0, 255, 255, 0.5)",
        glow: "0 0 30px rgba(0, 255, 255, 0.6)",
        "glow-orange": "0 0 20px rgba(255, 165, 0, 0.5)",
        "glow-green": "0 0 20px rgba(0, 255, 0, 0.5)",
        "glow-purple": "0 0 20px rgba(128, 0, 255, 0.5)",
      },
      colors: {
        // Tron Dark Theme
        'grid-dark': {
          50: '#1a1a1a',
          100: '#0f0f0f',
          200: '#0a0a0a',
          300: '#050505',
          400: '#000000',
        },
        // Tron Cyan (primary)
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#00d4ff', // Main Tron cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Tron Orange (accent)
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff6600', // Tron orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Electric Green
        electric: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#00ff41', // Electric green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Electric Purple
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#8000ff', // Electric purple
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        primary: {
          DEFAULT: "#00d4ff",
          hover: "#22d3ee",
          dark: "#0891b2",
        },
        secondary: {
          DEFAULT: "#ff6600",
          hover: "#fb923c",
          dark: "#ea580c",
        },
        accent: {
          DEFAULT: "#00ff41",
          hover: "#4ade80",
          dark: "#16a34a",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'border-glow': 'border-glow 3s ease-in-out infinite',
        'text-glow': 'text-glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-glow': {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(0, 212, 255, 0.5)' },
          '50%': { borderColor: 'rgba(0, 212, 255, 1)' },
        },
        'text-glow': {
          '0%': { textShadow: '0 0 5px rgba(0, 212, 255, 0.5)' },
          '100%': { textShadow: '0 0 10px rgba(0, 212, 255, 1)' },
        },
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ["hover", "active"],
    },
  },
  plugins: [],
}; 