/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          sidebar: '#0a192f',
          sidebarHover: '#132844',
          emerald: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            500: '#10b981',
            600: '#00a651',
            700: '#008c44',
          },
          border: '#e5e9f0',
          muted: '#64748b',
        }
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '"Segoe UI"', 'sans-serif'],
        mono: ['ui-monospace', '"Cascadia Mono"', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
