/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1a1d29',
        'bg-secondary': 'rgba(26, 29, 41, 0.8)',
        'bg-card': 'rgba(40, 44, 60, 0.6)',
        'text-primary': '#e0e0e0',
        'text-secondary': '#a0a0a0',
        'accent-blue': '#4a9eff',
        'accent-green': '#6dd47e',
        'border': 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
}
