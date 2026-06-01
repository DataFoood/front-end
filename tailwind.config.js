/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
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
        'dark-bg': '#0D0D0D',
        'dark-panel': '#1A1A1A',
      },
    },
  },
  plugins: [],
}
