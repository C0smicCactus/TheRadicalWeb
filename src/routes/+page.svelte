<script>
  import { onMount } from 'svelte';
  import { FeedManager } from '$lib/state/feedManager.svelte.js';
  import { appColors } from '$lib/config/appColors.js';
  import { appTopics } from '$lib/config/appTopics.js';

  import DashboardHeader from '$lib/components/dashboard/DashboardHeader.svelte';
  import DashboardDrawer from '$lib/components/dashboard/DashboardDrawer.svelte';
  import DashboardContentView from '$lib/components/dashboard/DashboardContentView.svelte';
  import SourcesDialog from '$lib/components/dialogs/SourcesDialog.svelte';
  import AboutDialog from '$lib/components/dialogs/AboutDialog.svelte';
  import CustomColorDialog from '$lib/components/dialogs/CustomColorDialog.svelte';

  const fm = new FeedManager();

  let innerWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Dialog Controls
  let drawerOpen = $state(false);
  let sourcesDialogOpen = $state(false);
  let aboutDialogOpen = $state(false);
  let customColorDialogOpen = $state(false);

  onMount(() => {
    fm.bootSequence();
  });
</script>

<svelte:window bind:innerWidth />

<div class="flex flex-col h-screen overflow-hidden bg-appBackground text-textMain">
  <DashboardHeader
    width={innerWidth}
    primaryColor={fm.primaryColor}
    isDark={fm.isDark}
    onToggleTheme={fm.toggleTheme}
    searchQuery={fm.searchQuery}
    onSearchChanged={fm.setSearchQuery}
    onLogoTap={() => { fm.setActiveFilter("ALL"); fm.setSearchQuery(""); }}
    onOpenSettings={() => drawerOpen = true}
  />

  <DashboardContentView
    {fm}
    appTopics={appTopics}
    themeChoices={appColors.themeChoices}
    onShowSources={() => { drawerOpen = false; sourcesDialogOpen = true; }}
    onShowAbout={() => { drawerOpen = false; aboutDialogOpen = true; }}
    onShowGitHub={() => { window.open('https://github.com/C0smicCactus/TheRadicalWeb', '_blank', 'noopener,noreferrer'); }}
    onCustomColor={() => customColorDialogOpen = true}
  />

  <nav class="md:hidden flex items-center justify-around bg-appBackground border-t border-borderSubtle py-2.5 z-20 select-none">
    <button class="flex flex-col items-center cursor-pointer px-6 py-1 transition-colors outline-none" style="color: {fm.tabIndex === 0 ? fm.primaryColor : 'var(--text-subtle)'}" onclick={() => fm.tabIndex = 0}>
      <i class="fa-solid fa-house text-base mb-1"></i>
      <span class="text-[10px] font-bold tracking-wider">Home</span>
    </button>
    <button class="flex flex-col items-center cursor-pointer px-6 py-1 transition-colors outline-none" style="color: {fm.tabIndex === 1 ? fm.primaryColor : 'var(--text-subtle)'}" onclick={() => fm.tabIndex = 1}>
      <i class="fa-solid fa-play text-base mb-1"></i>
      <span class="text-[10px] font-bold tracking-wider">Videos</span>
    </button>
  </nav>
</div>

{#if drawerOpen}
  <DashboardDrawer
    {fm}
    onShowSources={() => { drawerOpen = false; sourcesDialogOpen = true; }}
    onShowAbout={() => { drawerOpen = false; aboutDialogOpen = true; }}
    onShowGitHub={() => { window.open('https://github.com/C0smicCactus/TheRadicalWeb', '_blank', 'noopener,noreferrer'); }}
    onCustomColor={() => { drawerOpen = false; customColorDialogOpen = true; }}
    onClose={() => drawerOpen = false}
  />
{/if}

{#if sourcesDialogOpen}
  <SourcesDialog primaryColor={fm.primaryColor} extendedMode={fm.extendedMode} allSourcesEnabled={fm.allSourcesEnabled} enabledSources={fm.enabledSources} onSaved={fm.setSourcesEnabled} onClose={() => sourcesDialogOpen = false} />
{/if}
{#if aboutDialogOpen}
  <AboutDialog primaryColor={fm.primaryColor} onClose={() => aboutDialogOpen = false} />
{/if}
{#if customColorDialogOpen}
  <CustomColorDialog currentColor={fm.primaryColor} onColorSelected={fm.updateTheme} onClose={() => customColorDialogOpen = false} />
{/if}