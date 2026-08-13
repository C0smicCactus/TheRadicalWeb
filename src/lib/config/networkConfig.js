export const networkConfig = {
  // Multiple CORS proxy fallbacks (ordered by reliability)
  corsProxies: [
    { name: 'corsproxy-io', url: 'https://corsproxy.io/?', type: 'query' },
    { name: 'allorigins', url: 'https://api.allorigins.win/raw?url=', type: 'query' },
    { name: 'codestatus', url: 'https://api.codestatus.dev/proxy?url=', type: 'query' },
    { name: 'huleyun', url: 'https://api.huleyun.com/proxy?url=', type: 'query' },
  ],
  imageProxy: 'https://images.weserv.nl/?url=',
  imageProxyParams: '&w=1200&fit=cover&output=webp',
  useCorsProxies: true,

  feedFetchTimeoutMs: 5000,
  imageScrapeTimeoutMs: 4000,

  maxFeedFetchRetries: 2,
  retryDelayMs: 1000,

  // Limit articles per feed to speed up initial loading
  maxArticlesPerFeed: 15,

  maxCachedArticles: 100,
  offlineCacheKey: 'offline_cache',
  viewedStoriesKey: 'viewed_stories_v1',
  maxViewedStoryAgeHours: 48,

  articlesPerPage: 12,
  scrollThreshold: 400.0,

  // Global fetch timeout - max time to wait for ALL feeds
  globalFetchTimeoutMs: 15000,

  // Max total proxy attempts per feed (proxies × retry attempts)
  maxProxyAttemptsPerFeed: 3,

  wrapCorsProxy(url, proxyIndex = 0) {
    if (!this.useCorsProxies) return url;
    if (proxyIndex >= this.corsProxies.length) proxyIndex = 0;
    const proxy = this.corsProxies[proxyIndex];
    return `${proxy.url}${encodeURIComponent(url)}`;
  },

  getProxyName(proxyIndex = 0) {
    if (proxyIndex >= this.corsProxies.length) proxyIndex = 0;
    return this.corsProxies[proxyIndex].name;
  },

  wrapImageProxy(url) {
    if (!url || !this.useCorsProxies) return url;
    return `${this.imageProxy}${encodeURIComponent(url)}${this.imageProxyParams}`;
  }
};