export class Article {
  constructor(params = {}) {
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

  toMap() {
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

  static fromMap(map) {
    if (!map) return new Article();
    return new Article({
      ...map,
      parsedDate: map.parsedDate ? new Date(map.parsedDate) : new Date()
    });
  }
}
