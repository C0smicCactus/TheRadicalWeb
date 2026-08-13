<script>
  import { onMount } from 'svelte';
  import { feedParser } from '$lib/services/feedParser.js';
  
  import ArticleTileMobile from './ArticleTileMobile.svelte';
  import ArticleTileDesktop from './ArticleTileDesktop.svelte';
  import ArticleTileHero from './ArticleTileHero.svelte';

  let { article, primaryColor, onArticleOpen, variant = "mobile", topicsEnabled = false } = $props();
  let finalThumbnail = $state(undefined);

  onMount(() => {
    let mounted = true;
    if (!finalThumbnail && article.link) {
      feedParser.scrapeUrlForImage(article.link).then(scraped => {
        if (!mounted) return;
        if (scraped) {
          finalThumbnail = feedParser.scrapeImage(scraped) || scraped;
        }
      });
    }
    return () => mounted = false;
  });
</script>

{#if variant === 'mobile'}
  <ArticleTileMobile {article} {primaryColor} {onArticleOpen} {topicsEnabled} {finalThumbnail} />
{:else if variant === 'desktop'}
  <ArticleTileDesktop {article} {primaryColor} {onArticleOpen} {topicsEnabled} {finalThumbnail} />
{:else if variant === 'hero'}
  <ArticleTileHero {article} {primaryColor} {onArticleOpen} {topicsEnabled} {finalThumbnail} />
{/if}