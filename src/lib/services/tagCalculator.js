/**
 * @file tagCalculator.js
 * @description Calculates topic tags for articles based on keyword scoring and threshold detection.
 */

import { topics } from '#lib/config/topics.js';

/**
 * Calculates and assigns relevant topic tags to an article based on keyword scoring.
 *
 * @param {string} title - The article headline.
 * @param {string} descText - The short summary/description of the article.
 * @param {string} fullContent - The full parsed HTML content.
 * @returns {string[]} An array of assigned topic names (e.g., ["LABOUR", "PRAXIS"]).
 */
export function calculateTags(title, descText, fullContent) {
  const tags = [];
  const textLower = `${title} ${descText} ${fullContent}`.toLowerCase();
  const titleLower = title.toLowerCase();

  for (const topic of topics) {
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
}