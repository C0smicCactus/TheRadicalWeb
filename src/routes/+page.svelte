<script>
  import { onMount } from 'svelte';
  import { appFeeds } from '$lib/core/appFeeds.js';
  import { networkConfig } from '$lib/core/networkConfig.js';
  import { feedParser } from '$lib/services/feedParser.js';
  import { appColors } from '$lib/core/appColors.js';
  import { appTopics } from '$lib/core/appTopics.js';
  import { appUtils } from '$lib/core/appUtils.js';
  import { Article } from '$lib/models/Article.js';

  import DashboardHeader from '$lib/components/DashboardHeader.svelte';
  import DashboardDrawer from '$lib/components/DashboardDrawer.svelte';
  import DashboardContentView from '$lib/components/DashboardContentView.svelte';
  import SourcesDialog from '$lib/components/dialogs/SourcesDialog.svelte';
  import AboutDialog from '$lib/components/dialogs/AboutDialog.svelte';
  import CustomColorDialog from '$lib/components/dialogs/CustomColorDialog.svelte';

  let primaryColor = $state(appColors.themeChoices[0]);
  let innerWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1200);
  let isDark = $state(true);

  // App State
  let allArticles = $state([]);
  let displayList = $state([]);
  let viewedStoryMap = $state({});
  let viewedStoryLinks = $derived(new Set(Object.keys(viewedStoryMap)));
  let visibleCount = $state(networkConfig.articlesPerPage);
  let tabIndex = $state(0);
  let totalSources = $state(0);
  let completedSources = $state(0);
  let isLoading = $state(true);
  let isLoadingMore = $state(false);
  let showLoadMoreButton = $state(false);
  let statusMessage = $state("Ready");

  // Filter & Configuration State
  let extendedMode = $state(false);
  let allSourcesEnabled = $state(true);
  let enabledSources = $state(new Set());
  let activeFilter = $state("ALL");
  let searchQuery = $state("");

  // Dialog Controls
  let drawerOpen = $state(false);
  let sourcesDialogOpen = $state(false);
  let aboutDialogOpen = $state(false);
  let customColorDialogOpen = $state(false);

  async function bootSequence() {
    try {
      if (localStorage.getItem('theme') === 'light' || (!('theme' in localStorage) && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        isDark = false;
      } else {
        isDark = true;
      }

      const colorVal = localStorage.getItem('theme_color');
      if (colorVal) primaryColor = colorVal;

      extendedMode = localStorage.getItem('extended_coverage') === 'true';
      allSourcesEnabled = localStorage.getItem('all_sources_enabled') !== 'false';

      const savedSources = localStorage.getItem('enabled_sources');
      if (savedSources) {
        enabledSources = new Set(JSON.parse(savedSources));
      } else {
        enabledSources = new Set([
          ...Object.values(appFeeds.coreSources),
          ...Object.values(appFeeds.globalSources)
        ]);
      }

      const viewedStr = localStorage.getItem(networkConfig.viewedStoriesKey);
      if (viewedStr) {
        try {
          const parsed = JSON.parse(viewedStr);
          cleanupOldStories(parsed);
        } catch (_) {}
      }

      const cachedStr = localStorage.getItem(networkConfig.offlineCacheKey);
      if (cachedStr) {
        try {
          const decoded = JSON.parse(cachedStr);
          allArticles = decoded.map(m => Article.fromMap(m));
          isLoading = false;
          applyLogic();
        } catch (_) {}
      }
    } catch (_) {}
    fetchNews(allArticles.length > 0);
  }

  function toggleTheme() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  function cleanupOldStories(mapData) {
    const now = new Date();
    let changed = false;
    const cleanMap = {};
    for (const [link, ts] of Object.entries(mapData)) {
      const date = new Date(ts);
      if ((now.getTime() - date.getTime()) / (1000 * 60 * 60) <= networkConfig.maxViewedStoryAgeHours) {
        cleanMap[link] = ts;
      } else {
        changed = true;
      }
    }
    viewedStoryMap = cleanMap;
    if (changed) persistViewedStories(cleanMap);
  }

  const debouncedPersist = appUtils.debounce((data) => {
    localStorage.setItem(networkConfig.viewedStoriesKey, JSON.stringify(data));
  }, 1500);

  function persistViewedStories(mapData = viewedStoryMap) {
    debouncedPersist(mapData);
  }

  function markStoryViewed(link) {
    if (!viewedStoryMap[link]) {
      viewedStoryMap = { ...viewedStoryMap, [link]: new Date().toISOString() };
      persistViewedStories();
    }
  }

  async function fetchNews(isBackground = false) {
    const sources = { ...appFeeds.coreSources, ...appFeeds.globalSources };
    if (extendedMode) Object.assign(sources, appFeeds.extendedSources);

    if (!allSourcesEnabled) {
      for (const [url, name] of Object.entries(sources)) {
        if (!enabledSources.has(name)) delete sources[url];
      }
    }

    if (!isBackground) {
      isLoading = true;
      totalSources = Object.keys(sources).length;
      completedSources = 0;
      statusMessage = "Fetching...";
    }

    const freshBatch = [];
    const entries = Object.entries(sources);

    const fetchPromises = entries.map(async ([url, name]) => {
      let text = '';
      let ok = false;
      let usedProxy = '';

      const maxAttempts = Math.min(networkConfig.maxProxyAttemptsPerFeed, networkConfig.corsProxies.length);

      for (let attempt = 0; attempt < maxAttempts && !ok; attempt++) {
        try {
          const fetchUrl = networkConfig.wrapCorsProxy(url, attempt);
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), networkConfig.feedFetchTimeoutMs);
          const res = await fetch(fetchUrl, { signal: controller.signal });
          clearTimeout(id);

          if (res.ok) {
            const resText = await res.text();
            if (resText.startsWith('{') && resText.includes('"contents":')) {
              const parsedJson = JSON.parse(resText);
              text = parsedJson.contents || resText;
            } else {
              text = resText;
            }
            ok = true;
            usedProxy = networkConfig.getProxyName(attempt);
          }
        } catch (_) {}
      }

      if (ok && text) {
        const parsed = feedParser.parse(text, name, networkConfig.maxArticlesPerFeed);
        freshBatch.push(...parsed);
      }

      completedSources++;
    });

    const globalTimeout = networkConfig.globalFetchTimeoutMs;
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), globalTimeout));

    const allDone = await Promise.race([
      Promise.all(fetchPromises).then(() => true),
      timeoutPromise
    ]);

    if (!allDone && !isBackground) {
      statusMessage = allArticles.length > 0
        ? `Timeout - showing ${allArticles.length} cached articles`
        : "Timeout - showing available content";
    }

    processFetchedArticles(freshBatch);
  }

  function processFetchedArticles(freshBatch) {
    const deduplicated = new Map();
    for (const a of allArticles) deduplicated.set(a.link.toLowerCase(), a);
    for (const a of freshBatch) deduplicated.set(a.link.toLowerCase(), a);

    allArticles = Array.from(deduplicated.values()).sort((a, b) => b.parsedDate - a.parsedDate);
    isLoading = false;
    applyLogic();
    saveToCache();
  }

  function applyLogic() {
    let filtered = allArticles;

    if (activeFilter !== "ALL") {
      filtered = filtered.filter(a => a.topics.includes(activeFilter));
    }

    if (!extendedMode) {
      const extendedNames = new Set(Object.values(appFeeds.extendedSources));
      filtered = filtered.filter(a => !extendedNames.has(a.source));
    }

    if (!allSourcesEnabled) {
      filtered = filtered.filter(a => enabledSources.has(a.source));
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q)
      );
    }

    displayList = filtered;
    visibleCount = networkConfig.articlesPerPage;
    showLoadMoreButton = false;
  }

  const debouncedSaveCache = appUtils.debounce((data) => {
    try {
      localStorage.setItem(networkConfig.offlineCacheKey, JSON.stringify(data));
    } catch (_) {}
  }, 2000);

  function saveToCache() {
    debouncedSaveCache(allArticles.slice(0, networkConfig.maxCachedArticles).map(a => a.toMap()));
  }

  function loadMoreArticles() {
    if (isLoadingMore || visibleCount >= displayList.length) return;
    isLoadingMore = true;
    showLoadMoreButton = false;
    setTimeout(() => {
      visibleCount = Math.min(visibleCount + networkConfig.articlesPerPage, displayList.length);
      isLoadingMore = false;
      if (visibleCount < displayList.length) showLoadMoreButton = true;
    }, 300);
  }

  function resetFeed() {
    localStorage.removeItem(networkConfig.offlineCacheKey);
    localStorage.removeItem(networkConfig.viewedStoriesKey);
    allArticles = [];
    displayList = [];
    viewedStoryMap = {};
    visibleCount = networkConfig.articlesPerPage;
    isLoading = true;
    totalSources = 0;
    completedSources = 0;
    statusMessage = "Resetting...";
    fetchNews();
  }

  function updateTheme(color) {
    primaryColor = color;
    localStorage.setItem('theme_color', color);
  }

  onMount(() => {
    bootSequence();
  });
