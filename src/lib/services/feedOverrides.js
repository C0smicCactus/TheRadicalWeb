// src/lib/services/feedOverrides.js
import { Article } from '$lib/models/Article.js';
import { calculateTags } from './tagCalculator.js';
import { networkConfig } from '$lib/config/networkConfig.js';
import { scrapeImage } from './imageScraper.js';
import { cleanHtml, parseDate } from './feedParser.utils.js';
import { feedFilterRules } from '$lib/utils/feedFilterRules.js';

export const feedOverrides = {
  // Handles LabourStart trimming and external domain skipping
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

  // Handles splitting Disputes Report newsletters into individual articles
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