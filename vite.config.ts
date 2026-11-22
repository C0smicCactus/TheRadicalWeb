import process from 'node:process';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in Svelte 6.
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
      },
      adapter: adapter({
        fallback: '404.html'
      }),
      prerender: {
        entries: ['*', '/radical-data.json', '/radical-feed.xml']
      },
      paths: {
        // The live site is served from /TheRadicalWeb on GitHub Pages; local dev runs at the root.
        base: process.argv.includes('dev') ? '' : '/TheRadicalWeb'
      }
    })
  ],
  // Local only by default. Use `npm run dev:lan` to open the dev server to your network (e.g. to test on a phone).
  server: {
    port: 3000
  },
  preview: {
    port: 3000
  }
});
