export const networkConfig = {
  primaryCorsProxy: 'https://corsproxy.io/?',
  fallbackCorsProxy: 'https://api.allorigins.win/raw?url=',
  imageProxy: 'https://images.weserv.nl/?url=',
  imageProxyParams: '&w=1200&fit=cover&output=webp',
  useCorsProxies: true,

  feedFetchTimeoutMs: 10000,
  imageScrapeTimeoutMs: 4000,

  maxFeedFetchRetries: 2,
  retryDelayMs: 1000,

  maxCachedArticles: 100,
  offlineCacheKey: 'offline_cache',
  viewedStoriesKey: 'viewed_stories_v1',
  maxViewedStoryAgeHours: 48,

  articlesPerPage: 12,
  scrollThreshold: 400.0,

  wrapCorsProxy(url, useFallback = false) {
    if (!this.useCorsProxies) return url;
    const proxy = useFallback ? this.fallbackCorsProxy : this.primaryCorsProxy;
    return `${proxy}${encodeURIComponent(url)}`;
  },

  wrapImageProxy(url) {
    if (!url || !this.useCorsProxies) return url;
    return `${this.imageProxy}${encodeURIComponent(url)}${this.imageProxyParams}`;
  }
};
