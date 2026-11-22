/**
 * @file tagCalculator.ts
 * @description Calculates topic tags for articles based on keyword scoring and threshold detection.
 */

import { topics } from '#lib/config/topics.js';

/**
 * Matches a keyword only as a whole word or phrase, so "ai" doesn't match "against"
 * and the exclusion "sport" doesn't match "transport".
 */
function wholeWord(word: string): RegExp {
  const escaped = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`);
}

// Build the patterns once, rather than for every article.
const compiledTopics = topics.map((topic) => ({
  name: topic.name,
  threshold: topic.threshold,
  keywords: topic.keywords.map((kw) => ({
    pattern: wholeWord(kw.keyword),
    weight: kw.weight,
    isMultiWord: kw.keyword.includes(' ')
  })),
  exclusions: topic.exclusions.map(wholeWord)
}));

/**
 * Calculates and assigns relevant topic tags to an article based on keyword scoring.
 *
 * @param title - The article headline.
 * @param descText - The short summary/description of the article.
 * @param fullContent - The full parsed HTML content.
 * @returns An array of assigned topic names (e.g., ["LABOUR", "PRAXIS"]).
 */
export function calculateTags(title: string, descText: string | null | undefined, fullContent: string): string[] {
  const tags: string[] = [];
  const textLower = `${title} ${descText} ${fullContent}`.toLowerCase();
  const titleLower = title.toLowerCase();

  for (const topic of compiledTopics) {
    let score = 0.0;
    for (const kw of topic.keywords) {
      if (kw.pattern.test(titleLower)) {
        score += kw.weight * 3.0;
        if (kw.isMultiWord) score += 1.0;
      }
      if (kw.pattern.test(textLower)) {
        score += kw.weight * 1.0;
        if (kw.isMultiWord) score += 0.5;
      }
    }

    const hasExclusion = topic.exclusions.some((pattern) => pattern.test(textLower));
    if (score >= topic.threshold && !hasExclusion) {
      tags.push(topic.name);
    }
  }
  return tags;
}