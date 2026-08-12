/** @type {import('@sveltejs/kit').HandleClientError} */
export function handleError({ error }) {
  console.error('Client error caught:', error);
}