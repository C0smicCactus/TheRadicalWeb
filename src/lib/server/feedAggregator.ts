/**
 * @file feedAggregator.ts
 * @description Centralised server-side RSS feed aggregation engine.
 * Fetches, parses, and normalises all RSS feeds on the backend (e.g. during hourly Github Actions)
 * to bypass client-side browser CORS restrictions and massively reduce the payload.
 */

import { feeds } from '#lib/config/feeds.js';
import { feedParser } from '#lib/services/feedParser.js';
import { scrapeUrlForImage } from '#lib/services/imageScraper.js';
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
  const imageCache = new Map<string, string>();
  /** Article link -> date it had in the previous build (used to tame future dates) */
  const previousDates = new Map<string, string>();
  try {
    // Check the live production site to remember images scraped and dates seen in previous builds
    const liveRes = await fetch('https://c0smiccactus.github.io/TheRadicalWeb/radical-data.json', {
      signal: AbortSignal.timeout(networkConfig.feedFetchTimeoutMs)
    });
    if (liveRes.ok) {
      const oldData: Partial<ArticleMap>[] = await liveRes.json();
      for (const a of oldData) {
        if (a.link && a.thumbnail) imageCache.set(a.link, a.thumbnail);
        if (a.link && a.parsedDate) previousDates.set(a.link, a.parsedDate);
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
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(networkConfig.feedFetchTimeoutMs)
      });
      if (res.ok) {
        text = await res.text();
        success = true;
      }
    } catch(e) {}

    // Attempt 2: Fallback to an open proxy if the direct fetch is blocked
    if (!success) {
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(networkConfig.feedFetchTimeoutMs)
        });
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

  // Deduplicate articles by link
  const deduplicated = new Map<string, Article>();
  for (const a of allArticles) deduplicated.set(a.link.toLowerCase(), a);
  const uniqueArticles = Array.from(deduplicated.values());

  // Some feeds give dates in the future (for example an event date), which would pin an article to the top.
  // Treat a future date as the time the article was first seen: keep the date from the previous build if it
  // had one, otherwise use now. Later builds then reuse that date, so the article ages normally.
  const now = new Date();
  for (const article of uniqueArticles) {
    if (article.parsedDate.getTime() > now.getTime()) {
      const previous = previousDates.get(article.link);
      const previousDate = previous ? new Date(previous) : null;
      article.parsedDate = previousDate && previousDate.getTime() <= now.getTime() ? previousDate : now;
    }
  }

  // Newest first
  const finalArticles = uniqueArticles.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

  // Resolve missing thumbnails using the memory cache, or scrape them directly
  const scrapePromises = finalArticles.map(async (article) => {
    if (!article.thumbnail) {
      const cachedThumbnail = imageCache.get(article.link);
      if (cachedThumbnail !== undefined) {
        article.thumbnail = cachedThumbnail;
      } else {
        const scraped = await scrapeUrlForImage(article.link).catch(() => '');
        if (scraped) article.thumbnail = networkConfig.wrapImageProxy(scraped);
      }
    }
  });

  await Promise.all(scrapePromises);
  return finalArticles;
}