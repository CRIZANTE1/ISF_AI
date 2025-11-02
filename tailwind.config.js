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
          green: '#3ECF8E',
          dark: '#1E1E1E',
          darker: '#181818',
        },
        status: {
          success: '#3ECF8E',
          warning: '#F97316',
          error: '#F43F5E',
          info: '#0EA5E9',
        },
        light: {
          background: '#FAFAFA',
          surface: '#FFFFFF',
          text: {
            primary: '#1E1E1E',
            secondary: '#666666',
          },
          border: '#E5E5E5',
        },
        dark: {
          background: '#181818',
          surface: '#1E1E1E',
          text: {
            primary: '#EDEDED',
            secondary: '#A3A3A3',
          },
          border: '#2D2D2D',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        display: ['Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
