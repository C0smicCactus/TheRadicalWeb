/**
 * @file imageScraper.ts
 * @description Scrapes OpenGraph images from external web pages with shared deduplication caching.
 */

import { networkConfig } from '#lib/config/networkConfig.js';

// Shared image scraping cache to deduplicate requests across all components
const imageScrapeCache = new Map<string, Promise<string>>();

export async function scrapeUrlForImage(url: string, signal?: AbortSignal): Promise<string> {
  if (!url) return "";

  // Deduplication: return existing promise if already scraping this URL
  const cached = imageScrapeCache.get(url);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    try {
      const finalUrl = networkConfig.wrapCorsProxy(url);
      const controller = new AbortController();
      // Use provided signal or create internal one
      const abortSignal = signal || controller.signal;
      const timeoutId = setTimeout(() => controller.abort(), networkConfig.imageScrapeTimeoutMs);

      // Listen for external abort (e.g., component unmount)
      if (signal) {
        signal.addEventListener('abort', () => controller.abort());
      }

      const res = await fetch(finalUrl, { signal: abortSignal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const ogMatch = text.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                        text.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        const result = ogMatch ? ogMatch[1] : "";
        // Cache the result (not the promise) for future requests
        imageScrapeCache.set(url, Promise.resolve(result));
        return result;
      }
    } catch (e) {
      // On error, remove from cache so future requests can retry
      imageScrapeCache.delete(url);
      // Ignored
    }
    return "";
  })();

  imageScrapeCache.set(url, promise);
  return promise;
}

// Clear a URL from the scrape cache (useful for cleanup or manual refresh)
export function clearImageScrapeCache(url?: string): void {
  if (url) {
    imageScrapeCache.delete(url);
  } else {
    imageScrapeCache.clear();
  }
}

export function scrapeImage(html: string | null | undefined): string {
  if (!html) return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : '';
}