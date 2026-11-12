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
          sidebar: '#0b192c', // deep navy dark sidebar from screenshot
          sidebarHover: '#132844',
          emerald: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            500: '#10b981',
            600: '#00a651', // primary vibrant green matching the active pill
            700: '#008c44',
          },
          cyan: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            500: '#0284c7',
            600: '#0083c9', // cyan blue from Al Haditha Energy logo & senior bar
          },
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
