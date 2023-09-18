const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './renderer/pages/**/*.{js,ts,jsx,tsx}',
    './renderer/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      spacing: {
        '108': '32rem',
      },
      minHeight: {
        '1/2': '50%',
      }
    },
  },
  plugins: [],
}