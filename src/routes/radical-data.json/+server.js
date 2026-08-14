import { getMegaFeed } from '$lib/server/megaFetcher.js';

export const prerender = true;

export async function GET() {
  const articles = await getMegaFeed();
  return new Response(JSON.stringify(articles.map(a => a.toMap())), {
    headers: { 'Content-Type': 'application/json' }
  });
}