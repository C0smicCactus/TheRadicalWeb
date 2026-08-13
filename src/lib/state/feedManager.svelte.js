import { appFeeds } from '$lib/config/appFeeds.js';
import { networkConfig } from '$lib/config/networkConfig.js';
import { feedParser } from '$lib/services/feedParser.js';
import { appColors } from '$lib/config/appColors.js';
import { appUtils } from '$lib/utils/appUtils.js';
import { Article } from '$lib/models/Article.js';

export class FeedManager {
  // App State
  primaryColor = $state(appColors.themeChoices[0]);
  isDark = $state(true);
  allArticles = $state([]);
  displayList = $state([]);
  viewedStoryMap = $state({});
  visibleCount = $state(networkConfig.articlesPerPage);
  tabIndex = $state(0);
  totalSources = $state(0);
  completedSources = $state(0);
  isLoading = $state(true);
  isLoadingMore = $state(false);
  showLoadMoreButton = $state(false);
  statusMessage = $state("Ready");

  // Configuration State
  extendedMode = $state(false);
  topicsEnabled = $state(false);
  allSourcesEnabled = $state(true);
  enabledSources = $state(new Set());
  activeFilter = $state("ALL");
  searchQuery = $state("");

  // Derived Properties
  get viewedStoryLinks() {
    return new Set(Object.keys(this.viewedStoryMap));
  }

  get progressPercent() {
    return this.totalSources > 0 ? Math.floor((this.completedSources / this.totalSources) * 100) : 0;
  }

  // Debounced Caching
  debouncedPersist = appUtils.debounce((data) => {
    localStorage.setItem(networkConfig.viewedStoriesKey, JSON.stringify(data));
  }, 1500);

  debouncedSaveCache = appUtils.debounce((data) => {
    try {
      localStorage.setItem(networkConfig.offlineCacheKey, JSON.stringify(data));
    } catch (_) {}
  }, 2000);

