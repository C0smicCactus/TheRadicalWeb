export const networkConfig = {
  imageProxy: 'https://images.weserv.nl/?url=',
  imageProxyParams: '&w=1200&fit=cover&output=webp',

  // Give up on a feed (or the proxy fallback) after this long, so one stuck site can't stall the build
  feedFetchTimeoutMs: 20000,
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

  wrapImageProxy(url: string): string {
    if (!url) return url;
    return `${this.imageProxy}${encodeURIComponent(url)}${this.imageProxyParams}`;
  }
};