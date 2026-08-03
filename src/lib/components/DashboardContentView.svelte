<script>
  import StoryBar from '$lib/components/StoryBar.svelte';
  import ArticleTile from '$lib/components/ArticleTile.svelte';

  let {
    tabIndex, visibleCount, totalSources, completedSources,
    isLoading, isLoadingMore, showLoadMoreButton, width,
    primaryColor, displayList, allArticles, viewedStoryLinks,
    onStoryViewed, onArticleOpen, statusMessage, onRefresh, onLoadMore
  } = $props();

  let scrollContainer = $state();

  function handleScroll() {
    if (isLoading || isLoadingMore) return;
    if (!scrollContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    if (scrollHeight - scrollTop - clientHeight < 400 && visibleCount < displayList.length) {
      onLoadMore();
    }
  }

  let progressPercent = $derived(totalSources > 0 ? Math.floor((completedSources / totalSources) * 100) : 0);
</script>

{#if tabIndex === 1}
  <!-- Videos Tab Placeholder -->
  <div class="flex-1 flex flex-col items-center justify-center p-8 select-none">
    <i class="fa-solid fa-video-slash text-4xl mb-5" style="color: {primaryColor}4D;"></i>
    <div class="font-display font-bold tracking-widest text-lg mb-1.5 uppercase">VIDEO SIGNALS OFFLINE</div>
    <div class="text-textMuted text-xs">Future feature currently in development.</div>
  </div>
{:else if isLoading}
  <!-- Initial Load Progress State -->
  <div class="flex-1 flex flex-col items-center justify-center p-8 select-none">
    <div
      class="w-12 h-12 border-4 rounded-full animate-spin mb-6"
      style="border-color: {primaryColor}; border-top-color: transparent;"
    ></div>
    <div class="font-display text-3xl font-bold text-white">{progressPercent}%</div>
    <div class="text-[10px] font-black tracking-widest mt-2.5 mb-5 uppercase" style="color: {primaryColor};">
      RECEIVING SIGNALS...
    </div>
    <div class="text-textSubtle text-[9px] font-bold tracking-wider uppercase max-w-[400px] text-center">
      {statusMessage}
    </div>
  </div>
{:else}
  <!-- Main Dashboard View -->
  <div
    class="flex-1 overflow-y-auto w-full relative"
    bind:this={scrollContainer}
    onscroll={handleScroll}
  >
    {#if displayList.length === 0}
      <div class="flex items-center justify-center h-full min-h-[300px] text-textSubtle font-bold tracking-widest text-sm uppercase">
        NO SIGNALS FOUND
      </div>
    {:else}
      {#if tabIndex === 0}
        <StoryBar
          {allArticles}
          {viewedStoryLinks}
          {onStoryViewed}
          {primaryColor}
        />
      {/if}

      <main class="max-w-[1754px] mx-auto py-6 px-4 flex flex-col items-center">
        <div class="flex flex-wrap justify-center gap-6 w-full">
          {#each displayList.slice(0, visibleCount) as article (article.link)}
            <ArticleTile {article} {primaryColor} {onArticleOpen} />
          {/each}
        </div>

        <!-- Load More Fallback Button -->
        {#if showLoadMoreButton && displayList.length > visibleCount}
          <div class="mt-8 mb-4 w-full flex justify-center">
            <button
              onclick={onLoadMore}
              class="flex items-center px-8 py-3 text-white font-bold text-xs tracking-widest uppercase rounded shadow-lg transition-transform hover:scale-105"
              style="background-color: {primaryColor};"
            >
              <i class="fa-solid fa-rotate mr-2.5"></i> LOAD MORE
            </button>
          </div>
        {/if}

        <!-- Loading More Spinner -->
        {#if isLoadingMore}
          <div class="p-6 w-full flex justify-center">
            <div
              class="w-6 h-6 border-2 rounded-full animate-spin"
              style="border-color: {primaryColor}99; border-top-color: transparent;"
            ></div>
          </div>
        {/if}
      </main>
    {/if}
  </div>
{/if}
