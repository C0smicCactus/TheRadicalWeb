<script>
  import { appTopics } from '$lib/config/appTopics.js';
  import { appColors } from '$lib/config/appColors.js';

  let { 
    fm,
    onShowSources,
    onShowAbout,
    onShowGitHub,
    onCustomColor 
  } = $props();

  const filterOptions = ["ALL", ...appTopics.map(t => t.name)];
</script>

<div class="flex flex-col gap-5 w-full">
  <!-- Extended Mode Toggle -->
  <div class="flex items-center justify-between">
    <div>
      <div class="text-xs font-bold text-textMain">EXTENDED COVERAGE</div>
      <div class="text-[10px] text-textMuted">Include broader independent sources.</div>
    </div>
    <label class="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={fm.extendedMode} onchange={(e) => fm.setExtendedMode(e.currentTarget.checked)} class="sr-only peer">
      <div class="w-9 h-5 bg-borderSubtle border border-borderSubtle rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" style="background-color: {fm.extendedMode ? fm.primaryColor : ''}"></div>
    </label>
  </div>
  
  <hr class="border-borderSubtle" />

  <!-- Topics Toggle -->
  <div class="flex items-center justify-between">
    <div>
      <div class="text-xs font-bold text-textMain">ENABLE TOPICS</div>
      <div class="text-[10px] text-textMuted">Show topics on articles and filters.</div>
      <div class="text-[9px] text-textMuted font-bold uppercase mt-1">(Beta - doesn't work properly)</div>
    </div>
    <label class="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={fm.topicsEnabled} onchange={(e) => fm.setTopicsEnabled(e.currentTarget.checked)} class="sr-only peer">
      <div class="w-9 h-5 bg-borderSubtle border border-borderSubtle rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" style="background-color: {fm.topicsEnabled ? fm.primaryColor : ''}"></div>
    </label>
  </div>

  <hr class="border-borderSubtle" />

  <!-- Theme Palette -->
  <div>
    <div class="text-[10px] text-textSubtle font-bold tracking-wider mb-3 uppercase">THEME PALETTE</div>
    <div class="flex flex-wrap gap-2.5">
      {#each appColors.themeChoices as color}
        <button onclick={() => fm.updateTheme(color)} class="w-[35px] h-[35px] border-2 cursor-pointer transition-transform hover:scale-105 rounded" style="background-color: {color}; border-color: {fm.primaryColor === color ? 'var(--text-main)' : 'transparent'};" aria-label="Select theme"></button>
      {/each}
      <button onclick={onCustomColor} class="w-[35px] h-[35px] border-2 border-borderSubtle cursor-pointer flex items-center justify-center transition-transform hover:scale-105 rounded shadow" style="background: linear-gradient(135deg, #FF5757, #57FFFF, #57FF57, #FF57FF, #FF5757);">
        <i class="fa-solid fa-palette text-white drop-shadow text-xs"></i>
      </button>
    </div>
  </div>

  <hr class="border-borderSubtle" />

  <!-- Topic Filters -->
  <div style="opacity: {fm.topicsEnabled ? 1 : 0.4}; pointer-events: {fm.topicsEnabled ? 'auto' : 'none'};">
    <div class="text-[10px] text-textSubtle font-bold tracking-wider mb-3 uppercase">TOPIC FILTERS</div>
    <div class="flex flex-col gap-2">
      {#each filterOptions as filterName}
        <button onclick={() => fm.setActiveFilter(filterName)} class="w-full text-left px-3.5 py-2 border transition-colors text-[11px] font-bold uppercase rounded" style="background-color: {fm.activeFilter === filterName ? fm.primaryColor : 'transparent'}; border-color: {fm.activeFilter === filterName ? fm.primaryColor : 'var(--border-subtle)'}; color: {fm.activeFilter === filterName ? '#fff' : 'var(--text-main)'};">
          {filterName}
        </button>
      {/each}
    </div>
  </div>

  <hr class="border-borderSubtle" />

  <!-- Action Links -->
  <div class="flex flex-col gap-2">
    <button onclick={onShowSources} class="w-full flex items-center justify-between p-3 bg-highlightOverlay border border-borderSubtle rounded hover:bg-highlightOverlay transition-colors">
      <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-textMain uppercase">
        <i class="fa-solid fa-satellite-dish text-xs" style="color: {fm.primaryColor};"></i><span>SIGNAL SOURCES</span>
      </div>
    </button>
    <button onclick={onShowAbout} class="w-full flex items-center justify-between p-3 bg-highlightOverlay border border-borderSubtle rounded hover:bg-highlightOverlay transition-colors">
      <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-textMain uppercase">
        <i class="fa-solid fa-circle-info text-xs" style="color: {fm.primaryColor};"></i><span>ABOUT PROJECT</span>
      </div>
    </button>
    <button onclick={onShowGitHub} class="w-full flex items-center justify-between p-3 bg-highlightOverlay border border-borderSubtle rounded hover:bg-highlightOverlay transition-colors">
      <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-textMain uppercase">
        <i class="fa-brands fa-github text-xs" style="color: {fm.primaryColor};"></i><span>GITHUB</span>
      </div>
    </button>
  </div>
</div>