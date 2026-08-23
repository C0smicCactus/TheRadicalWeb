/**
 * @file authorExtractor.js
 * @description Extracts and formats author names from RSS/Atom feed items with fallback text parsing.
 */

import { cleanHtml } from './feedParser.utils.js';

/**
 * Extracts an author name from an RSS/Atom feed element, with fallback regex parsing from article content.
 *
 * @param {string} authorTag - The raw author element content from the feed.
 * @param {string} title - The article headline for fallback matching.
 * @param {string} content - The full article HTML content for fallback matching.
 * @param {string} sourceName - The name of the source publication for exclusion filtering.
 * @returns {string} The cleaned author name, or empty string if none found.
 */
export function extractAuthor(authorTag, title, content, sourceName) {
  let author = cleanHtml(authorTag || '').trim();

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
  const plainText = cleanHtml(content);

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
}