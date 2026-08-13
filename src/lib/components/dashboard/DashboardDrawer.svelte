<script>
  import SettingsControls from '$lib/components/ui/SettingsControls.svelte';

  let { fm, onShowSources, onShowAbout, onShowGitHub, onCustomColor, onClose } = $props();
  let showResetConfirm = $state(false);
</script>

<button class="fixed inset-0 bg-black/60 z-40 transition-opacity w-full h-full cursor-default border-none" onclick={onClose}></button>

<aside class="fixed top-0 right-0 w-80 h-full bg-appSurface z-50 overflow-y-auto p-6 shadow-2xl flex flex-col border-l border-borderSubtle">
  <div class="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
    <div class="flex items-center space-x-3 text-textMain font-bold">
      <i class="fa-solid fa-gear text-sm" style="color: {fm.primaryColor};"></i>
      <span class="text-xs font-black tracking-widest uppercase">CONTROL PANEL</span>
    </div>
    <button onclick={onClose} class="text-white/50 hover:text-white"><i class="fa-solid fa-xmark text-base"></i></button>
  </div>

  <SettingsControls {fm} {onShowSources} {onShowAbout} {onShowGitHub} {onCustomColor} />

  <div class="mt-8 mb-4">
    {#if showResetConfirm}
      <div class="bg-appSurface border border-red-500/50 p-4 text-sm rounded">
        <div class="font-bold text-white mb-2">Reset Feed?</div>
        <div class="text-xs text-textMuted mb-4 leading-relaxed">This will wipe all cached articles and viewed story tracking. A fresh feed update will load immediately.</div>
        <div class="flex justify-end space-x-4">
          <button onclick={() => showResetConfirm = false} class="text-textSubtle hover:text-white text-xs font-bold uppercase">Cancel</button>
          <button onclick={() => { showResetConfirm = false; fm.resetFeed(); }} class="text-red-500 hover:text-red-400 font-black text-xs uppercase">RESET</button>
        </div>
      </div>
    {:else}
      <button onclick={() => showResetConfirm = true} class="w-full flex items-center justify-between p-4 bg-highlightOverlay border border-red-500/40 transition-colors hover:bg-red-500/10 rounded">
        <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-red-500 uppercase">
          <i class="fa-solid fa-rotate text-xs"></i><span>RESET FEED</span>
        </div>
      </button>
    {/if}
  </div>
</aside>