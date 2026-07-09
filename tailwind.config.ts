import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal:       '#009BB4',
          'teal-mid': '#0AB9D5',
          'teal-pale': '#72D6E5',
          navy:       '#001A21',
          'navy-2':   '#003E47',
        },
        status: {
          awaiting:  '#B7791F',
          partial:   '#0AB9D5',
          paid:      '#2F8F5B',
          returned:  '#6B7280',
          exception: '#DE1D1C',
        },
      },
      fontFamily: {
        sans: ['Lato', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up':  'fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'count-up': 'count-up 0.4s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
}

export default config
