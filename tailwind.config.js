/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: '#00cc66',
          dark:    '#00a854',
          light:   '#dcfce7',
          muted:   '#f0fdf4',
        },
        dark: {
          DEFAULT: '#0a0a14',
          card:    '#111118',
          2:       '#1a1a24',
        },
        card: '#f8f9fa',
        border: '#e8e8ec',
        muted: {
          DEFAULT: '#8a8a9a',
          light:   '#f4f4f7',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      borderRadius: {
        'xl':     '12px',
        '2xl':    '16px',
        '3xl':    '20px',
        'bento':  '24px',
        'full':   '9999px',
      },
      boxShadow: {
        'soft':    '0 2px 12px rgba(0,0,0,0.06)',
        'soft-lg': '0 4px 24px rgba(0,0,0,0.08)',
        'green':   '0 4px 20px rgba(0,204,102,0.3)',
        'dark':    '0 4px 24px rgba(0,0,0,0.2)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
