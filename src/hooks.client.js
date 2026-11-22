/** @type {import('@sveltejs/kit/hooks').HandleClientError} */
export function handleError({ error }) {
  console.error('Client error caught:', error);
}