/**
 * @file imageScraper.ts
 * @description Scrapes OpenGraph images from external web pages with shared deduplication caching.
 */

import { networkConfig } from '#lib/config/networkConfig.js';

// Cache so each article page is only fetched once per build
const imageScrapeCache = new Map<string, Promise<string>>();

/** Fetches an article page and returns its og:image URL, or '' if there isn't one. Used by the build. */
export async function scrapeUrlForImage(url: string): Promise<string> {
  if (!url) return "";

  // Deduplication: return existing promise if already scraping this URL
  const cached = imageScrapeCache.get(url);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    try {
      // The time limit covers both the response and reading the page
      const res = await fetch(url, { signal: AbortSignal.timeout(networkConfig.imageScrapeTimeoutMs) });

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

export function scrapeImage(html: string | null | undefined): string {
  if (!html) return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : '';
}