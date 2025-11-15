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
        // Paleta Apple Fitness
        fitness: {
          move: '#FC3D39',           // Vermelho - Move
          exercise: '#53D769',       // Verde - Exercise
          stand: '#FFFFFF',          // Branco (substituído do azul)
          moveTranslucent: 'rgba(252, 61, 57, 0.4)',
          exerciseTranslucent: 'rgba(83, 215, 105, 0.4)',
          standTranslucent: 'rgba(255, 255, 255, 0.4)',
        },
        // Paleta Apple (iOS/macOS) - mantida para compatibilidade
        apple: {
          bg: {
            light: '#F5F5F7',
            dark: '#000000',          // Preto absoluto (Apple Fitness)
          },
          surface: {
            light: '#FFFFFF',
            dark: 'rgba(28, 28, 30, 0.8)',
          },
          text: {
            primary: {
              light: '#000000',
              dark: '#FFFFFF',
            },
            secondary: '#8E8E93',
          },
          accent: '#FFFFFF',          // Branco (substituído do azul)
          success: '#53D769',         // Fitness Exercise
          warning: '#FC3D39',         // Fitness Move
          error: '#FC3D39',           // Fitness Move
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
          blue: '#FFFFFF',           // Branco (substituído do azul)
          cyan: '#FFFFFF',           // Branco (substituído do azul)
          purple: '#B15DFF',
          orange: '#FC3D39',
          green: '#53D769',
        },
        status: {
          success: '#53D769',
          warning: '#FC3D39',
          error: '#FC3D39',
          info: '#FFFFFF',            // Branco (substituído do azul)
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
        'fitness': '24px',           // Apple Fitness card radius
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'button': '24px',            // Apple Fitness button radius
      },
      boxShadow: {
        'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'apple-md': '0 4px 12px rgba(0, 0, 0, 0.3)',
        'apple-lg': '0 8px 24px rgba(0, 0, 0, 0.4)',
        'apple-floating': '0 4px 20px rgba(255, 255, 255, 0.3)',
        'fitness-move': '0 4px 12px rgba(252, 61, 57, 0.3)',
        'fitness-exercise': '0 4px 12px rgba(83, 215, 105, 0.3)',
        'fitness-stand': '0 4px 12px rgba(255, 255, 255, 0.3)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'card-lg': '0 4px 16px rgba(0, 0, 0, 0.4)',
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
