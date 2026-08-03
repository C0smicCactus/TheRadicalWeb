<script>
  import { appColors } from '$lib/core/appColors.js';
  import StoryViewer from '$lib/components/StoryViewer.svelte';

  let { allArticles, viewedStoryLinks, onStoryViewed, primaryColor } = $props();

  let finalEntries = $derived.by(() => {
    const now = new Date();
    const storyMap = new Map();

    for (const article of allArticles) {
      const articleDate = article.parsedDate instanceof Date ? article.parsedDate : new Date(article.parsedDate);
      if ((now.getTime() - articleDate.getTime()) / (1000 * 60 * 60) < 24) {
        if (!storyMap.has(article.source)) storyMap.set(article.source, []);
        storyMap.get(article.source).push(article);
      }
    }

    const unviewed = [];
    const viewed = [];

    for (const [source, stories] of storyMap.entries()) {
      const isFullyViewed = stories.every(a => viewedStoryLinks.has(a.link));
      const entry = { source, stories, isFullyViewed };
      if (isFullyViewed) viewed.push(entry);
      else unviewed.push(entry);
    }

    unviewed.sort((a, b) => b.stories[0].parsedDate - a.stories[0].parsedDate);
    viewed.sort((a, b) => b.stories[0].parsedDate - a.stories[0].parsedDate);

    return [...unviewed, ...viewed];
  });

  let activeStoryData = $state(null);
</script>

{#if finalEntries.length > 0}
  <div class="w-full border-b border-borderSubtle flex justify-center bg-appBackground select-none">
    <div class="max-w-[1754px] w-full h-[135px] overflow-x-auto px-6 py-3 flex space-x-5 items-center scrollbar-none">
      {#each finalEntries as entry (entry.source)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="flex flex-col items-center cursor-pointer min-w-[80px]"
          onclick={() => {
            let startIndex = entry.stories.findIndex(a => !viewedStoryLinks.has(a.link));
            if (startIndex === -1) startIndex = 0;
            activeStoryData = { articles: entry.stories, sourceName: entry.source, initialIndex: startIndex };
          }}
        >
          <div
            class="p-[3px] rounded-full border-2 transition-all"
            style="border-color: {entry.isFullyViewed ? 'rgba(255,255,255,0.24)' : primaryColor};"
          >
            <div
              class="w-16 h-16 rounded-full bg-tileBackground flex items-center justify-center transition-opacity"
              style="opacity: {entry.isFullyViewed ? 0.5 : 1};"
            >
              <span
                class="font-black text-lg uppercase"
                style="color: {entry.isFullyViewed ? 'rgba(255,255,255,0.38)' : primaryColor};"
              >
                {entry.source.substring(0, entry.source.length > 2 ? 2 : 1)}
              </span>
            </div>
          </div>
          <div
            class="mt-2 w-20 text-center truncate text-[9px] font-bold"
            style="color: {entry.isFullyViewed ? appColors.textSubtle : appColors.textMuted};"
          >
            {entry.source}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if activeStoryData}
  <StoryViewer
    articles={activeStoryData.articles}
    initialIndex={activeStoryData.initialIndex}
    sourceName={activeStoryData.sourceName}
    {primaryColor}
    {onStoryViewed}
    onClose={() => activeStoryData = null}
  />
{/if}
