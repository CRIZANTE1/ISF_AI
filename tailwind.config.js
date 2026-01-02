/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['media', "class"], // Detecta preferência do sistema automaticamente
  theme: {
  	extend: {
  		colors: {
  			fitness: {
  				move: '#FC3D39',
  				exercise: '#53D769',
  				stand: '#FFFFFF',
  				moveTranslucent: 'rgba(252, 61, 57, 0.4)',
  				exerciseTranslucent: 'rgba(83, 215, 105, 0.4)',
  				standTranslucent: 'rgba(255, 255, 255, 0.4)'
  			},
  			apple: {
  				bg: {
  					light: '#F5F5F7',
  					dark: '#000000'
  				},
  				surface: {
  					light: '#FFFFFF',
  					dark: 'rgba(28, 28, 30, 0.8)'
  				},
  				text: {
  					primary: {
  						light: '#000000',
  						dark: '#FFFFFF'
  					},
  					secondary: '#8E8E93'
  				},
  				accent: '#FFFFFF',
  				success: '#53D769',
  				warning: '#FC3D39',
  				error: '#FC3D39',
  				border: 'rgba(0, 0, 0, 0.1)',
  				borderDark: 'rgba(255, 255, 255, 0.1)'
  			},
  			gray: {
  				system: '#8E8E93',
  				system2: '#AEAEB2',
  				system3: '#C7C7CC',
  				system4: '#D1D1D6',
  				system5: '#E5E5EA',
  				system6: '#F5F5F7'
  			},
  			accent: {
  				blue: '#FFFFFF',
  				cyan: '#FFFFFF',
  				purple: '#B15DFF',
  				orange: '#FC3D39',
  				green: '#53D769',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			status: {
  				success: '#53D769',
  				warning: '#FC3D39',
  				error: '#FC3D39',
  				info: '#FFFFFF'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'SF Pro Display',
  				'SF Pro Text',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'sans-serif'
  			],
  			display: [
  				'Inter',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'SF Pro Display',
  				'Segoe UI',
  				'Roboto',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			'screen-title': [
  				'28px',
  				{
  					lineHeight: '1.2',
  					fontWeight: '600',
  					letterSpacing: '-0.5px'
  				}
  			],
  			'section-title': [
  				'20px',
  				{
  					lineHeight: '1.3',
  					fontWeight: '500',
  					letterSpacing: '-0.3px'
  				}
  			],
  			body: [
  				'16px',
  				{
  					lineHeight: '1.5',
  					fontWeight: '400'
  				}
  			],
  			button: [
  				'17px',
  				{
  					lineHeight: '1.4',
  					fontWeight: '500'
  				}
  			],
  			caption: [
  				'14px',
  				{
  					lineHeight: '1.4',
  					fontWeight: '400'
  				}
  			]
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
  			screen: '16px',
  			card: '20px',
  			item: '16px'
  		},
  		borderRadius: {
  			'ios-sm': '10px',
  			'ios-md': '12px',
  			'ios-lg': '16px',
  			'ios-xl': '20px',
  			fitness: '24px',
  			xl: '20px',
  			'2xl': '24px',
  			'3xl': '32px',
  			button: '24px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
  			'apple-md': '0 4px 12px rgba(0, 0, 0, 0.3)',
  			'apple-lg': '0 8px 24px rgba(0, 0, 0, 0.4)',
  			'apple-floating': '0 4px 20px rgba(255, 255, 255, 0.3)',
  			'fitness-move': '0 4px 12px rgba(252, 61, 57, 0.3)',
  			'fitness-exercise': '0 4px 12px rgba(83, 215, 105, 0.3)',
  			'fitness-stand': '0 4px 12px rgba(255, 255, 255, 0.3)',
  			card: '0 2px 8px rgba(0, 0, 0, 0.3)',
  			'card-lg': '0 4px 16px rgba(0, 0, 0, 0.4)'
  		},
  		backdropBlur: {
  			apple: '20px'
  		},
  		transitionTimingFunction: {
  			apple: 'cubic-bezier(0.4, 0, 0.2, 1)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
