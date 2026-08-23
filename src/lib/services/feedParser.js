/**
 * @file feedParser.js
 * @description Main orchestrator for parsing RSS/Atom feed XML into Article objects.
 * Supports both DOMParser (browser) and Regex fallback (Node.js/server) parsing strategies.
 */

import { Article } from '$lib/models/Article.js';
import { feeds } from '$lib/config/feeds.js';
import { networkConfig } from '$lib/config/networkConfig.js';
import { feedFilterRules } from '$lib/utils/feedFilterRules.js';
import { getRegisteredHosts, parseDate, cleanHtml } from './feedParser.utils.js';
import { calculateTags } from './tagCalculator.js';
import { extractAuthor } from './authorExtractor.js';
import { scrapeUrlForImage, scrapeImage, clearImageScrapeCache } from './imageScraper.js';
import { feedOverrides } from './feedOverrides.js';

/**
 * Processes extracted feed item data into a clean Article instance.
 * Handles URL resolution, source-specific overrides, tag calculation, and filtering.
 *
 * @param {object} payload - The extraction payload containing all item fields.
 * @param {string} payload.titleStr - The raw title string.
 * @param {string} payload.linkStr - The raw link/URL string.
 * @param {string} payload.sourceName - The name of the feed source.
 * @param {string} payload.feedUrl - The base URL of the feed for relative URL resolution.
 * @param {object} payload.registeredHosts - Map of known hosts for deduplication.
 * @param {number} payload.maxArticles - Maximum number of articles to collect.
 * @param {Array} payload.results - The results array to push articles into.
 * @param {string} payload.pubDateStr - The publication date string.
 * @param {string} payload.summaryStr - The summary/description text.
 * @param {string} payload.descStr - The description tag text.
 * @param {string} payload.contentEncodedStr - The encoded content text.
 * @param {string} payload.authorTagContent - The author tag text content.
 */