  // Core Methods
  bootSequence = async () => {
    try {
      if (localStorage.getItem('theme') === 'light' || (!('theme' in localStorage) && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        this.isDark = false;
      } else {
        this.isDark = true;
      }

      const colorVal = localStorage.getItem('theme_color');
      if (colorVal) this.primaryColor = colorVal;

      this.extendedMode = localStorage.getItem('extended_coverage') === 'true';
      this.topicsEnabled = localStorage.getItem('topics_enabled') === 'true';
      this.allSourcesEnabled = localStorage.getItem('all_sources_enabled') !== 'false';

      const savedSources = localStorage.getItem('enabled_sources');
      if (savedSources) {
        this.enabledSources = new Set(JSON.parse(savedSources));
      } else {
        this.enabledSources = new Set([
          ...Object.values(appFeeds.coreSources),
          ...Object.values(appFeeds.globalSources)
        ]);
      }

      const viewedStr = localStorage.getItem(networkConfig.viewedStoriesKey);
      if (viewedStr) {
        try {
          const parsed = JSON.parse(viewedStr);
          this.cleanupOldStories(parsed);
        } catch (_) {}
      }

      const cachedStr = localStorage.getItem(networkConfig.offlineCacheKey);
      if (cachedStr) {
        try {
          const decoded = JSON.parse(cachedStr);
          this.allArticles = decoded.map(m => Article.fromMap(m));
          this.isLoading = false;
          this.applyLogic();
        } catch (_) {}
      }
    } catch (_) {}
    
    this.fetchNews(this.allArticles.length > 0);
  }

  toggleTheme = () => {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  cleanupOldStories = (mapData) => {
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
    this.viewedStoryMap = cleanMap;
    if (changed) this.persistViewedStories(cleanMap);
  }

  persistViewedStories = (mapData = this.viewedStoryMap) => {
    this.debouncedPersist(mapData);
  }

  markStoryViewed = (link) => {
    if (!this.viewedStoryMap[link]) {
      this.viewedStoryMap = { ...this.viewedStoryMap, [link]: new Date().toISOString() };
      this.persistViewedStories();
    }
  }

  fetchNews = async (isBackground = false) => {
    const sources = { ...appFeeds.coreSources, ...appFeeds.globalSources };
    if (this.extendedMode) Object.assign(sources, appFeeds.extendedSources);

    if (!this.allSourcesEnabled) {
      for (const [url, name] of Object.entries(sources)) {
        if (!this.enabledSources.has(name)) delete sources[url];
      }
    }

    if (!isBackground) {
      this.isLoading = true;
      this.totalSources = Object.keys(sources).length;
      this.completedSources = 0;
      this.statusMessage = "Fetching...";
    }

    const freshBatch = [];
    const entries = Object.entries(sources);

    const fetchPromises = entries.map(async ([url, name]) => {
      let text = '';
      let ok = false;
      for (let attempt = 0; attempt < networkConfig.maxProxyAttemptsPerFeed && !ok; attempt++) {
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
          }
        } catch (_) {}
      }

      if (ok && text) {
        const parsed = feedParser.parse(text, name, networkConfig.maxArticlesPerFeed);
        freshBatch.push(...parsed);
      }
      this.completedSources++;
    });

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), networkConfig.globalFetchTimeoutMs));
    const allDone = await Promise.race([ Promise.all(fetchPromises).then(() => true), timeoutPromise ]);

    if (!allDone && !isBackground) {
      this.statusMessage = this.allArticles.length > 0
        ? `Timeout - showing ${this.allArticles.length} cached articles`
        : "Timeout - showing available content";
    }

    this.processFetchedArticles(freshBatch);
  }

  processFetchedArticles = (freshBatch) => {
    const deduplicated = new Map();
    for (const a of this.allArticles) deduplicated.set(a.link.toLowerCase(), a);
    for (const a of freshBatch) deduplicated.set(a.link.toLowerCase(), a);

    this.allArticles = Array.from(deduplicated.values()).sort((a, b) => b.parsedDate - a.parsedDate);
    this.isLoading = false;
    this.applyLogic();
    this.saveToCache();
  }

  applyLogic = () => {
    let filtered = this.allArticles;

    if (this.activeFilter !== "ALL") {
      filtered = filtered.filter(a => a.topics.includes(this.activeFilter));
    }
    if (!this.extendedMode) {
      const extendedNames = new Set(Object.values(appFeeds.extendedSources));
      filtered = filtered.filter(a => !extendedNames.has(a.source));
    }
    if (!this.allSourcesEnabled) {
      filtered = filtered.filter(a => this.enabledSources.has(a.source));
    }
    if (this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.source.toLowerCase().includes(q)
      );
    }

    this.displayList = filtered;
    this.visibleCount = networkConfig.articlesPerPage;
    this.showLoadMoreButton = false;
  }

  saveToCache = () => {
    this.debouncedSaveCache(this.allArticles.slice(0, networkConfig.maxCachedArticles).map(a => a.toMap()));
  }

  loadMoreArticles = () => {
    if (this.isLoadingMore || this.visibleCount >= this.displayList.length) return;
    this.isLoadingMore = true;
    this.showLoadMoreButton = false;
    setTimeout(() => {
      this.visibleCount = Math.min(this.visibleCount + networkConfig.articlesPerPage, this.displayList.length);
      this.isLoadingMore = false;
      if (this.visibleCount < this.displayList.length) this.showLoadMoreButton = true;
    }, 300);
  }

  resetFeed = () => {
    localStorage.removeItem(networkConfig.offlineCacheKey);
    localStorage.removeItem(networkConfig.viewedStoriesKey);
    this.allArticles = [];
    this.displayList = [];
    this.viewedStoryMap = {};
    this.visibleCount = networkConfig.articlesPerPage;
    this.isLoading = true;
    this.totalSources = 0;
    this.completedSources = 0;
    this.statusMessage = "Resetting...";
    this.fetchNews();
  }

  // Side-effect Setters
  updateTheme = (color) => {
    this.primaryColor = color;
    localStorage.setItem('theme_color', color);
  }

  setSearchQuery = (q) => {
    this.searchQuery = q;
    this.applyLogic();
  }

  setExtendedMode = (v) => {
    this.extendedMode = v;
    localStorage.setItem('extended_coverage', v);
    this.applyLogic();
    if (v) this.fetchNews();
  }

  setTopicsEnabled = (v) => {
    this.topicsEnabled = v;
    localStorage.setItem('topics_enabled', v);
  }

  setActiveFilter = (f) => {
    this.activeFilter = f;
    this.applyLogic();
  }

  setSourcesEnabled = (all, set) => {
    this.allSourcesEnabled = all;
    this.enabledSources = set;
    localStorage.setItem('all_sources_enabled', all);
    localStorage.setItem('enabled_sources', JSON.stringify(Array.from(set)));
    this.applyLogic();
    this.fetchNews();
  }
}