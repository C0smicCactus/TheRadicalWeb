import { Article } from '$lib/models/Article.js';
import { appFeeds } from '$lib/core/appFeeds.js';
import { appTopics } from '$lib/core/appTopics.js';
import { networkConfig } from '$lib/core/networkConfig.js';
import { feedFilterRules } from '$lib/core/feedFilterRules.js';

export const feedParser = {
  parse(rawXml, sourceName) {
    if (!rawXml) return [];
    const results = [];
    const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
    const atomRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;

    let items = [...rawXml.matchAll(itemRegex)];
    if (items.length === 0) items = [...rawXml.matchAll(atomRegex)];

    for (const match of items) {
      const content = match[1] || '';

      const titleMatch = content.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      let title = this.cleanHtml(titleMatch ? titleMatch[1] : 'Untitled');

      // Check AU relevance for global sources
      if (Object.values(appFeeds.globalSources).includes(sourceName)) {
        const isRelevant = appFeeds.auKeywords.some(k => {
          const pattern = new RegExp(`\\b${k.toLowerCase()}\\b`, 'i');
          return pattern.test(title.toLowerCase());
        });
        if (!isRelevant) continue;
      }

      const linkMatch = content.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) ||
                        content.match(/<link[^>]+href=["']([^"']+)["']/i);
      let link = linkMatch ? linkMatch[1] : '';

      const pubDateMatch = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) ||
                           content.match(/<published>([\s\S]*?)<\/published>/i) ||
                           content.match(/<dc:date>([\s\S]*?)<\/dc:date>/i);
      let pubDateStr = pubDateMatch ? pubDateMatch[1] : '';

      const summaryMatch = content.match(/<summary.*?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i);
      const descMatch = content.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
                        content.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);

      let summary = summaryMatch ? summaryMatch[1] : '';
      let description = descMatch ? descMatch[1] : '';
      let bestDesc = summary.trim().length > 0 ? summary : description;

      // Extract author
      let authorMatch = content.match(/<author[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/author>/i);
      let author = authorMatch ? authorMatch[1] : '';

      if (!author) {
        let creatorMatch = content.match(/<dc:creator[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/dc:creator>/i);
        author = creatorMatch ? creatorMatch[1] : '';
      }
      if (!author) {
        let nameMatch = content.match(/<author[^>]*>[\s\S]*?<name[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/name>/i);
        author = nameMatch ? nameMatch[1] : '';
      }

      if (!author) {
        const byMatch = content.match(/\bby\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/i);
        if (byMatch) {
          author = byMatch[1].trim();
        }
        if (!author) {
          const titleByMatch = title.match(/\bby\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/i);
          if (titleByMatch) {
            author = titleByMatch[1].trim();
          }
        }
      }

      author = this.cleanHtml(author.trim());

      const tags = [];
      const textLower = `${title} ${bestDesc}`.toLowerCase();
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

      const scrapedImg = this.scrapeImage(content + bestDesc);

      const article = new Article({
        title,
        link: link.trim(),
        source: sourceName,
        topics: tags,
        description: this.cleanHtml(bestDesc),
        thumbnail: networkConfig.wrapImageProxy(scrapedImg),
        parsedDate: this.parseDate(pubDateStr),
        author: author || null,
        dominantColor: null
      });

      if (!feedFilterRules.shouldExcludeArticle(article)) {
        results.push(article);
      }
    }
    return results;
  },

  async scrapeUrlForImage(url) {
    if (!url) return "";
    try {
      const finalUrl = networkConfig.wrapCorsProxy(url);
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), networkConfig.imageScrapeTimeoutMs);
      const res = await fetch(finalUrl, { signal: controller.signal });
      clearTimeout(id);

      if (res.ok) {
        const text = await res.text();
        const ogMatch = text.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                        text.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        return ogMatch ? ogMatch[1] : "";
      }
    } catch (e) {
      // Ignored
    }
    return "";
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
    let result = input
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/amp;nbsp/g, ' ');

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
        // Fallback below
      }
    }

    // Regex fallback for tags & entities
    result = result
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>/g, '')
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