</script>

<svelte:window bind:innerWidth />

<div class="flex flex-col h-screen overflow-hidden bg-appBackground text-textMain">
  <!-- Header Bar -->
  <DashboardHeader
    width={innerWidth}
    {primaryColor}
    {isDark}
    onToggleTheme={toggleTheme}
    bind:searchQuery
    onSearchChanged={() => applyLogic()}
    onLogoTap={() => { activeFilter = "ALL"; searchQuery = ""; applyLogic(); }}
    onOpenSettings={() => drawerOpen = true}
  />

  <!-- Main Content Area -->
  <DashboardContentView
    {tabIndex}
    {visibleCount}
    {totalSources}
    {completedSources}
    {isLoading}
    {isLoadingMore}
    {showLoadMoreButton}
    width={innerWidth}
    {primaryColor}
    {displayList}
    {allArticles}
    {viewedStoryLinks}
    onStoryViewed={markStoryViewed}
    onArticleOpen={async () => {}}
    {statusMessage}
    onRefresh={() => fetchNews()}
    onLoadMore={loadMoreArticles}
    appTopics={appTopics}
    themeChoices={appColors.themeChoices}
    onThemeChanged={updateTheme}
    extendedMode={extendedMode}
    onExtendedModeChanged={(v) => { extendedMode = v; localStorage.setItem('extended_coverage', v); applyLogic(); if (v) fetchNews(); }}
    activeFilter={activeFilter}
    onFilterChanged={(f) => { activeFilter = f; applyLogic(); drawerOpen = false; }}
    onShowSources={() => { drawerOpen = false; sourcesDialogOpen = true; }}
    onShowAbout={() => { drawerOpen = false; aboutDialogOpen = true; }}
    onShowGitHub={() => { window.open('https://github.com/C0smicCactus/TheRadicalWeb', '_blank', 'noopener,noreferrer'); }}
    onResetFeed={resetFeed}
    onCustomColor={() => customColorDialogOpen = true}
  />

  <!-- Bottom Navigation Bar (Hidden on Desktop) -->
  <nav class="md:hidden flex items-center justify-around bg-appBackground border-t border-borderSubtle py-2.5 z-20 select-none">
    <button
      class="flex flex-col items-center cursor-pointer px-6 py-1 transition-colors outline-none"
      style="color: {tabIndex === 0 ? primaryColor : 'var(--text-subtle)'}"
      onclick={() => tabIndex = 0}
    >
      <i class="fa-solid fa-house text-base mb-1"></i>
      <span class="text-[10px] font-bold tracking-wider">Home</span>
    </button>
    <button
      class="flex flex-col items-center cursor-pointer px-6 py-1 transition-colors outline-none"
      style="color: {tabIndex === 1 ? primaryColor : 'var(--text-subtle)'}"
      onclick={() => tabIndex = 1}
    >
      <i class="fa-solid fa-play text-base mb-1"></i>
      <span class="text-[10px] font-bold tracking-wider">Videos</span>
    </button>
  </nav>
