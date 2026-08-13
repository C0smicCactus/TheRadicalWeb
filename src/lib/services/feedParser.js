import { Article } from '$lib/models/Article.js';
import { appFeeds } from '$lib/config/appFeeds.js';
import { appTopics } from '$lib/config/appTopics.js';
import { networkConfig } from '$lib/config/networkConfig.js';
import { feedFilterRules } from '$lib/utils/feedFilterRules.js';

// Shared image scraping cache to deduplicate requests across all components
const imageScrapeCache = new Map();

// Cache registered hosts once
let _registeredHosts = null;
function getRegisteredHosts() {
  if (_registeredHosts) return _registeredHosts;
  const allFeedUrls = [
    ...Object.keys(appFeeds.coreSources),
    ...Object.keys(appFeeds.globalSources),
    ...Object.keys(appFeeds.extendedSources)
  ];
  _registeredHosts = allFeedUrls.map(url => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch(e) { return ''; }
  }).filter(Boolean);
  return _registeredHosts;
}

export const feedParser = {
  parse(rawXml, sourceName, maxArticles = null) {
    if (!rawXml) return [];
    const results = [];
    const registeredHosts = getRegisteredHosts();

    // Helper closure to assemble extracted strings into a clean Article instance
    const processExtractedItem = (titleStr, linkStr, pubDateStr, summaryStr, descStr, contentEncodedStr, authorTagContent) => {
      let title = this.cleanHtml(titleStr || 'Untitled');
      let link = (linkStr || '').trim();

      if (Object.values(appFeeds.globalSources).includes(sourceName)) {
        const isRelevant = appFeeds.auKeywords.some(k => {
          const pattern = new RegExp(`\\b${k.toLowerCase()}\\b`, 'i');
          return pattern.test(title.toLowerCase());
        });
        if (!isRelevant) return false;
      }

      let bestDesc = summaryStr?.trim().length > 0 ? summaryStr : descStr;
      if (!bestDesc && contentEncodedStr) bestDesc = contentEncodedStr;
      const searchContent = `${summaryStr || ''} ${descStr || ''} ${contentEncodedStr || ''}`;

      let author = this.extractAuthor(authorTagContent, title, searchContent, sourceName);
      let articleSourceName = sourceName;

      // SPECIAL RULE: LABOURSTART
      if (sourceName === "LABOURSTART") {
        let itemHost = '';
        try { itemHost = new URL(link).hostname.replace(/^www\./, ''); } catch(e) {}
        if (registeredHosts.includes(itemHost)) return false; 
        
        let publisher = "UNKNOWN PUBLISHER";
        const pubMatch = (bestDesc || '').match(/Source:\s*(.*?)(?:\s+http|<|$)/i);
        if (pubMatch) publisher = pubMatch[1].trim().toUpperCase();
        articleSourceName = `${publisher} via LABOURSTART`;
        
        if (title.startsWith('Australia: ')) title = title.substring(11).trim();
      }

      // SPECIAL RULE: DISPUTES REPORT
      if (sourceName === "DISPUTES REPORT" && (contentEncodedStr || bestDesc)) {
        const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h[23]>|$)/gi;
        let matchH3;
        let hasSubArticles = false;
        const fullHtmlContent = contentEncodedStr || bestDesc;
        
        while ((matchH3 = h3Regex.exec(fullHtmlContent)) !== null) {
          const subTitle = this.cleanHtml(matchH3[1]).trim();
          if (!subTitle) continue;
          
          hasSubArticles = true;
          const subContent = matchH3[2];
          const subDescText = this.cleanHtml(subContent);
          const subImg = this.scrapeImage(subContent);
          const subTags = this.calculateTags(subTitle, subDescText, subContent);
          const uniqueHash = subTitle.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const uniqueLink = `${link}#${uniqueHash}`;
          
          const subArticle = new Article({
            title: subTitle,
            link: uniqueLink, 
            source: articleSourceName,
            topics: subTags,
            description: subDescText,
            thumbnail: networkConfig.wrapImageProxy(subImg),
            parsedDate: this.parseDate(pubDateStr),
            author: author || null,
            dominantColor: null
          });
          
          if (!feedFilterRules.shouldExcludeArticle(subArticle)) results.push(subArticle);
          if (maxArticles !== null && results.length >= maxArticles) return true;
        }
        
        if (hasSubArticles) return true; 
      }

      const tags = this.calculateTags(title, bestDesc, searchContent);
      const scrapedImg = this.scrapeImage(searchContent || bestDesc);

      const article = new Article({
        title,
        link,
        source: articleSourceName,
        topics: tags,
        description: this.cleanHtml(bestDesc),
        thumbnail: networkConfig.wrapImageProxy(scrapedImg),
        parsedDate: this.parseDate(pubDateStr),
        author: author || null,
        dominantColor: null
      });

      if (!feedFilterRules.shouldExcludeArticle(article)) results.push(article);
      return true;
    };

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

              processExtractedItem(title, link, pubDate, summary, desc, content, author);
              if (maxArticles !== null && results.length >= maxArticles) break;
            }
          }
        }
      } catch (e) {
        // Fallthrough on DOM failure
      }
    }

    // 2. FALLBACK TO YOUR REGEX SYSTEM (If DOMParser fails or returns 0 tags)
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

        processExtractedItem(
          titleMatch ? titleMatch[1] : undefined,
          linkMatch ? linkMatch[1] : undefined,
          pubDateMatch ? pubDateMatch[1] : undefined,
          summaryMatch ? summaryMatch[1] : undefined,
          descTagMatch ? descTagMatch[1] : undefined,
          contentEncodedMatch ? contentEncodedMatch[1] : undefined,
          authorTagContent
        );

        if (maxArticles !== null && results.length >= maxArticles) break;
      }
    }

    return results;
  },

  calculateTags(title, descText, fullContent) {
    const tags = [];
    const textLower = `${title} ${descText} ${fullContent}`.toLowerCase();
    const titleLower = title.toLowerCase();

    for (const topic of appTopics) {
      let score = 0.0;
      for (const kw of topic.keywords) {
        const kwLower = kw.keyword.toLowerCase();
        const isMultiWord = kwLower.includes(' ');

        if (titleLower.includes(kwLower)) {
          score += kw.weight * 3.0;
          if (isMultiWord) score += 1.0;
        }
        if (textLower.includes(kwLower)) {
          score += kw.weight * 1.0;
          if (isMultiWord) score += 0.5;
        }
      }

      const hasExclusion = topic.exclusions.some(excl => textLower.includes(excl.toLowerCase()));
      if (score >= topic.threshold && !hasExclusion) {
        tags.push(topic.name);
      }
    }
    return tags;
  },

  extractAuthor(authorTag, title, content, sourceName) {
    let author = this.cleanHtml(authorTag || '').trim();

    if (author.toLowerCase().startsWith('by ')) {
      author = author.substring(3).trim();
    }

    // Handle generic email formatted authors (e.g. email@example.com (John Doe))
    const emailMatch = author.match(/^[^\s]+@[^\s]+\s+\(([^)]+)\)$/);
    if (emailMatch) {
      author = emailMatch[1].trim();
    }

    const isInvalidAuthor = (name) => {
      if (!name) return true;
      const lower = name.toLowerCase();
      if (lower.includes('@') || lower.includes('http')) return true;
      const genericTerms = ['admin', 'editor', 'staff', 'news desk', 'webmaster', 'contributor', 'publisher', 'team', 'newsroom'];
      if (genericTerms.some(x => lower.includes(x))) return true;
      if (lower === sourceName.toLowerCase() || lower.includes(sourceName.toLowerCase())) return true;
      return false;
    };

    // Fallback: Use Regex on text contents to find explicit byline
    let extractedFromText = '';
    const plainText = this.cleanHtml(content);

    // Matches localized Title Cased names
    const namePattern = "([A-Z\u00C0-\u017F][a-zA-Z\u00C0-\u017F\\-'.]+(?:\\s+[A-Z\u00C0-\u017F][a-zA-Z\u00C0-\u017F\\-'.]+){1,3})";
    const byRegexes = [
      new RegExp(`(?:^|\\n|\\s)(?:[Ww]ords|[Ww]ritten|[Rr]eport|[Rr]eview)\\s+(?:[Bb]y)\\s*:?\\s*${namePattern}\\b`),
      new RegExp(`(?:^|\\n|\\s)(?:[Bb]y)\\s*:?\\s*${namePattern}\\b`),
      new RegExp(`^${namePattern}\\b(?=\\s*[-—|])`)
    ];

    for (const reg of byRegexes) {
      const textsToSearch = [title, plainText];
      for (const text of textsToSearch) {
        const match = text.match(reg);
        if (match && match[1]) {
          const possibleName = match[1].trim();
          const lowerName = possibleName.toLowerCase();
          
          // Guard against false positives like "By Sunday", "By The Government"
          const invalidWords = [
            'the', 'this', 'that', 'a', 'an', 'our', 'some', 'any', 'no', 'in',
            'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 
            'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
            'yesterday', 'today', 'tomorrow', 'admin', 'staff', 'editor', 'associated', 'reuters', 'aap', 'guest', 'contributor', 'correspondent'
          ];
          
          const firstWord = lowerName.split(' ')[0];
          if (!invalidWords.includes(firstWord) && !isInvalidAuthor(possibleName)) {
            extractedFromText = possibleName;
            break;
          }
        }
      }
      if (extractedFromText) break;
    }

    if (!author || isInvalidAuthor(author)) {
      author = extractedFromText;
    }

    // Force proper Title Case as requested - applies to ALL author names
    if (author) {
      author = author.split(' ').map(word => {
        return word.split('-').map(part => {
          if (!part) return '';
          const quoteSplit = part.split("'");
          if (quoteSplit.length > 1) {
            return quoteSplit.map(q => q ? q.charAt(0).toUpperCase() + q.slice(1).toLowerCase() : '').join("'");
          }
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }).join('-');
      }).join(' ');
    }

    return author;
  },

  async scrapeUrlForImage(url, signal) {
    if (!url) return "";

    // Deduplication: return existing promise if already scraping this URL
    if (imageScrapeCache.has(url)) {
      return imageScrapeCache.get(url);
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
  },

  // Clear a URL from the scrape cache (useful for cleanup or manual refresh)
  clearImageScrapeCache(url) {
    if (url) {
      imageScrapeCache.delete(url);
    } else {
      imageScrapeCache.clear();
    }
  },

  parseDate(s) {
    if (!s) return new Date();
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) return parsed;
    try {
      const c = s.split(' +')[0].split(' -')[0];
      const fallback = new Date(c);
      return isNaN(fallback.getTime()) ? new Date() : fallback;
    } catch (e) {
      return new Date();
    }
  },

  cleanHtml(input) {
    if (!input) return "";
    // Replace block-level tags and line breaks with space to avoid word merging
    let result = input
      .replace(/<!\[CDATA\[|\]\]>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/amp;nbsp/gi, ' ')
      .replace(/<\/?(p|br|div|h[1-6]|li|ul|ol|table|tr|td|th|blockquote)[^>]*>/gi, ' ');

    let prev;
    let limit = 0;
    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        do {
          prev = result;
          const doc = parser.parseFromString(result, 'text/html');
          result = doc.body.textContent || "";
          limit++;
        } while (result !== prev && limit < 3);
      } catch (e) {
        // Fallback before
      }
    }

    // Regex fallback for tags & entities
    result = result
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return result;
  },

  scrapeImage(html) {
    if (!html) return '';
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : '';
  }
};