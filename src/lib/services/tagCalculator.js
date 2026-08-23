// =============================================================================
// Tag Calculator
// Calculates topic tags for articles based on keyword scoring
// =============================================================================

import { appTopics } from '$lib/config/appTopics.js';

export function calculateTags(title, descText, fullContent) {
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
}