function processExtractedItem({ 
  titleStr, linkStr, sourceName, feedUrl, registeredHosts, 
  maxArticles, results, pubDateStr, summaryStr, descStr, 
  contentEncodedStr, authorTagContent 
}) {
  let title = cleanHtml(titleStr || 'Untitled');
  let link = (linkStr || '').trim();

  // Convert relative URLs to absolute URLs using the feed URL as the base
  if (link && !link.match(/^https?:\/\//i) && feedUrl) {
    try {
      link = new URL(link, feedUrl).href;
    } catch (e) {
      // Keep original if URL construction fails
    }
  }

  if (Object.values(feeds.globalSources).includes(sourceName)) {
    const isRelevant = feeds.auKeywords.some(k => {
      const pattern = new RegExp(`\\b${k.toLowerCase()}\\b`, 'i');
      return pattern.test(title.toLowerCase());
    });
    if (!isRelevant) return false;
  }

  let bestDesc = summaryStr?.trim().length > 0 ? summaryStr : descStr;
  if (!bestDesc && contentEncodedStr) bestDesc = contentEncodedStr;
  const searchContent = `${summaryStr || ''} ${descStr || ''} ${contentEncodedStr || ''}`;

  let author = extractAuthor(authorTagContent, title, searchContent, sourceName);
  let articleSourceName = sourceName;

  // SPECIAL RULE: LABOURSTART
  if (sourceName === "LABOURSTART") {
    const lsOverride = feedOverrides.processLabourStart(title, link, registeredHosts);
    if (lsOverride.skip) return false;
    title = lsOverride.title;
  }

  // SPECIAL RULE: DISPUTES REPORT
  if (sourceName === "DISPUTES REPORT" && (contentEncodedStr || bestDesc)) {
    const fullHtmlContent = contentEncodedStr || bestDesc;
    const extracted = feedOverrides.extractDisputesReport({
      link, fullHtmlContent, articleSourceName, pubDateStr, author, maxArticles, currentResults: results.length
    });

    if (extracted.length > 0) {
      results.push(...extracted);
      return true; // Stop standard processing, we handled the sub-articles
    }
  }

  const tags = calculateTags(title, bestDesc, searchContent);
  const scrapedImg = scrapeImage(searchContent || bestDesc);

  let finalDescription = cleanHtml(bestDesc);
  // Trim long descriptions to maintain consistent UI and XML sizes
  if (finalDescription.length > 350) {
    const truncated = finalDescription.substring(0, 350);
    const lastSpace = truncated.lastIndexOf(' ');
    finalDescription = truncated.substring(0, lastSpace > 0 ? lastSpace : 350) + '...';
  }

  const article = new Article({
    title,
    link,
    source: articleSourceName,
    topics: tags,
    description: finalDescription,
    thumbnail: networkConfig.wrapImageProxy(scrapedImg),
    parsedDate: parseDate(pubDateStr),
    author: author || null,
    dominantColor: null
  });

  if (!feedFilterRules.shouldExcludeArticle(article)) results.push(article);
  return true;
}

export const feedParser = {
  parse(rawXml, sourceName, feedUrl, maxArticles = null) {
    if (!rawXml) return [];
    const results = [];
    const registeredHosts = getRegisteredHosts();

    let domParsed = false;

    // 1. ATTEMPT DOMPARSER SYSTEM
    if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
      try {
        const parser = new window.DOMParser();
        const xmlDoc = parser.parseFromString(rawXml, "text/xml");
        if (!xmlDoc.querySelector("parsererror")) {
          const items = Array.from(xmlDoc.querySelectorAll("item, entry"));
          if (items.length > 0) {
            domParsed = true;
            for (const item of items) {
              const title = item.querySelector("title")?.textContent;
              let link = item.querySelector("link")?.textContent?.trim();
              if (!link) link = item.querySelector("link")?.getAttribute("href");

              const pubDate = item.querySelector("pubDate, published, date")?.textContent ||
                              item.getElementsByTagNameNS("*", "date")[0]?.textContent;

              const summary = item.querySelector("summary")?.textContent;
              const desc = item.querySelector("description")?.textContent;
              const content = item.getElementsByTagNameNS("*", "encoded")[0]?.textContent ||
                              item.querySelector("content")?.textContent;

              const author = item.getElementsByTagNameNS("*", "creator")[0]?.textContent ||
                             item.querySelector("author > name, contributor > name, author")?.textContent;

              processExtractedItem({
                titleStr: title, 
                linkStr: link, 
                sourceName, feedUrl, registeredHosts, maxArticles, results, 
                pubDateStr: pubDate, 
                summaryStr: summary, 
                descStr: desc, 
                contentEncodedStr: content, 
                authorTagContent: author
              });
              if (maxArticles !== null && results.length >= maxArticles) break;
            }
          }
        }
      } catch (e) {
        // Fallthrough on DOM failure
      }
    }

    // 2. FALLBACK TO REGEX SYSTEM (If DOMParser fails or returns 0 tags)
    if (!domParsed) {
      const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
      const atomRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;

      let items = [...rawXml.matchAll(itemRegex)];
      if (items.length === 0) items = [...rawXml.matchAll(atomRegex)];

      for (const match of items) {
        const content = match[1] || '';

        const titleMatch = content.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const linkMatch = content.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) ||
                          content.match(/<link[^>]+href=["']([^"']+)["']/i);
        const pubDateMatch = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) ||
                             content.match(/<published>([\s\S]*?)<\/published>/i) ||
                             content.match(/<dc:date>([\s\S]*?)<\/dc:date>/i);

        const summaryMatch = content.match(/<summary.*?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i);
        const descTagMatch = content.match(/<description.*?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
        const contentEncodedMatch = content.match(/<content:encoded.*?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i) ||
                                    content.match(/<content.*?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i);

        let authorTagContent = '';
        const authorRegexes = [
          /<dc:creator[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/dc:creator>/i,
          /<author[^>]*>[\s\S]*?<name[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/name>/i,
          /<author[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/author>/i,
          /<contributor[^>]*>[\s\S]*?<name[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/name>/i
        ];
        for (const reg of authorRegexes) {
          const authMatch = content.match(reg);
          if (authMatch && authMatch[1]) {
            authorTagContent = authMatch[1];
            break;
          }
        }

        processExtractedItem({
          titleStr: titleMatch ? titleMatch[1] : undefined,
          linkStr: linkMatch ? linkMatch[1] : undefined,
          pubDateStr: pubDateMatch ? pubDateMatch[1] : undefined,
          summaryStr: summaryMatch ? summaryMatch[1] : undefined,
          descStr: descTagMatch ? descTagMatch[1] : undefined,
          contentEncodedStr: contentEncodedMatch ? contentEncodedMatch[1] : undefined,
          authorTagContent,
          sourceName, feedUrl, registeredHosts, maxArticles, results
        });

        if (maxArticles !== null && results.length >= maxArticles) break;
      }
    }

    return results;
  },

  async scrapeUrlForImage(url, signal) {
    return scrapeUrlForImage(url, signal);
  },

  clearImageScrapeCache(url) {
    clearImageScrapeCache(url);
  },

  parseDate(s) {
    return parseDate(s);
  },

  cleanHtml(input) {
    return cleanHtml(input);
  },

  scrapeImage(html) {
    return scrapeImage(html);
  }
};