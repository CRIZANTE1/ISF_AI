/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // Detecta preferência do sistema automaticamente
  theme: {
    extend: {
      colors: {
        // Paleta Rally Colors
        rally: {
          green: {
            primary: '#1EB980',
            dark: '#045D56',
            translucent: 'rgba(30, 185, 128, 0.4)',
            darkTranslucent: 'rgba(4, 93, 86, 0.4)',
          },
          orange: {
            DEFAULT: '#FF6859',
            translucent: 'rgba(255, 104, 89, 0.4)',
          },
          yellow: {
            DEFAULT: '#FFCF44',
            translucent: 'rgba(255, 207, 68, 0.4)',
          },
          purple: {
            DEFAULT: '#B15DFF',
            translucent: 'rgba(177, 93, 255, 0.4)',
          },
          blue: {
            DEFAULT: '#72DEFF',
            translucent: 'rgba(114, 222, 255, 0.4)',
          },
        },
        // Paleta Apple (iOS/macOS) - mantida para compatibilidade
        apple: {
          bg: {
            light: '#F5F5F7',
            dark: '#1C1C1E',
          },
          surface: {
            light: '#FFFFFF',
            dark: '#2C2C2E',
          },
          text: {
            primary: {
              light: '#000000',
              dark: '#FFFFFF',
            },
            secondary: '#8E8E93',
          },
          accent: '#72DEFF', // Rally Blue
          success: '#1EB980', // Rally Green
          warning: '#FFCF44', // Rally Yellow
          error: '#FF6859', // Rally Orange
          border: 'rgba(0, 0, 0, 0.1)',
          borderDark: 'rgba(255, 255, 255, 0.1)',
        },
        // Manter compatibilidade com código existente
        gray: {
          system: '#8E8E93',
          system2: '#AEAEB2',
          system3: '#C7C7CC',
          system4: '#D1D1D6',
          system5: '#E5E5EA',
          system6: '#F5F5F7',
        },
        accent: {
          blue: '#72DEFF',
          cyan: '#72DEFF',
          purple: '#B15DFF',
          orange: '#FF6859',
          green: '#1EB980',
        },
        status: {
          success: '#1EB980',
          warning: '#FFCF44',
          error: '#FF6859',
          info: '#72DEFF',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'screen-title': ['28px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.5px' }],
        'section-title': ['20px', { lineHeight: '1.3', fontWeight: '500', letterSpacing: '-0.3px' }],
        'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'button': ['17px', { lineHeight: '1.4', fontWeight: '500' }],
        'caption': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        'ios-1': '4px',
        'ios-2': '8px',
        'ios-3': '12px',
        'ios-4': '16px',
        'ios-5': '20px',
        'ios-6': '24px',
        'ios-8': '32px',
        'ios-10': '40px',
        'ios-12': '48px',
        'screen': '16px',
        'card': '20px',
        'item': '16px',
      },
      borderRadius: {
        'ios-sm': '10px',
        'ios-md': '12px',
        'ios-lg': '16px',
        'ios-xl': '20px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'button': '12px',
      },
      boxShadow: {
        'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'apple-md': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'apple-lg': '0 8px 24px rgba(0, 0, 0, 0.1)',
        'apple-floating': '0 4px 20px rgba(114, 222, 255, 0.25)',
        'rally-green': '0 4px 12px rgba(30, 185, 128, 0.25)',
        'rally-orange': '0 4px 12px rgba(255, 104, 89, 0.25)',
        'rally-yellow': '0 4px 12px rgba(255, 207, 68, 0.25)',
        'rally-purple': '0 4px 12px rgba(177, 93, 255, 0.25)',
        'rally-blue': '0 4px 12px rgba(114, 222, 255, 0.25)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'card-lg': '0 8px 24px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'apple': '20px',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
