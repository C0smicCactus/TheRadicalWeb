/**
 * @file feedOverrides.ts
 * @description Specialized processing rules for specific feed sources (e.g., LabourStart domain filtering, Disputes Report sub-article extraction).
 */

import { Article } from '#lib/models/Article.js';
import { calculateTags } from './tagCalculator.js';
import { networkConfig } from '#lib/config/networkConfig.js';
import { scrapeImage } from './imageScraper.js';
import { cleanHtml, parseDate } from './feedParser.utils.js';
import { feedFilterRules } from '#lib/utils/feedFilterRules.js';

interface DisputesReportPayload {
  link: string;
  fullHtmlContent: string;
  articleSourceName: string;
  pubDateStr: string | null | undefined;
  author: string;
  maxArticles: number | null;
  currentResults: number;
}

export const feedOverrides = {
  /**
   * Handles LabourStart title trimming and external domain skipping.
   * 
   * @param title - The raw article title.
   * @param link - The article URL.
   * @param registeredHosts - Array of known feed hostnames for deduplication.
   * @returns Whether to skip the article, or the cleaned title.
   */
  processLabourStart(title: string, link: string, registeredHosts: string[]): { skip: true } | { skip: false; title: string } {
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
   * @param payload - The extraction payload.
   * @param payload.link - The base URL of the parent article.
   * @param payload.fullHtmlContent - The full HTML content of the article.
   * @param payload.articleSourceName - The name of the source publication.
   * @param payload.pubDateStr - The publication date string.
   * @param payload.author - The author name.
   * @param payload.maxArticles - Maximum number of articles to collect.
   * @param payload.currentResults - Current count of results collected.
   * @returns Array of extracted sub-article objects.
   */
  extractDisputesReport(payload: DisputesReportPayload): Article[] {
    const { link, fullHtmlContent, articleSourceName, pubDateStr, author, maxArticles, currentResults } = payload;
    const results: Article[] = [];
    const hRegex = /<h[234][^>]*>([\s\S]*?)<\/h[234]>([\s\S]*?)(?=<h[234]>|$)/gi;
    let matchH: RegExpExecArray | null;

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