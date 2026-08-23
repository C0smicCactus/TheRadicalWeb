// =============================================================================
// Feed Parser Utilities
// Shared helpers for feed parsing: date parsing, HTML cleaning, host resolution
// =============================================================================

import { appFeeds } from '$lib/config/appFeeds.js';

// Cache registered hosts once
let _registeredHosts = null;

export function getRegisteredHosts() {
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

export function parseDate(s) {
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
}

export function cleanHtml(input) {
  if (!input) return "";

  let result = input.toString();

  // 1. Remove CDATA wrappers
  result = result.replace(/<!\[CDATA\[/gi, '').replace(/\]\]>/gi, '');

  // 2. Decode entities (Loop up to 3 times to handle double/triple encoding)
  const decodeEntities = (str) => {
    let prev;
    let passes = 0;
    do {
      prev = str;
      // Using string concatenation prevents text editors and chat interfaces
      // from accidentally converting the codes into visual symbols.
      str = str
        .replace(new RegExp('&' + 'amp;', 'gi'), '&')
        .replace(new RegExp('&' + 'lt;', 'gi'), '<')
        .replace(new RegExp('&' + 'gt;', 'gi'), '>')
        .replace(new RegExp('&' + 'quot;', 'gi'), '"')
        .replace(new RegExp('&' + 'apos;', 'gi'), "'")
        .replace(new RegExp('&' + 'lsquo;', 'gi'), "'")
        .replace(new RegExp('&' + 'rsquo;', 'gi'), "'")
        .replace(new RegExp('&' + 'ldquo;', 'gi'), '"')
        .replace(new RegExp('&' + 'rdquo;', 'gi'), '"')
        .replace(new RegExp('&' + 'ndash;', 'gi'), '-')
        .replace(new RegExp('&' + 'mdash;', 'gi'), '—')
        .replace(new RegExp('&' + 'nbsp;', 'gi'), ' ')
        // Catch numeric entity codes (with or without semicolons)
        .replace(/&#(\d+);?/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&#x([a-fA-F0-9]+);?/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
      passes++;
    } while (str !== prev && passes < 3);
    return str;
  };

  result = decodeEntities(result);

  // 3. Replace block-level tags and line breaks with space to avoid word merging
  result = result.replace(/<\/?(p|br|div|h[1-6]|li|ul|ol|table|tr|td|th|blockquote)[^>]*>/gi, ' ');

  // 4. Strip all remaining complete HTML tags
  result = result.replace(/<[^>]*>/g, ' ');

  // 5. Strip any truncated HTML tag at the very end of the string (e.g. "<div class=")
  result = result.replace(/<[^>]*$/, '');

  // 6. Final cleanup of whitespace and stray encoded characters
  result = decodeEntities(result);
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}