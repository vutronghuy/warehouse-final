/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false,
  },
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ghtk: '#00904a',
        'ghtk-light': '#069255',
      },
    },
  },
  plugins: [],
};
