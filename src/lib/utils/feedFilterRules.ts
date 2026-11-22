import type { Article } from '#lib/models/Article.js';

interface FeedFilterRule {
  /** Publisher name the rule applies to */
  feedIdentifier: string;
  shouldExclude: (article: Article) => boolean;
}

export const feedFilterRules: { rules: FeedFilterRule[]; shouldExcludeArticle(article: Article): boolean } = {
  rules: [
    {
      feedIdentifier: "GREEN LEFT",
      shouldExclude: (article: Article) => article.title.startsWith("Green Left Radio")
    },
    {
      feedIdentifier: "GREEN LEFT",
      shouldExclude: (article: Article) => article.title.startsWith("On The Street")
    }
  ],

  shouldExcludeArticle(article: Article): boolean {
    for (const rule of this.rules) {
      if (rule.feedIdentifier === article.source) {
        if (rule.shouldExclude(article)) {
          return true;
        }
      }
    }
    return false;
  }
};
