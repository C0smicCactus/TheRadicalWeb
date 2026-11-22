import type { Handle } from '@sveltejs/kit/hooks';

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

export const handle: Handle = async ({ event, resolve }) => {
  return await resolve(event);
};
