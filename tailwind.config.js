/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#F5F0E8',
        'cream-dark': '#EDE8DE',
        rust: '#C0603A',
        'rust-dark': '#A84E2A',
        'rust-soft': '#e3a086',
        ink: '#111111',
        'dark-bg': '#0D0D0D',
        'dark-panel': '#1A1A1A',
        line: '#e8e4dc',
        muted: '#777777',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseDot: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease both',
        'pulse-dot': 'pulseDot 1.2s ease infinite',
      },
    },
  },
  plugins: [],
}
