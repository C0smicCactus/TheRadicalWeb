<script>
  import { appColors } from '$lib/core/appColors.js';
  import { appTopics } from '$lib/core/appTopics.js';
  import CustomColorDialog from '$lib/components/dialogs/CustomColorDialog.svelte';

  let {
    primaryColor,
    onThemeChanged,
    extendedMode,
    onExtendedModeChanged,
    activeFilter,
    onFilterChanged,
    onShowSources,
    onShowAbout,
    onShowGitHub,
    onResetFeed,
    onClose
  } = $props();

  let showResetConfirm = $state(false);
  let customColorDialogOpen = $state(false);

  const filterOptions = ["ALL", ...appTopics.map(t => t.name)];

  function handleExtendedChange(e) {
    const target = /** @type {HTMLInputElement} */ (e.currentTarget);
    onExtendedModeChanged(target.checked);
  }
</script>

<!-- Backdrop overlay button -->
<button
  class="fixed inset-0 bg-black/60 z-40 transition-opacity w-full h-full cursor-default border-none"
  onclick={onClose}
  aria-label="Close drawer backdrop"
></button>

<!-- Sidebar Drawer -->
<aside class="fixed top-0 right-0 w-80 h-full bg-appSurface z-50 overflow-y-auto p-6 shadow-2xl flex flex-col border-l border-borderSubtle">
  <div class="flex items-center justify-between pb-4 border-b border-white/5">
    <div class="flex items-center space-x-3 text-textMain font-bold">
      <i class="fa-solid fa-gear text-sm" style="color: {primaryColor};"></i>
      <span class="text-xs font-black tracking-widest uppercase">CONTROL PANEL</span>
    </div>
    <button onclick={onClose} class="text-white/50 hover:text-white" aria-label="Close panel">
      <i class="fa-solid fa-xmark text-base"></i>
    </button>
  </div>

  <div class="py-4 space-y-4">
    <!-- Extended Mode Switch -->
    <div class="flex items-center justify-between py-1">
      <div>
        <div class="text-xs font-bold text-textMain">EXTENDED COVERAGE</div>
        <div class="text-[10px] text-textMuted">Include broader independent sources.</div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={extendedMode} onchange={handleExtendedChange} class="sr-only peer">
        <div class="w-9 h-5 bg-borderSubtle rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" style="background-color: {extendedMode ? primaryColor : ''}"></div>
      </label>
    </div>
  </div>

  <!-- Theme Palette section -->
  <div class="mt-4 pt-4 border-t border-white/5">
    <div class="text-[10px] text-textSubtle font-bold tracking-wider mb-2.5 uppercase">THEME PALETTE</div>
    <div class="flex flex-wrap gap-2.5">
      {#each appColors.themeChoices as color}
        <button
          onclick={() => onThemeChanged(color)}
          class="w-[35px] h-[35px] border-2 cursor-pointer transition-transform hover:scale-105"
          style="background-color: {color}; border-color: {primaryColor === color ? 'white' : 'transparent'};"
          aria-label="Select theme color {color}"
        ></button>
      {/each}

      <!-- Custom Hex Color gradient tile matching Flutter -->
      <button
        onclick={() => customColorDialogOpen = true}
        class="w-[35px] h-[35px] border-2 border-white/50 cursor-pointer flex items-center justify-center transition-transform hover:scale-105"
        style="background: linear-gradient(135deg, #FF5757, #57FFFF, #57FF57, #FF57FF, #FF5757);"
        title="Custom Color Code"
        aria-label="Custom Theme Color"
      >
        <i class="fa-solid fa-palette text-white text-xs"></i>
      </button>
    </div>
  </div>

  <!-- Topic Filters section -->
  <div class="mt-6 pt-4 border-t border-white/5">
    <div class="text-[10px] text-textSubtle font-bold tracking-wider mb-2.5 uppercase">TOPIC FILTERS</div>
    <div class="flex flex-col space-y-2">
       {#each filterOptions as filterName}
        <button
          onclick={() => onFilterChanged(filterName)}
          class="w-full text-left px-3.5 py-2 border transition-colors text-[11px] font-bold uppercase"
          style="
            background-color: {activeFilter === filterName ? primaryColor : 'transparent'};
            border-color: {activeFilter === filterName ? primaryColor : appColors.borderSubtle};
            color: {activeFilter === filterName ? '#000' : 'rgba(255,255,255,0.6)'};
          "
        >
          {filterName}
        </button>
      {/each}
    </div>
  </div>

  <!-- Navigation Action Buttons -->
  <div class="mt-6 space-y-3 pt-4 border-t border-white/5">
    <button onclick={onShowSources} class="w-full flex items-center justify-between p-4 bg-highlightOverlay border transition-colors hover:bg-white/10" style="border-color: {primaryColor}4D;">
      <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-textMain uppercase">
        <i class="fa-solid fa-satellite-dish text-xs" style="color: {primaryColor};"></i>
        <span>SIGNAL SOURCES</span>
      </div>
      <i class="fa-solid fa-arrow-right text-[10px]" style="color: {primaryColor};"></i>
    </button>

    <button onclick={onShowAbout} class="w-full flex items-center justify-between p-4 bg-highlightOverlay border transition-colors hover:bg-white/10" style="border-color: {primaryColor}4D;">
      <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-textMain uppercase">
        <i class="fa-solid fa-circle-info text-xs" style="color: {primaryColor};"></i>
        <span>ABOUT PROJECT</span>
      </div>
      <i class="fa-solid fa-arrow-right text-[10px]" style="color: {primaryColor};"></i>
    </button>

    <button onclick={onShowGitHub} class="w-full flex items-center justify-between p-4 bg-highlightOverlay border transition-colors hover:bg-white/10" style="border-color: {primaryColor}4D;">
      <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-textMain uppercase">
        <i class="fa-brands fa-github text-xs" style="color: {primaryColor};"></i>
        <span>GITHUB</span>
      </div>
      <i class="fa-solid fa-arrow-right text-[10px]" style="color: {primaryColor};"></i>
    </button>
  </div>

  <!-- Reset Feed Button -->
  <div class="mt-8 mb-4">
    {#if showResetConfirm}
      <div class="bg-appSurface border border-red-500/50 p-4 text-sm rounded">
        <div class="font-bold text-white mb-2">Reset Feed?</div>
        <div class="text-xs text-textMuted mb-4 leading-relaxed">
          This will wipe all cached articles and viewed story tracking.<br/>
          Your settings will be preserved.<br/><br/>
          A fresh feed update will load immediately.
        </div>
        <div class="flex justify-end space-x-4">
          <button onclick={() => showResetConfirm = false} class="text-textSubtle hover:text-white text-xs font-bold uppercase">Cancel</button>
          <button onclick={() => { showResetConfirm = false; onResetFeed(); }} class="text-red-500 hover:text-red-400 font-black text-xs uppercase">RESET</button>
        </div>
      </div>
    {:else}
      <button onclick={() => showResetConfirm = true} class="w-full flex items-center justify-between p-4 bg-highlightOverlay border border-red-500/40 transition-colors hover:bg-red-500/10">
        <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-red-500 uppercase">
          <i class="fa-solid fa-rotate text-xs"></i>
          <span>RESET FEED</span>
        </div>
        <i class="fa-solid fa-arrow-right text-[10px] text-red-500"></i>
      </button>
    {/if}
  </div>
</aside>

{#if customColorDialogOpen}
  <CustomColorDialog
    currentColor={primaryColor}
    onColorSelected={(newColor) => onThemeChanged(newColor)}
    onClose={() => customColorDialogOpen = false}
  />
{/if}