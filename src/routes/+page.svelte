<script lang="ts">
  import { onMount } from 'svelte';
  import { FeedManager } from '#lib/state/feedManager.svelte.js';

  import DashboardHeader from '#lib/components/dashboard/DashboardHeader.svelte';
  import DashboardDrawer from '#lib/components/dashboard/DashboardDrawer.svelte';
  import DashboardContentView from '#lib/components/dashboard/DashboardContentView.svelte';
  import SourcesDialog from '#lib/components/dialogs/SourcesDialog.svelte';
  import AboutDialog from '#lib/components/dialogs/AboutDialog.svelte';
  import CustomColorDialog from '#lib/components/dialogs/CustomColorDialog.svelte';

  const fm = new FeedManager();
  let contentView = $state<ReturnType<typeof DashboardContentView>>();

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
    onLogoTap={() => { fm.setActiveFilter("ALL"); fm.setSearchQuery(""); contentView?.scrollToTop(); }}
    onOpenSettings={() => drawerOpen = true}
  />

  <DashboardContentView
    bind:this={contentView}
    {fm}
    onShowSources={() => { drawerOpen = false; sourcesDialogOpen = true; }}
    onShowAbout={() => { drawerOpen = false; aboutDialogOpen = true; }}
    onShowGitHub={() => { window.open('https://github.com/C0smicCactus/TheRadicalWeb', '_blank', 'noopener,noreferrer'); }}
    onCustomColor={() => customColorDialogOpen = true}
  />
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