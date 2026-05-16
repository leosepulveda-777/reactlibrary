/** @type {import('tailwindcss').Config} */
// Extiende los colores y tipografia base de Tailwind para el sistema de biblioteca
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        bg:       '#0F1117',
        surface:  '#1A1D27',
        surface2: '#22263A',
        border:   '#2E3347',
        accent:   '#F5A623',
        accent2:  '#E8891A',
        muted:    '#7C8093',
      },
    },
  },
  plugins: [],
};
