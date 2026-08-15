import { base } from '$app/paths';
import { appFeeds } from '$lib/config/appFeeds.js';
import { networkConfig } from '$lib/config/networkConfig.js';
import { appColors } from '$lib/config/appColors.js';
import { appUtils } from '$lib/utils/appUtils.js';
import { Article } from '$lib/models/Article.js';

/**
 * FeedManager
 * Handles the core state and data lifecycle for the news aggregator.
 * It manages offline caches, themes, filters, and communication with the pre-compiled server feed.
 */
export class FeedManager {
  // === UI & App State ===
  primaryColor = $state(appColors.themeChoices[0]);
  isDark = $state(true);
  upToDateLink = $state(null);
  
  // === Data State ===
  allArticles = $state([]);
  displayList = $state([]);
  viewedStoryMap = $state({});
  visibleCount = $state(networkConfig.articlesPerPage);
  
  // === Component States ===
  tabIndex = $state(0);
  totalSources = $state(0);
  completedSources = $state(0);
  isLoading = $state(true);
  isLoadingMore = $state(false);
  showLoadMoreButton = $state(false);
  statusMessage = $state("Ready");

  // === Configuration State ===
  extendedMode = $state(false);
  topicsEnabled = $state(false);
  allSourcesEnabled = $state(true);
  enabledSources = $state(new Set());
  activeFilter = $state("ALL");
  searchQuery = $state("");

  // === Derived Properties ===
  get viewedStoryLinks() {
    return new Set(Object.keys(this.viewedStoryMap));
  }

  get progressPercent() {
    return this.totalSources > 0 ? Math.floor((this.completedSources / this.totalSources) * 100) : 0;
  }

  // === Utilities & Caching ===

  /**
   * Persists viewed stories to local storage with a debounce to prevent spamming browser I/O.
   */
  debouncedPersist = appUtils.debounce((data) => {
    localStorage.setItem(networkConfig.viewedStoriesKey, JSON.stringify(data));
  }, 1500);

  /**
   * Persists the current article feed to offline cache.
   */
  debouncedSaveCache = appUtils.debounce((data) => {
    try {
      localStorage.setItem(networkConfig.offlineCacheKey, JSON.stringify(data));
    } catch (_) {}
  }, 2000);

  // === Core Lifecycle Methods ===

  /**
   * Initializes the application state from local storage.
   * Restores user preferences (theme, enabled sources) and loads the offline cache before attempting network fetch.
   */
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

      const savedTopLink = localStorage.getItem('last_session_top_link');
      if (savedTopLink) {
        this.upToDateLink = savedTopLink;
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

  /**
   * Toggles between Dark and Light rendering modes.
   */
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

  /**
   * Cleans up viewed stories older than the maximum age threshold (default 48hrs).
   */
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

  /**
   * Requests the static aggregated JSON feed created server-side to skip browser CORS restrictions.
   */
  fetchNews = async (isBackground = false) => {
    if (!isBackground) {
      this.isLoading = true;
      this.statusMessage = "Receiving signals...";
      // Fake progress for visual UI consistency (since it's only 1 request now)
      this.totalSources = 1; 
      this.completedSources = 0; 
    }
    
    try {
      // Fetch the pre-compiled master list. A timestamp query prevents browser caching.
      const res = await fetch(`${base || ''}/radical-data.json?t=${Date.now()}`); 
      
      if (res.ok) {
        const data = await res.json();
        this.completedSources = 1; // Snaps progress bar to 100%
        
        // Small timeout so the user actually sees the 100% loading ring
        setTimeout(() => {
          this.processFetchedArticles(data.map(a => Article.fromMap(a)));
        }, 250); 
      } else {
        throw new Error("Failed to load server data");
      }
    } catch(e) {
      console.error(e);
      this.statusMessage = "Network error. Loading offline cache...";
      setTimeout(() => {
        this.processFetchedArticles([]);
      }, 1000);
    }
  }

  /**
   * Evaluates the fresh network batch, replaces the local instance map, and initiates filtration.
   */
  processFetchedArticles = (freshBatch) => {
    // If no network data, fall back entirely to local state/cache
    if (freshBatch.length === 0) {
      this.isLoading = false;
      this.applyLogic();
      return;
    }

    // Because the server already handles deduplication and sorting, 
    // the frontend simply accepts the server's master list directly.
    this.allArticles = freshBatch;

    // Set the boundary for the NEXT session
    if (freshBatch.length > 0) {
      localStorage.setItem('last_session_top_link', freshBatch[0].link);
    }

    this.isLoading = false;
    this.applyLogic();
    this.saveToCache();
  }

  /**
   * Applies the current search queries, active tags, and hidden source lists.
   */
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

  /**
   * Resets local cache and visual flags manually initiating a fresh reload.
   */
  resetFeed = () => {
    localStorage.removeItem(networkConfig.offlineCacheKey);
    localStorage.removeItem(networkConfig.viewedStoriesKey);
    localStorage.removeItem('last_session_top_link');
    this.upToDateLink = null;
    
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

  // === Side-effect Setters ===
  
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