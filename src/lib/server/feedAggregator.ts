/**
 * @file feedAggregator.ts
 * @description Centralised server-side RSS feed aggregation engine.
 * Fetches, parses, and normalises all RSS feeds on the backend (e.g. during hourly Github Actions)
 * to bypass client-side browser CORS restrictions and massively reduce the payload.
 */

import { feeds } from '#lib/config/feeds.js';
import { feedParser } from '#lib/services/feedParser.js';
import { networkConfig } from '#lib/config/networkConfig.js';
import type { Article, ArticleMap } from '#lib/models/Article.js';

let megaFeedPromise: Promise<Article[]> | null = null;

/**
 * Returns the aggregated feed, building it lazily on first call.
 * @returns Promise resolving to an array of Article objects.
 */
export function getMegaFeed(): Promise<Article[]> {
  if (!megaFeedPromise) {
    megaFeedPromise = buildFeed();
  }
  return megaFeedPromise;
}

async function buildFeed(): Promise<Article[]> {
  // Override network config to bypass CORS proxies since this runs on a Node server
  networkConfig.wrapCorsProxy = (url: string) => url;

  const imageCache = new Map<string, string>();
  try {
    // Check the live production site to remember images scraped in previous hourly builds
    const liveRes = await fetch('https://c0smiccactus.github.io/TheRadicalWeb/radical-data.json');
    if (liveRes.ok) {
      const oldData: Partial<ArticleMap>[] = await liveRes.json();
      for (const a of oldData) {
        if (a.link && a.thumbnail) imageCache.set(a.link, a.thumbnail);
      }
    }
  } catch(e) {
    // Ignore if the live site is unreachable or file doesn't exist yet
  }

  const sources = { ...feeds.coreSources, ...feeds.globalSources, ...feeds.extendedSources };
  const allArticles: Article[] = [];

  // Fetch all feeds simultaneously with an automatic proxy fallback
  const fetchPromises = Object.entries(sources).map(async ([url, name]) => {
    let text = '';
    let success = false;

    // Attempt 1: Direct Fetch (Often fails on sites with strict bot protection like Substack)
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      if (res.ok) {
        text = await res.text();
        success = true;
      }
    } catch(e) {}

    // Attempt 2: Fallback to an open proxy if the direct fetch is blocked
    if (!success) {
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        if (res.ok) {
          text = await res.text();
          success = true;
        }
      } catch(e) {
        console.error(`Failed to fetch ${name} via proxy fallback.`);
      }
    }

    if (success && text) {
      // The feedParser automatically falls back to Regex when DOMParser is unavailable in Node.js
      const parsed = feedParser.parse(text, name, url, 25);
      allArticles.push(...parsed);
    }
  });

  await Promise.all(fetchPromises);

  // Deduplicate articles by link and sort by date descending
  const deduplicated = new Map();
  for (const a of allArticles) deduplicated.set(a.link.toLowerCase(), a);
  let finalArticles = Array.from(deduplicated.values()).sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

  // Resolve missing thumbnails using the memory cache, or scrape them directly
  const scrapePromises = finalArticles.map(async (article) => {
    if (!article.thumbnail) {
      const cachedThumbnail = imageCache.get(article.link);
      if (cachedThumbnail !== undefined) {
        article.thumbnail = cachedThumbnail;
      } else {
        const scraped = await feedParser.scrapeUrlForImage(article.link).catch(() => '');
        if (scraped) article.thumbnail = networkConfig.wrapImageProxy(scraped);
      }
    }
  });

  await Promise.all(scrapePromises);
  return finalArticles;
}