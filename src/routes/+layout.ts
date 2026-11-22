// The app renders in the browser (ssr = false). Prerendering still writes an empty
// "shell" index.html at build time, so the home page is served with a 200 status
// instead of falling back to 404.html.
export const ssr = false;
export const prerender = true;