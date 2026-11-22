/** An article as stored in radical-data.json and the offline cache (dates as ISO strings). */
export interface ArticleMap {
  title: string;
  link: string;
  description: string;
  source: string;
  thumbnail: string;
  author: string | null;
  parsedDate: string;
  topics: string[];
  dominantColor: string | null;
}

/** Fields accepted when creating an Article. Anything left out gets a default. */
export interface ArticleParams {
  title?: string;
  link?: string;
  description?: string;
  source?: string;
  thumbnail?: string;
  author?: string | null;
  parsedDate?: Date | string | number;
  topics?: string[];
  dominantColor?: string | null;
}

export class Article {
  title: string;
  link: string;
  description: string;
  source: string;
  thumbnail: string;
  author: string | null;
  parsedDate: Date;
  topics: string[];
  dominantColor: string | null;

  constructor(params: ArticleParams = {}) {
    const {
      title = '',
      link = '',
      description = '',
      source = '',
      thumbnail = '',
      author = null,
      parsedDate = new Date(),
      topics = [],
      dominantColor = null
    } = params || {};

    this.title = title;
    this.link = link;
    this.description = description;
    this.source = source;
    this.thumbnail = thumbnail;
    this.author = author;
    this.parsedDate = parsedDate instanceof Date ? parsedDate : new Date(parsedDate || Date.now());
    this.topics = Array.isArray(topics) ? topics : [];
    this.dominantColor = dominantColor;
  }

  toMap(): ArticleMap {
    return {
      title: this.title,
      link: this.link,
      description: this.description,
      source: this.source,
      thumbnail: this.thumbnail,
      author: this.author,
      parsedDate: this.parsedDate.toISOString(),
      topics: this.topics,
      dominantColor: this.dominantColor
    };
  }

  static fromMap(map: Partial<ArticleMap> | null | undefined): Article {
    if (!map) return new Article();
    return new Article({
      ...map,
      parsedDate: map.parsedDate ? new Date(map.parsedDate) : new Date()
    });
  }
}
