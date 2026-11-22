import type { Article } from '#lib/models/Article.js';

/** Props shared by the mobile, desktop and hero article tiles. */
export interface ArticleTileVariantProps {
  article: Article;
  primaryColor: string;
  onArticleOpen?: (title: string) => void;
  topicsEnabled: boolean;
}
