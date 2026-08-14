import { getMegaFeed } from '$lib/server/megaFetcher.js';

export const prerender = true;

export async function GET() {
  const articles = await getMegaFeed();
  
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>The Radical</title>
  <link>https://c0smiccactus.github.io/TheRadicalWeb/</link>
  <description>A high-performance news aggregator centralised for Australian political and social perspectives.</description>
  <language>en-au</language>
  <atom:link href="https://c0smiccactus.github.io/TheRadicalWeb/radical-feed.xml" rel="self" type="application/rss+xml" />
  ${articles.map(article => `
  <item>
    <title><![CDATA[${article.title}]]></title>
    <link>${article.link}</link>
    <guid isPermaLink="false">${article.link}</guid>
    <description><![CDATA[${article.description}]]></description>
    <pubDate>${new Date(article.parsedDate).toUTCString()}</pubDate>
    <source url="${article.link}">${article.source}</source>
    ${article.author ? `<author><![CDATA[${article.author}]]></author>` : ''}
    ${article.topics.map(t => `<category><![CDATA[${t}]]></category>`).join('')}
    ${article.thumbnail ? `<media:content url="${article.thumbnail}" medium="image" />` : ''}
  </item>`).join('\n  ')}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml' }
  });
}