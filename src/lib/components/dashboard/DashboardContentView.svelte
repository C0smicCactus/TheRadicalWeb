<script>
  import StoryBar from '$lib/components/story/StoryBar.svelte';
  import LoadingScreen from '$lib/components/ui/LoadingScreen.svelte';
  import FeedGrid from '$lib/components/article/FeedGrid.svelte';
  import SettingsControls from '$lib/components/ui/SettingsControls.svelte';

  let { fm, onShowSources, onShowAbout, onShowGitHub, onCustomColor } = $props();

  let scrollContainer = $state();

  function handleScroll() {
    if (fm.isLoading || fm.isLoadingMore) return;
    if (!scrollContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    if (scrollHeight - scrollTop - clientHeight < 400 && fm.visibleCount < fm.displayList.length) {
      fm.loadMoreArticles();
    }
  }
</script>

{#if fm.tabIndex === 1}
  <div class="flex-1 flex flex-col items-center justify-center p-8">
    <i class="fa-solid fa-video-slash text-4xl mb-5" style="color: {fm.primaryColor}4D;"></i>
    <div class="font-display font-bold tracking-widest text-lg mb-1.5 uppercase text-textMain">VIDEO SIGNALS OFFLINE</div>
    <div class="text-textMuted text-xs">Future feature currently in development.</div>
  </div>
{:else if fm.isLoading}
  <LoadingScreen progressPercent={fm.progressPercent} primaryColor={fm.primaryColor} statusMessage={fm.statusMessage} />
{:else}
  <div class="flex-1 overflow-y-auto w-full relative" bind:this={scrollContainer} onscroll={handleScroll}>
    {#if fm.displayList.length === 0}
      <div class="flex items-center justify-center h-full min-h-[300px] text-textSubtle font-bold tracking-widest text-sm uppercase">NO SIGNALS FOUND</div>
    {:else}
      {#if fm.tabIndex === 0}
        <StoryBar allArticles={fm.allArticles} viewedStoryLinks={fm.viewedStoryLinks} onStoryViewed={fm.markStoryViewed} primaryColor={fm.primaryColor} />
      {/if}

      <main class="max-w-[1754px] mx-auto py-6 px-4 md:px-6">
        <div class="flex gap-8 w-full items-start">
          <!-- Feed Grid Layer (Mobile & Desktop) -->
          <FeedGrid {fm} />

          <!-- Desktop Sidebar Layer -->
          <aside class="hidden md:flex w-72 xl:w-80 flex-shrink-0 flex-col sticky top-6">
            <div class="bg-appSurface border border-borderSubtle rounded-2xl p-6 flex flex-col shadow-sm">
              <SettingsControls {fm} {onShowSources} {onShowAbout} {onShowGitHub} {onCustomColor} />
            </div>
          </aside>
        </div>
      </main>
    {/if}
  </div>
{/if}