import type { Action } from 'svelte/action';
import type { Article } from '#lib/models/Article.js';

/** Props shared by the mobile, desktop and hero article tiles. */
export interface ArticleTileVariantProps {
  article: Article;
  primaryColor: string;
  onArticleOpen?: (title: string) => void;
  topicsEnabled: boolean;
  /** Image found by scraping the article page, when the feed had none */
  finalThumbnail: string | undefined;
  lazyLoadAction: Action<HTMLElement>;
}
