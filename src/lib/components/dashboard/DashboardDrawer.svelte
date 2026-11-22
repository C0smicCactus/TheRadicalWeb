<script lang="ts">
  import SettingsControls from '#lib/components/ui/SettingsControls.svelte';
  import { dialogFocus } from '#lib/actions/dialogFocus.js';
  import type { FeedManager } from '#lib/state/feedManager.svelte.js';

  interface Props {
    fm: FeedManager;
    onShowSources: () => void;
    onShowAbout: () => void;
    onShowGitHub: () => void;
    onCustomColor: () => void;
    onClose: () => void;
  }

  let { fm, onShowSources, onShowAbout, onShowGitHub, onCustomColor, onClose }: Props = $props();
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') onClose(); }} />

<button class="fixed inset-0 bg-black/60 z-40 transition-opacity w-full h-full cursor-default border-none" onclick={onClose} aria-label="Close settings" tabindex="-1"></button>

<div class="fixed top-0 right-0 w-80 h-full bg-appSurface z-50 overflow-y-auto p-6 shadow-2xl flex flex-col border-l border-borderSubtle focus:outline-hidden" role="dialog" aria-modal="true" aria-label="Settings" tabindex="-1" use:dialogFocus>
  <div class="flex items-center justify-between pb-4 mb-4 border-b border-borderSubtle">
    <div class="flex items-center space-x-3 text-textMain font-bold">
      <i class="fa-solid fa-gear text-sm" style="color: {fm.primaryColor};"></i>
      <span class="text-xs font-black tracking-widest uppercase">CONTROL PANEL</span>
    </div>
    <button onclick={onClose} class="text-textMuted hover:text-textMain" aria-label="Close settings"><i class="fa-solid fa-xmark text-base"></i></button>
  </div>

  <SettingsControls {fm} {onShowSources} {onShowAbout} {onShowGitHub} {onCustomColor} />
</div>