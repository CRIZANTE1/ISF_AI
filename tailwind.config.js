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
          orange: '#FF9500',
          blue: '#5AC8FA',
          purple: '#AF52DE',
        },
        status: {
          success: '#34C759',
          warning: '#FF9500',
          error: '#FF3B30',
          info: '#5AC8FA',
        },
        light: {
          background: '#FFFFFF',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          text: {
            primary: '#1D1D1F',
            secondary: '#86868B',
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
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