</div>

<!-- Drawer & Dialog Modals -->
{#if drawerOpen}
  <DashboardDrawer
    {primaryColor}
    onThemeChanged={updateTheme}
    {extendedMode}
    onExtendedModeChanged={(v) => { extendedMode = v; localStorage.setItem('extended_coverage', v); applyLogic(); if (v) fetchNews(); }}
    {activeFilter}
    onFilterChanged={(f) => { activeFilter = f; applyLogic(); drawerOpen = false; }}
    onShowSources={() => { drawerOpen = false; sourcesDialogOpen = true; }}
    onShowAbout={() => { drawerOpen = false; aboutDialogOpen = true; }}
    onShowGitHub={() => { window.open('https://github.com/C0smicCactus/TheRadicalWeb', '_blank', 'noopener,noreferrer'); }}
    onResetFeed={resetFeed}
    onCustomColor={() => { drawerOpen = false; customColorDialogOpen = true; }}
    onClose={() => drawerOpen = false}
  />
{/if}

{#if sourcesDialogOpen}
  <SourcesDialog
    {primaryColor}
    {extendedMode}
    {allSourcesEnabled}
    {enabledSources}
    onSaved={(all, set) => {
      allSourcesEnabled = all;
      enabledSources = set;
      localStorage.setItem('all_sources_enabled', all);
      localStorage.setItem('enabled_sources', JSON.stringify(Array.from(set)));
      applyLogic();
      fetchNews();
    }}
    onClose={() => sourcesDialogOpen = false}
  />
{/if}

{#if aboutDialogOpen}
  <AboutDialog {primaryColor} onClose={() => aboutDialogOpen = false} />
{/if}

{#if customColorDialogOpen}
  <CustomColorDialog
    currentColor={primaryColor}
    onColorSelected={(newColor) => updateTheme(newColor)}
    onClose={() => customColorDialogOpen = false}
  />
{/if}