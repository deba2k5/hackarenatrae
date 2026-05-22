/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        background: {
          dark: '#0f172a',
          default: '#f8fafc',
          light: '#ffffff',
          card: '#ffffff',
          'card-dark': '#1e293b'
        },
        cyber: {
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          blue: '#3b82f6',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-gradient': 'linear-gradient(to right, #06b6d4, #8b5cf6)',
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #06b6d4, 0 0 10px #06b6d4' },
          '100%': { boxShadow: '0 0 20px #8b5cf6, 0 0 30px #8b5cf6' },
        }
      }
    },
  },
  plugins: [],
}
