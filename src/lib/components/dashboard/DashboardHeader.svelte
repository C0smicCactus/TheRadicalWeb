<script>
  let { width, primaryColor, isDark, onToggleTheme, searchQuery = $bindable(), onSearchChanged, onLogoTap, onOpenSettings } = $props();

  let mouseDownTime = $state(0);

  function handleLogoMousedown() {
    mouseDownTime = Date.now();
  }

  function handleLogoMouseup() {
    const elapsedTime = Date.now() - mouseDownTime;
    // Treat as click if mouse was down for less than 300ms
    if (elapsedTime < 300) {
      // Only scroll to top on mobile view (when showing "TR" instead of "THE RADICAL")
      if (width <= 500) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }
</script>

<header class="flex flex-col w-full z-20">
  <!-- Beta Banner -->
  <div class="w-full py-1.5 text-center" style="background-color: {primaryColor};">
    <span class="text-white drop-shadow text-[10px] font-black tracking-widest uppercase">
      THIS WEBSITE IS STILL IN BETA — DEVELOPMENT IN PROGRESS
    </span>
  </div>

  <!-- Navigation Bar -->
  <div class="w-full bg-appBackground border-b border-borderSubtle">
    <div class="max-w-[1754px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
      
      <!-- Brand Logo -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="cursor-pointer font-display font-bold text-2xl tracking-tighter select-none flex-shrink-0" style="color: {primaryColor};" onmousedown={handleLogoMousedown} onmouseup={handleLogoMouseup}>
        {width > 500 ? "THE RADICAL" : "TR"}
      </div>

      <!-- Search Interface -->
      <div class="flex-1 max-w-[600px] mx-auto">
        <div class="relative flex items-center bg-highlightOverlay rounded-full px-4 py-2 border border-borderSubtle focus-within:border-white/20">
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

      <!-- Actions -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Theme Toggle -->
        <button
          onclick={onToggleTheme}
          class="flex items-center justify-center bg-highlightOverlay border border-borderSubtle rounded-full w-9 h-9 text-textMain hover:bg-highlightOverlay transition-colors"
          aria-label="Toggle Light/Dark Theme"
        >
          <i class="fa-solid {isDark ? 'fa-sun' : 'fa-moon'} text-xs"></i>
        </button>

        <!-- Settings Button (Hidden on Desktop, moved to Sidebar) -->
        <button
          onclick={onOpenSettings}
          class="md:hidden flex items-center justify-center bg-highlightOverlay border border-borderSubtle rounded-full w-9 h-9 text-textMain hover:bg-highlightOverlay transition-colors"
        >
          <i class="fa-solid fa-sliders text-xs" style="color: {primaryColor};"></i>
        </button>
      </div>

    </div>
  </div>
</header>