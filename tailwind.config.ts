import type { Config } from "tailwindcss";

// Paleta de PetMatch: cálida y optimista.
// - crema:        fondo principal, papel cálido en lugar de gris frío
// - tinta:        textos y bordes (un azul-ciruela muy oscuro, no negro puro)
// - perdida:      coral — urgencia amable para mascotas perdidas
// - encontrada:   menta — calma y esperanza para hallazgos
// - reencontrada: lavanda — celebración de los finales felices (HU-12)
// - sol:          acentos de alegría (destacados, estrellas, ilustraciones)
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        crema: {
          50: "#FFFBF5",
          100: "#FFF4E6",
          200: "#FDE6CC",
          300: "#F9D3A8",
        },
        tinta: {
          50: "#F8F7FB",
          100: "#F1EFF6",
          200: "#E4E1EC",
          300: "#C9C4D8",
          400: "#968FAB",
          500: "#6B6485",
          600: "#4F4867",
          700: "#3A344F",
          800: "#2A253B",
          900: "#1C1829",
        },
        perdida: {
          50: "#FFF4F0",
          100: "#FFE4DA",
          200: "#FFC6B3",
          300: "#FFA48A",
          400: "#FF8663",
          500: "#FF6B45",
          600: "#EB5029",
          700: "#C43C1B",
          800: "#9C3219",
        },
        encontrada: {
          50: "#ECFCF6",
          100: "#D0F7E8",
          200: "#A3EDD4",
          300: "#6CDDBA",
          400: "#35C89D",
          500: "#14AD84",
          600: "#0A8C6B",
          700: "#0A7058",
          800: "#0C5947",
        },
        reencontrada: {
          50: "#F5F2FF",
          100: "#EAE4FF",
          200: "#D6CBFF",
          300: "#B8A5FF",
          400: "#9A7FFF",
          500: "#7D5CF6",
          600: "#6841E3",
          700: "#5532BD",
          800: "#46299A",
        },
        sol: {
          100: "#FFF3CC",
          200: "#FFE699",
          300: "#FFD45C",
          400: "#FFC22E",
          500: "#F2A60C",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-bricolage)", "var(--font-jakarta)", "sans-serif"],
      },
      boxShadow: {
        suave: "0 1px 2px rgba(28, 24, 41, 0.04), 0 4px 16px -4px rgba(28, 24, 41, 0.08)",
        elevada: "0 2px 4px rgba(28, 24, 41, 0.04), 0 16px 40px -12px rgba(28, 24, 41, 0.18)",
        brillo: "0 10px 30px -10px rgba(255, 107, 69, 0.55)",
        "brillo-menta": "0 10px 30px -10px rgba(20, 173, 132, 0.55)",
        "brillo-lavanda": "0 10px 30px -10px rgba(125, 92, 246, 0.55)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        aparecer: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        flotar: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--giro, 0deg))" },
          "50%": { transform: "translateY(-10px) rotate(var(--giro, 0deg))" },
        },
        campana: {
          "0%, 100%": { transform: "rotate(0)" },
          "15%, 45%": { transform: "rotate(14deg)" },
          "30%, 60%": { transform: "rotate(-14deg)" },
          "75%": { transform: "rotate(0)" },
        },
        latido: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
        // Solo opacidad: no crea un contexto de posicionamiento, así que no
        // afecta a elementos sticky o fixed dentro de la página.
        "aparecer-suave": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        temblar: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        brillo: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        deriva: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(24px, -18px) scale(1.08)" },
        },
        "marca-ok": {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "70%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        aparecer: "aparecer 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        flotar: "flotar 6s ease-in-out infinite",
        latido: "latido 2.4s ease-in-out infinite",
        "aparecer-suave": "aparecer-suave 0.35s ease-out both",
        temblar: "temblar 0.4s ease-in-out",
        brillo: "brillo 1.6s linear infinite",
        deriva: "deriva 14s ease-in-out infinite",
        "marca-ok": "marca-ok 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
