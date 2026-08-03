<script>
  let { width, primaryColor, searchQuery = $bindable(), onSearchChanged, onLogoTap, onOpenSettings } = $props();
</script>

<header class="flex flex-col w-full z-20">
  <!-- Beta Banner -->
  <div class="w-full py-1.5 text-center" style="background-color: {primaryColor};">
    <span class="text-appBackground text-[10px] font-black tracking-widest uppercase">
      THIS WEBSITE IS STILL IN BETA — DEVELOPMENT IN PROGRESS
    </span>
  </div>

  <!-- Navigation Bar -->
  <div class="w-full bg-appBackground border-b border-borderSubtle">
    <div class="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
      <!-- Brand Logo -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="cursor-pointer font-display font-bold text-2xl tracking-tighter select-none" style="color: {primaryColor};" onclick={onLogoTap}>
        {width > 500 ? "THE RADICAL" : "TR"}
      </div>

      <!-- Search Interface -->
      <div class="flex-1 max-w-[600px] mx-5">
        <div class="relative flex items-center bg-highlightOverlay rounded-full px-4 py-2 border border-transparent focus-within:border-white/20">
          <i class="fa-solid fa-magnifying-glass text-textMuted text-xs mr-3"></i>
          <input
            type="text"
            bind:value={searchQuery}
            oninput={() => onSearchChanged(searchQuery)}
            placeholder="Search articles..."
            class="bg-transparent border-none outline-none text-[13px] text-textMain placeholder-textMuted w-full"
          />
        </div>
      </div>

      <!-- Settings Button -->
      <button
        onclick={onOpenSettings}
        class="flex items-center justify-center bg-highlightOverlay border border-borderSubtle rounded-full px-4 py-2 text-textMain hover:bg-white/10 transition-colors"
      >
        {#if width > 700}
          <span class="text-[10px] font-bold mr-2.5 tracking-wider">SETTINGS</span>
        {/if}
        <i class="fa-solid fa-sliders text-xs" style="color: {primaryColor};"></i>
      </button>
    </div>
  </div>
</header>
