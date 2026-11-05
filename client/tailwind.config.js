/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#08080c',
        panel: '#0f0f16',
        panel2: '#14141d',
        line: '#22222e',
        ink: '#ececf4',
        dim: '#8b8ba3',
        accent: '#6366f1',
        accent2: '#22d3ee'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      boxShadow: {
        glow: '0 20px 60px -30px rgba(99,102,241,.65)'
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } }
      },
      animation: { float: 'float 6s ease-in-out infinite' }
    }
  },
  plugins: []
};
