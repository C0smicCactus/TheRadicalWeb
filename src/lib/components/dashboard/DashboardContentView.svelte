<script lang="ts">
  import StoryBar from '#lib/components/story/StoryBar.svelte';
  import LoadingScreen from '#lib/components/ui/LoadingScreen.svelte';
  import FeedGrid from '#lib/components/article/FeedGrid.svelte';
  import SettingsControls from '#lib/components/ui/SettingsControls.svelte';
  import type { FeedManager } from '#lib/state/feedManager.svelte.js';

  interface Props {
    fm: FeedManager;
    onShowSources: () => void;
    onShowAbout: () => void;
    onShowGitHub: () => void;
    onCustomColor: () => void;
  }

  let { fm, onShowSources, onShowAbout, onShowGitHub, onCustomColor }: Props = $props();

  let scrollContainer = $state<HTMLDivElement>();

  /** Scrolls the article list back to the top (the list scrolls inside this box, not the window). */
  export function scrollToTop() {
    scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleScroll() {
    if (fm.isLoading || fm.isLoadingMore) return;
    if (!scrollContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    if (scrollHeight - scrollTop - clientHeight < 400 && fm.visibleCount < fm.displayList.length) {
      fm.loadMoreArticles();
    }
  }
</script>

{#if fm.isLoading}
  <LoadingScreen progressPercent={fm.progressPercent} primaryColor={fm.primaryColor} statusMessage={fm.statusMessage} />
{:else}
  <div class="flex-1 overflow-y-auto w-full relative" bind:this={scrollContainer} onscroll={handleScroll}>
    {#if fm.displayList.length === 0}
      <div class="flex items-center justify-center h-full min-h-[300px] text-textSubtle font-bold tracking-widest text-sm uppercase">NO SIGNALS FOUND</div>
    {:else}
      <StoryBar allArticles={fm.allArticles} viewedStoryLinks={fm.viewedStoryLinks} onStoryViewed={fm.markStoryViewed} primaryColor={fm.primaryColor} />

      <main class="max-w-[1754px] mx-auto py-6 px-4 md:px-6">
        <div class="flex gap-8 w-full items-start">
          <!-- Feed Grid Layer (Mobile & Desktop) -->
          <FeedGrid {fm} />

          <!-- Desktop Sidebar Layer -->
          <aside class="hidden md:flex w-72 xl:w-80 shrink-0 flex-col sticky top-6">
            <div class="bg-appSurface border border-borderSubtle rounded-2xl p-6 flex flex-col shadow-xs">
              <SettingsControls {fm} {onShowSources} {onShowAbout} {onShowGitHub} {onCustomColor} />
            </div>
          </aside>
        </div>
      </main>
    {/if}
  </div>
{/if}