/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mocha: '#3B2A26',
        orange: '#E76F2F',
        cream: '#F2E8DA',
        caramel: '#C98B4A',
        gold: '#D7A45A',
      },
      fontFamily: {
        headline: ['"League Spartan"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
