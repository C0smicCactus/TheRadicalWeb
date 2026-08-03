export const feedFilterRules = {
  rules: [
    {
      feedIdentifier: "GREEN LEFT",
      shouldExclude: (article) => article.title.startsWith("Green Left Radio")
    },
    {
      feedIdentifier: "GREEN LEFT",
      shouldExclude: (article) => article.title.startsWith("On The Street")
    }
  ],

  shouldExcludeArticle(article) {
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
