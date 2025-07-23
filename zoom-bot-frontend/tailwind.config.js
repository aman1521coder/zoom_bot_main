/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./public/index.html",
    "./src/**/*.css"   // add this line to include CSS files

  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
