/**
 * @file feedOverrides.js
 * @description Specialized processing rules for specific feed sources (e.g., LabourStart domain filtering, Disputes Report sub-article extraction).
 */

import { Article } from '#lib/models/Article.js';
import { calculateTags } from './tagCalculator.js';
import { networkConfig } from '#lib/config/networkConfig.js';
import { scrapeImage } from './imageScraper.js';
import { cleanHtml, parseDate } from './feedParser.utils.js';
import { feedFilterRules } from '#lib/utils/feedFilterRules.js';

export const feedOverrides = {
  /**
   * Handles LabourStart title trimming and external domain skipping.
   * 
   * @param {string} title - The raw article title.
   * @param {string} link - The article URL.
   * @param {string[]} registeredHosts - Array of known feed hostnames for deduplication.
   * @returns {{skip: boolean, title?: string}} Whether to skip the article or the cleaned title.
   */
  processLabourStart(title, link, registeredHosts) {
    let itemHost = '';
    try { itemHost = new URL(link).hostname.replace(/^www\./, ''); } catch(e) {}
    
    if (registeredHosts.includes(itemHost)) return { skip: true };
    
    let cleanTitle = title;
    if (cleanTitle.startsWith('Australia: ')) {
      cleanTitle = cleanTitle.substring(11).trim();
    }
    
    return { skip: false, title: cleanTitle };
  },

  /**
   * Splits Disputes Report newsletter content into individual sub-articles based on heading tags.
   * 
   * @param {object} payload - The extraction payload.
   * @param {string} payload.link - The base URL of the parent article.
   * @param {string} payload.fullHtmlContent - The full HTML content of the article.
   * @param {string} payload.articleSourceName - The name of the source publication.
   * @param {string} payload.pubDateStr - The publication date string.
   * @param {string} payload.author - The author name.
   * @param {number} payload.maxArticles - Maximum number of articles to collect.
   * @param {number} payload.currentResults - Current count of results collected.
   * @returns {Article[]} Array of extracted sub-article objects.
   */
  extractDisputesReport(payload) {
    const { link, fullHtmlContent, articleSourceName, pubDateStr, author, maxArticles, currentResults } = payload;
    const results = [];
    const hRegex = /<h[234][^>]*>([\s\S]*?)<\/h[234]>([\s\S]*?)(?=<h[234]>|$)/gi;
    let matchH;

    while ((matchH = hRegex.exec(fullHtmlContent)) !== null) {
      const subTitle = cleanHtml(matchH[1]).trim();
      if (!subTitle) continue;

      const subContent = matchH[2];
      let subDescText = cleanHtml(subContent);
      
      if (subDescText.length > 350) {
        const truncated = subDescText.substring(0, 350);
        const lastSpace = truncated.lastIndexOf(' ');
        subDescText = truncated.substring(0, lastSpace > 0 ? lastSpace : 350) + '...';
      }

      const subImg = scrapeImage(subContent);
      const subTags = calculateTags(subTitle, subDescText, subContent);
      const uniqueHash = subTitle.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const uniqueLink = `${link}#${uniqueHash}`;

      const subArticle = new Article({
        title: subTitle,
        link: uniqueLink,
        source: articleSourceName,
        topics: subTags,
        description: subDescText,
        thumbnail: networkConfig.wrapImageProxy(subImg),
        parsedDate: parseDate(pubDateStr),
        author: author || null
      });

      if (!feedFilterRules.shouldExcludeArticle(subArticle)) results.push(subArticle);
      if (maxArticles !== null && (currentResults + results.length) >= maxArticles) break;
    }
    return results;
  }
};