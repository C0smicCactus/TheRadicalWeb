<script>
  import ArticleTile from '$lib/components/article/ArticleTile.svelte';
  let { fm } = $props();
</script>

<div class="flex-1 flex flex-col gap-8 w-full min-w-0">
  
  <!-- Mobile View (Hidden on MD) -->
  <div class="md:hidden flex flex-wrap justify-center gap-6 w-full">
    {#each fm.displayList.slice(0, fm.visibleCount) as article (article.link)}
      <ArticleTile {article} primaryColor={fm.primaryColor} topicsEnabled={fm.topicsEnabled} variant="mobile" />
    {/each}
  </div>

  <!-- Desktop View (Hidden on Mobile) -->
  <div class="hidden md:flex flex-col gap-8 w-full">
    {#if fm.displayList.length > 0}
      <ArticleTile article={fm.displayList[0]} primaryColor={fm.primaryColor} topicsEnabled={fm.topicsEnabled} variant="hero" />
    {/if}
    
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {#each fm.displayList.slice(1, fm.visibleCount) as article (article.link)}
        <ArticleTile {article} primaryColor={fm.primaryColor} topicsEnabled={fm.topicsEnabled} variant="desktop" />
      {/each}
    </div>
  </div>

  <!-- Loading Spinners & Buttons -->
  {#if fm.showLoadMoreButton && fm.displayList.length > fm.visibleCount}
    <div class="mt-8 mb-4 w-full flex justify-center">
      <button onclick={fm.loadMoreArticles} class="flex items-center px-8 py-3 bg-textMain text-appBackground font-bold text-xs tracking-widest uppercase rounded shadow-lg transition-transform hover:scale-105 border border-borderSubtle">
        <i class="fa-solid fa-rotate mr-2.5" style="color: {fm.primaryColor};"></i> LOAD MORE
      </button>
    </div>
  {/if}
  
  {#if fm.isLoadingMore}
    <div class="p-6 w-full flex justify-center">
      <div class="w-6 h-6 border-2 rounded-full animate-spin" style="border-color: {fm.primaryColor}99; border-top-color: transparent;"></div>
    </div>
  {/if}

</div>