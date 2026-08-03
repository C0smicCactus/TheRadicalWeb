(function fixGetterOnlyFetch() {
  try {
    const targets = [globalThis];
    for (const target of targets) {
      try {
        target.fetch = target.fetch;
      } catch (e) {
        let currentFetch = target.fetch;
        Object.defineProperty(target, 'fetch', {
          get() {
            return currentFetch;
          },
          set(val) {
            currentFetch = val;
          },
          configurable: true,
          enumerable: true
        });
      }
    }
  } catch (_) {}
})();

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  return await resolve(event);
}
