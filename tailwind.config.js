/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        appBackground: '#0e0e0e',
        appSurface: '#131313',
        tileBackground: '#151515',
        borderSubtle: 'rgba(255,255,255,0.1)',
        highlightOverlay: 'rgba(255,255,255,0.05)',
        textMain: '#ffffff',
        textMuted: 'rgba(255,255,255,0.54)',
        textSubtle: 'rgba(255,255,255,0.38)'
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      }
    }
  },
  plugins: []
};
