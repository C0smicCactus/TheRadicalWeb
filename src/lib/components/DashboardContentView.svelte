<script>
  import StoryBar from '$lib/components/StoryBar.svelte';
  import ArticleTile from '$lib/components/ArticleTile.svelte';

  let {
    tabIndex, visibleCount, totalSources, completedSources,
    isLoading, isLoadingMore, showLoadMoreButton, width,
    primaryColor, displayList, allArticles, viewedStoryLinks,
    onStoryViewed, onArticleOpen, statusMessage, onRefresh, onLoadMore,
    appTopics, themeChoices, onThemeChanged, extendedMode, onExtendedModeChanged,
    activeFilter, onFilterChanged, onShowSources, onShowAbout, onShowGitHub,
    onResetFeed, onCustomColor
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
  <div class="flex-1 flex flex-col items-center justify-center p-8">
    <i class="fa-solid fa-video-slash text-4xl mb-5" style="color: {primaryColor}4D;"></i>
    <div class="font-display font-bold tracking-widest text-lg mb-1.5 uppercase text-textMain">VIDEO SIGNALS OFFLINE</div>
    <div class="text-textMuted text-xs">Future feature currently in development.</div>
  </div>
{:else if isLoading}
  <!-- Initial Load Progress State -->
  <div class="flex-1 flex flex-col items-center justify-center p-8">
    <div
      class="w-12 h-12 border-4 rounded-full animate-spin mb-6"
      style="border-color: {primaryColor}; border-top-color: transparent;"
    ></div>
    <div class="font-display text-3xl font-bold text-textMain">{progressPercent}%</div>
    <div class="text-[10px] font-black tracking-widest mt-2.5 mb-5 uppercase" style="color: {primaryColor};">
      RECEIVING SIGNALS...
    </div>
    <div class="text-textSubtle text-[9px] font-bold tracking-wider uppercase max-w-[400px] text-center">
      {statusMessage}
    </div>
  </div>
{:else}
  <!-- Main Dashboard View -->
  <div class="flex-1 overflow-y-auto w-full relative" bind:this={scrollContainer} onscroll={handleScroll}>
    {#if displayList.length === 0}
      <div class="flex items-center justify-center h-full min-h-[300px] text-textSubtle font-bold tracking-widest text-sm uppercase">
        NO SIGNALS FOUND
      </div>
    {:else}
      <!-- Story Bar spanning the top -->
      {#if tabIndex === 0}
        <StoryBar {allArticles} {viewedStoryLinks} {onStoryViewed} {primaryColor} />
      {/if}

      <main class="max-w-[1754px] mx-auto py-6 px-4 md:px-6">
        
        <!-- Mobile view (Grid of 4:5 cards, hidden on md) -->
        <div class="md:hidden flex flex-wrap justify-center gap-6 w-full">
          {#each displayList.slice(0, visibleCount) as article (article.link)}
            <ArticleTile {article} {primaryColor} {onArticleOpen} variant="mobile" />
          {/each}
        </div>

        <!-- Desktop view (Content + Sidebar layout) -->
        <div class="hidden md:flex gap-8 w-full items-start">
          
          <!-- Left Column (Content feed) -->
          <div class="flex-1 flex flex-col gap-8">
            <!-- Hero Article -->
            {#if displayList.length > 0}
              <ArticleTile article={displayList[0]} {primaryColor} {onArticleOpen} variant="hero" />
            {/if}
            
            <!-- Grid of remaining articles -->
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {#each displayList.slice(1, visibleCount) as article (article.link)}
                <ArticleTile {article} {primaryColor} {onArticleOpen} variant="desktop" />
              {/each}
            </div>
            
            <!-- Load More Fallback Button -->
            {#if showLoadMoreButton && displayList.length > visibleCount}
              <div class="mt-8 mb-4 w-full flex justify-center">
                <button onclick={onLoadMore} class="flex items-center px-8 py-3 bg-textMain text-appBackground font-bold text-xs tracking-widest uppercase rounded shadow-lg transition-transform hover:scale-105 border border-borderSubtle">
                  <i class="fa-solid fa-rotate mr-2.5" style="color: {primaryColor};"></i> LOAD MORE
                </button>
              </div>
            {/if}

            <!-- Loading More Spinner -->
            {#if isLoadingMore}
              <div class="p-6 w-full flex justify-center">
                <div class="w-6 h-6 border-2 rounded-full animate-spin" style="border-color: {primaryColor}99; border-top-color: transparent;"></div>
              </div>
            {/if}
          </div>

          <!-- Right Column (Desktop Sidebar Controls) -->
          <aside class="w-72 xl:w-80 flex-shrink-0 flex flex-col gap-6 sticky top-6">
            <div class="bg-appSurface border border-borderSubtle rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
              
              <!-- Extended Mode -->
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-textMain">EXTENDED COVERAGE</div>
                  <div class="text-[10px] text-textMuted">Include broader independent sources.</div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={extendedMode} onchange={(e) => onExtendedModeChanged(/** @type {HTMLInputElement} */ (e.currentTarget).checked)} class="sr-only peer">
                  <div class="w-9 h-5 bg-highlightOverlay border border-borderSubtle rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" style="background-color: {extendedMode ? primaryColor : ''}"></div>
                </label>
              </div>
              <hr class="border-borderSubtle" />

              <!-- Topic Filters -->
              <div>
                <div class="text-[10px] text-textSubtle font-bold tracking-wider mb-3 uppercase">TOPIC FILTERS</div>
                <div class="flex flex-col gap-2">
                  {#each ["ALL", ...appTopics.map(t => t.name)] as filterName}
                    <button
                      onclick={() => onFilterChanged(filterName)}
                      class="w-full text-left px-3.5 py-2 border transition-colors text-[11px] font-bold uppercase rounded"
                      style="background-color: {activeFilter === filterName ? primaryColor : 'transparent'}; border-color: {activeFilter === filterName ? primaryColor : 'var(--border-subtle)'}; color: {activeFilter === filterName ? '#fff' : 'var(--text-main)'};"
                    >
                      {filterName}
                    </button>
                  {/each}
                </div>
              </div>
              <hr class="border-borderSubtle" />

              <!-- Theme Palette -->
              <div>
                <div class="text-[10px] text-textSubtle font-bold tracking-wider mb-3 uppercase">THEME PALETTE</div>
                <div class="flex flex-wrap gap-2.5">
                  {#each themeChoices as color}
                    <button
                      onclick={() => onThemeChanged(color)}
                      class="w-[35px] h-[35px] border-2 cursor-pointer transition-transform hover:scale-105 rounded"
                      style="background-color: {color}; border-color: {primaryColor === color ? 'var(--text-main)' : 'transparent'};"
                      aria-label="Select theme color {color}"
                    ></button>
                  {/each}
                  <button
                    onclick={onCustomColor}
                    class="w-[35px] h-[35px] border-2 border-borderSubtle cursor-pointer flex items-center justify-center transition-transform hover:scale-105 rounded shadow"
                    style="background: linear-gradient(135deg, #FF5757, #57FFFF, #57FF57, #FF57FF, #FF5757);"
                    title="Custom Color Code"
                  >
                    <i class="fa-solid fa-palette text-white drop-shadow text-xs"></i>
                  </button>
                </div>
              </div>
              <hr class="border-borderSubtle" />

              <!-- Action Links -->
              <div class="flex flex-col gap-2">
                <button onclick={onShowSources} class="w-full flex items-center justify-between p-3 bg-highlightOverlay border border-borderSubtle rounded hover:bg-highlightOverlay transition-colors">
                  <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-textMain uppercase">
                    <i class="fa-solid fa-satellite-dish text-xs" style="color: {primaryColor};"></i><span>SIGNAL SOURCES</span>
                  </div>
                </button>
                <button onclick={onShowAbout} class="w-full flex items-center justify-between p-3 bg-highlightOverlay border border-borderSubtle rounded hover:bg-highlightOverlay transition-colors">
                  <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-textMain uppercase">
                    <i class="fa-solid fa-circle-info text-xs" style="color: {primaryColor};"></i><span>ABOUT PROJECT</span>
                  </div>
                </button>
                <button onclick={onShowGitHub} class="w-full flex items-center justify-between p-3 bg-highlightOverlay border border-borderSubtle rounded hover:bg-highlightOverlay transition-colors">
                  <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-textMain uppercase">
                    <i class="fa-brands fa-github text-xs" style="color: {primaryColor};"></i><span>GITHUB</span>
                  </div>
                </button>
              </div>

            </div>
          </aside>
        </div>

        <!-- Mobile Load More Fallback Button -->
        {#if showLoadMoreButton && displayList.length > visibleCount && tabIndex === 0}
          <div class="md:hidden mt-8 mb-4 w-full flex justify-center">
            <button onclick={onLoadMore} class="flex items-center px-8 py-3 bg-textMain text-appBackground font-bold text-xs tracking-widest uppercase rounded shadow-lg transition-transform hover:scale-105">
              <i class="fa-solid fa-rotate mr-2.5" style="color: {primaryColor};"></i> LOAD MORE
            </button>
          </div>
        {/if}

      </main>
    {/if}
  </div>
{/if}