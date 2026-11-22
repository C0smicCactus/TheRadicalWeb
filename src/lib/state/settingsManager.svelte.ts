import { feeds } from '#lib/config/feeds.js';

export class SettingsManager {
  extendedMode = $state(false);
  topicsEnabled = $state(false);
  allSourcesEnabled = $state(true);
  enabledSources = $state(new Set<string>());

  init() {
    this.extendedMode = localStorage.getItem('extended_coverage') === 'true';
    this.topicsEnabled = localStorage.getItem('topics_enabled') === 'true';
    this.allSourcesEnabled = localStorage.getItem('all_sources_enabled') !== 'false';

    const savedSources = localStorage.getItem('enabled_sources');
    if (savedSources) {
      this.enabledSources = new Set<string>(JSON.parse(savedSources));
    } else {
        this.enabledSources = new Set([
          ...Object.values(feeds.coreSources),
          ...Object.values(feeds.globalSources)
        ]);
    }
  }

  setExtendedMode(v: boolean, onLogicUpdate?: () => void) {
    this.extendedMode = v;
    localStorage.setItem('extended_coverage', String(v));
    onLogicUpdate?.();
  }

  setTopicsEnabled(v: boolean) {
    this.topicsEnabled = v;
    localStorage.setItem('topics_enabled', String(v));
  }

  setSourcesEnabled(all: boolean, set: Set<string>, onLogicUpdate?: () => void) {
    this.allSourcesEnabled = all;
    this.enabledSources = set;
    localStorage.setItem('all_sources_enabled', String(all));
    localStorage.setItem('enabled_sources', JSON.stringify(Array.from(set)));
    onLogicUpdate?.();
  }
}