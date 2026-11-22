<script lang="ts">
  import ArticleTileMobile from './ArticleTileMobile.svelte';
  import ArticleTileDesktop from './ArticleTileDesktop.svelte';
  import ArticleTileHero from './ArticleTileHero.svelte';

  import type { Article } from '#lib/models/Article.js';

  interface Props {
    article: Article;
    primaryColor: string;
    onArticleOpen?: (title: string) => void;
    variant?: 'mobile' | 'desktop' | 'hero';
    topicsEnabled?: boolean;
  }

  let { article, primaryColor, onArticleOpen, variant = "mobile", topicsEnabled = false }: Props = $props();
</script>

{#if variant === 'mobile'}
  <ArticleTileMobile {article} {primaryColor} {onArticleOpen} {topicsEnabled} />
{:else if variant === 'desktop'}
  <ArticleTileDesktop {article} {primaryColor} {onArticleOpen} {topicsEnabled} />
{:else if variant === 'hero'}
  <ArticleTileHero {article} {primaryColor} {onArticleOpen} {topicsEnabled} />
{/if}