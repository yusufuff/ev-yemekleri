/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream:          '#FAF6EF',
        warm:           '#F5EDD8',
        orange:         '#E8622A',
        'orange-light': '#F28B5E',
        brown:          '#4A2C0E',
        'brown-mid':    '#7A4A20',
        green:          '#3D6B47',
        'green-light':  '#6BA37A',
        gray:           '#8A7B6B',
        'gray-light':   '#E8E0D4',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}