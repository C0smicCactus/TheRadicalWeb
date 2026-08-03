<script>
	import '../app.css';

	(function fixGetterOnlyFetch() {
		try {
			const targets = [globalThis, typeof window !== 'undefined' ? window : null].filter(Boolean);
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

	let { children } = $props();
</script>

{@render children()}
