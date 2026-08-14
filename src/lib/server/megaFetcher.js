import { appFeeds } from '$lib/config/appFeeds.js';
import { feedParser } from '$lib/services/feedParser.js';
import { networkConfig } from '$lib/config/networkConfig.js';

let megaFeedPromise = null;

export function getMegaFeed() {
  if (!megaFeedPromise) {
    megaFeedPromise = buildFeed();
  }
  return megaFeedPromise;
}

async function buildFeed() {
  // Override network config to bypass CORS proxies since this runs on a Node server
  networkConfig.wrapCorsProxy = (url) => url; 

  const imageCache = new Map();
  try {
    // Check the live production site to remember images scraped in previous hourly builds
    const liveRes = await fetch('https://c0smiccactus.github.io/TheRadicalWeb/radical-data.json');
    if (liveRes.ok) {
      const oldData = await liveRes.json();
      for (const a of oldData) {
        if (a.link && a.thumbnail) imageCache.set(a.link, a.thumbnail);
      }
    }
  } catch(e) {
    // Ignore if the live site is unreachable or file doesn't exist yet
  }

  const sources = { ...appFeeds.coreSources, ...appFeeds.globalSources, ...appFeeds.extendedSources };
  const allArticles = [];

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
      const parsed = feedParser.parse(text, name, 25);
      allArticles.push(...parsed);
    }
  });

  await Promise.all(fetchPromises);

  // Deduplicate articles by link and sort by date descending
  const deduplicated = new Map();
  for (const a of allArticles) deduplicated.set(a.link.toLowerCase(), a);
  let finalArticles = Array.from(deduplicated.values()).sort((a, b) => b.parsedDate - a.parsedDate);

  // Resolve missing thumbnails using the memory cache, or scrape them directly
  const scrapePromises = finalArticles.map(async (article) => {
    if (!article.thumbnail) {
      if (imageCache.has(article.link)) {
        article.thumbnail = imageCache.get(article.link);
      } else {
        const scraped = await feedParser.scrapeUrlForImage(article.link).catch(() => '');
        if (scraped) article.thumbnail = networkConfig.wrapImageProxy(scraped);
      }
    }
  });
  
  await Promise.all(scrapePromises);
  return finalArticles;
}