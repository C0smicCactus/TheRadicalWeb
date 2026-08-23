import { feeds } from '$lib/config/feeds.js';

export class SettingsManager {
  extendedMode = $state(false);
  topicsEnabled = $state(false);
  allSourcesEnabled = $state(true);
  enabledSources = $state(new Set());

  init() {
    this.extendedMode = localStorage.getItem('extended_coverage') === 'true';
    this.topicsEnabled = localStorage.getItem('topics_enabled') === 'true';
    this.allSourcesEnabled = localStorage.getItem('all_sources_enabled') !== 'false';

    const savedSources = localStorage.getItem('enabled_sources');
    if (savedSources) {
      this.enabledSources = new Set(JSON.parse(savedSources));
    } else {
        this.enabledSources = new Set([
          ...Object.values(feeds.coreSources),
          ...Object.values(feeds.globalSources)
        ]);
    }
  }

  setExtendedMode(v, onLogicUpdate) {
    this.extendedMode = v;
    localStorage.setItem('extended_coverage', v);
    onLogicUpdate?.();
  }

  setTopicsEnabled(v) {
    this.topicsEnabled = v;
    localStorage.setItem('topics_enabled', v);
  }

  setSourcesEnabled(all, set, onLogicUpdate) {
    this.allSourcesEnabled = all;
    this.enabledSources = set;
    localStorage.setItem('all_sources_enabled', all);
    localStorage.setItem('enabled_sources', JSON.stringify(Array.from(set)));
    onLogicUpdate?.();
  }
}