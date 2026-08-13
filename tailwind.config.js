/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        appBackground: 'var(--bg-main)',
        appSurface: 'var(--bg-surface)',
        tileBackground: 'var(--bg-tile)',
        borderSubtle: 'var(--border-subtle)',
        highlightOverlay: 'var(--highlight)',
        textMain: 'var(--text-main)',
        textMuted: 'var(--text-muted)',
        textSubtle: 'var(--text-subtle)'
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      }
    }
  },
  plugins: []
};