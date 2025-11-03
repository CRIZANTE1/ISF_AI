/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fundo principal escuro
        dark: {
          primary: '#121212',
          secondary: '#0E0E0E',
          surface: '#1A1A1A',
          inactive: '#2A2A2A',
        },
        // Texto
        text: {
          primary: '#FFFFFF',
          secondary: '#B0B0B0',
          muted: '#9E9E9E',
        },
        // Acentos
        accent: {
          cyan: '#00C8FF',
          purple: '#8A3FFC',
          orange: '#FFA800',
          green: '#00D97E',
        },
        // Status
        status: {
          success: '#00D97E',
          warning: '#FFA800',
          error: '#FF3B30',
          info: '#00C8FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Poppins', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'screen-title': ['28px', { lineHeight: '1.2', fontWeight: '600' }],
        'section-title': ['20px', { lineHeight: '1.3', fontWeight: '500' }],
        'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'button': ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        'caption': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        'screen': '16px',
        'card': '20px',
        'item': '16px',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        'button': '12px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'card-lg': '0 4px 16px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
