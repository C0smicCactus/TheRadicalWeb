<script>
  import StoryViewer from '$lib/components/story/StoryViewer.svelte';

  let { allArticles, viewedStoryLinks, onStoryViewed, primaryColor } = $props();

  function buildEntries() {
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
  }

  let finalEntries = $derived(buildEntries());

  let activeStoryData = $state(null);
  let activeEntryIndex = $state(-1);
  let storyEntriesSnapshot = $state([]);

  function handleStoryComplete() {
    const nextIndex = storyEntriesSnapshot.findIndex(
      (entry, i) => i > activeEntryIndex && !entry.isFullyViewed
    );

    if (nextIndex !== -1) {
      const nextEntry = storyEntriesSnapshot[nextIndex];
      activeEntryIndex = nextIndex;
      const startIndex = Math.max(0, nextEntry.stories.findIndex(a => !viewedStoryLinks.has(a.link)));
      activeStoryData = { articles: nextEntry.stories, sourceName: nextEntry.source, initialIndex: startIndex };
    } else {
      handleStoryClose();
    }
  }

  function handleStoryClose() {
    activeStoryData = null;
    activeEntryIndex = -1;
    storyEntriesSnapshot = [];
  }
</script>

{#if finalEntries.length > 0}
  <div class="w-full border-b border-borderSubtle flex justify-center bg-appBackground shadow-sm z-10">
    <div class="max-w-[1754px] w-full h-[135px] overflow-x-auto px-6 py-3 flex space-x-5 items-center scrollbar-none">
      {#each finalEntries as entry (entry.source)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="flex flex-col items-center cursor-pointer min-w-[80px]"
          onclick={() => {
            const entryIndex = finalEntries.findIndex(e => e.source === entry.source);
            activeEntryIndex = entryIndex;
            storyEntriesSnapshot = finalEntries;
            let startIndex = entry.stories.findIndex(a => !viewedStoryLinks.has(a.link));
            if (startIndex === -1) startIndex = 0;
            activeStoryData = { articles: entry.stories, sourceName: entry.source, initialIndex: startIndex };
          }}
        >
          <div
            class="p-[3px] rounded-full border-2 transition-all"
            style="border-color: {entry.isFullyViewed ? 'var(--border-subtle)' : primaryColor};"
          >
            <div
              class="w-16 h-16 rounded-full bg-tileBackground flex items-center justify-center transition-opacity border border-borderSubtle"
              style="opacity: {entry.isFullyViewed ? 0.6 : 1};"
            >
              <span
                class="font-black text-lg uppercase"
                style="color: {entry.isFullyViewed ? 'var(--text-subtle)' : primaryColor};"
              >
                {entry.source.substring(0, entry.source.length > 2 ? 2 : 1)}
              </span>
            </div>
          </div>
          <div
            class="mt-2 w-20 text-center truncate text-[9px] font-bold"
            style="color: {entry.isFullyViewed ? 'var(--text-subtle)' : 'var(--text-main)'};"
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
    onComplete={handleStoryComplete}
    onClose={handleStoryClose}
  />
{/if}