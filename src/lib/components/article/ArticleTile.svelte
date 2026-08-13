<script>
  import { feedParser } from '$lib/services/feedParser.js';
  
  import ArticleTileMobile from './ArticleTileMobile.svelte';
  import ArticleTileDesktop from './ArticleTileDesktop.svelte';
  import ArticleTileHero from './ArticleTileHero.svelte';

  let { article, primaryColor, onArticleOpen, variant = "mobile", topicsEnabled = false } = $props();
  let finalThumbnail = $state(undefined);

  // Use Intersection Observer to only scrape image once the tile enters the viewport
  function lazyLoadAction(node) {
    let observer;
    if (!finalThumbnail && !article.thumbnail && article.link) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          feedParser.scrapeUrlForImage(article.link).then(scraped => {
            if (scraped) {
              finalThumbnail = feedParser.scrapeImage(scraped) || scraped;
            }
          });
          observer.disconnect(); // Fire once and detach
        }
      }, { rootMargin: '300px' }); // Trigger scrape 300px before scrolling into view
      observer.observe(node);
    }
    return {
      destroy() {
        if (observer) observer.disconnect();
      }
    };
  }
</script>

{#if variant === 'mobile'}
  <ArticleTileMobile {article} {primaryColor} {onArticleOpen} {topicsEnabled} {finalThumbnail} {lazyLoadAction} />
{:else if variant === 'desktop'}
  <ArticleTileDesktop {article} {primaryColor} {onArticleOpen} {topicsEnabled} {finalThumbnail} {lazyLoadAction} />
{:else if variant === 'hero'}
  <ArticleTileHero {article} {primaryColor} {onArticleOpen} {topicsEnabled} {finalThumbnail} {lazyLoadAction} />
{/if}