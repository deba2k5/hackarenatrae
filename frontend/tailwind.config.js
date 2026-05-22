/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          dark: '#070B14',
          default: '#0B1020',
          light: '#111827',
        },
        cyber: {
          cyan: '#00E5FF',
          violet: '#8B5CF6',
          blue: '#38BDF8',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-gradient': 'linear-gradient(to right, #00E5FF, #8B5CF6)',
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00E5FF, 0 0 10px #00E5FF' },
          '100%': { boxShadow: '0 0 20px #8B5CF6, 0 0 30px #8B5CF6' },
        }
      }
    },
  },
  plugins: [],
}
