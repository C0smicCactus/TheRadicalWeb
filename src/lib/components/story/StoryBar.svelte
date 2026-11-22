<script lang="ts">
  import { asset } from '$app/paths';
  import { feeds } from '#lib/config/feeds.js';
  import StoryViewer from '#lib/components/story/StoryViewer.svelte';
  import type { Article } from '#lib/models/Article.js';

  interface Props {
    allArticles: Article[];
    viewedStoryLinks: Set<string>;
    onStoryViewed: (link: string) => void;
    primaryColor: string;
  }

  /** One publisher's stories from the last 24 hours */
  interface StoryEntry {
    source: string;
    stories: Article[];
    isFullyViewed: boolean;
  }

  interface ActiveStory {
    articles: Article[];
    sourceName: string;
    initialIndex: number;
  }

  let { allArticles, viewedStoryLinks, onStoryViewed, primaryColor }: Props = $props();

  function buildEntries(): StoryEntry[] {
    const now = new Date();
    const storyMap = new Map<string, Article[]>();

    for (const article of allArticles) {
      const articleDate = article.parsedDate instanceof Date ? article.parsedDate : new Date(article.parsedDate);
      if ((now.getTime() - articleDate.getTime()) / (1000 * 60 * 60) < 24) {
        let stories = storyMap.get(article.source);
        if (!stories) {
          stories = [];
          storyMap.set(article.source, stories);
        }
        stories.push(article);
      }
    }

    const unviewed: StoryEntry[] = [];
    const viewed: StoryEntry[] = [];

    for (const [source, stories] of storyMap.entries()) {
      const isFullyViewed = stories.every(a => viewedStoryLinks.has(a.link));
      const entry = { source, stories, isFullyViewed };
      if (isFullyViewed) viewed.push(entry);
      else unviewed.push(entry);
    }

    unviewed.sort((a, b) => b.stories[0].parsedDate.getTime() - a.stories[0].parsedDate.getTime());
    viewed.sort((a, b) => b.stories[0].parsedDate.getTime() - a.stories[0].parsedDate.getTime());

    return [...unviewed, ...viewed];
  }

  let finalEntries = $derived(buildEntries());

  let activeStoryData = $state<ActiveStory | null>(null);
  let activeEntryIndex = $state(-1);
  let storyEntriesSnapshot = $state<StoryEntry[]>([]);

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
  <div class="w-full border-b border-borderSubtle flex justify-center bg-appBackground shadow-xs z-10">
    <div class="max-w-[1754px] w-full h-[135px] overflow-x-auto pointer-coarse:scrollbar-none px-6 py-3 flex space-x-5 items-center">
      {#each finalEntries as entry (entry.source)}
        {@const logo = feeds.publisherLogos[entry.source]}
        <button
          class="flex flex-col items-center cursor-pointer min-w-[80px] bg-transparent border-none p-0 outline-hidden hover:opacity-80 transition-opacity"
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
            class="p-[3px] rounded-full border-2 transition-all flex items-center justify-center"
            style="border-color: {entry.isFullyViewed ? 'var(--border-subtle)' : primaryColor};"
          >
            <div
              class="relative w-16 h-16 rounded-full bg-tileBackground flex items-center justify-center overflow-hidden transition-opacity border border-borderSubtle shrink-0"
              style="opacity: {entry.isFullyViewed ? 0.6 : 1};"
            >
              <!-- Fallback Initials (sits on z-0 behind the image) -->
              <span
                class="absolute font-black text-lg uppercase z-0"
                style="color: {entry.isFullyViewed ? 'var(--text-subtle)' : primaryColor};"
              >
                {entry.source.substring(0, entry.source.length > 2 ? 2 : 1)}
              </span>

              <!-- Actual Logo Image (Only rendered if mapped in feeds.ts) -->
              {#if logo}
                <img
                  src={asset(`logos/${logo}`)}
                  alt="{entry.source}"
                  class="relative w-full h-full object-cover object-center z-10 bg-appSurface"
                  onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              {/if}
            </div>
          </div>
          <div
            class="mt-2 w-20 text-center truncate text-[9px] font-bold"
            style="color: {entry.isFullyViewed ? 'var(--text-subtle)' : 'var(--text-main)'};"
          >
            {entry.source}
          </div>
        </button>
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