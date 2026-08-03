<script>
  let { primaryColor, onClose } = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
  <button
    class="absolute inset-0 w-full h-full bg-transparent cursor-default border-none"
    onclick={onClose}
    aria-label="Close modal overlay"
  ></button>
  <div class="relative bg-appSurface border border-borderSubtle max-w-[600px] w-full p-8 flex flex-col z-10">
    <div class="flex justify-between items-start">
      <div class="flex flex-col">
        <div class="flex items-center space-x-2 text-[10px] font-bold tracking-widest mb-2 text-white uppercase">
          <i class="fa-solid fa-circle-info" style="color: {primaryColor};"></i>
          <span>PROJECT BRIEFING</span>
        </div>
        <h1 class="font-display text-4xl font-bold italic text-white">THE RADICAL</h1>
        <div class="text-textMuted text-xs font-bold tracking-widest mt-1">v0.2.0</div>
      </div>
      <button onclick={onClose} class="text-white/60 hover:text-white" aria-label="Close modal">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>
    </div>

    <div class="mt-8 pl-5 border-l-2" style="border-color: {primaryColor};">
      <p class="text-lg font-medium italic text-white leading-relaxed">
        The Radical is an independent news aggregator designed to centralise reporting from Australian political and social perspectives.
      </p>
    </div>

    <p class="mt-5 text-textMuted text-sm leading-relaxed">
      Designed for tracking material and economic realities without having to manually check dozens of sources every day.
    </p>

    <button onclick={onClose} class="w-full mt-10 py-4 text-black font-black tracking-widest uppercase transition-opacity hover:opacity-90" style="background-color: {primaryColor};">
      CLOSE
    </button>
  </div>
</div>
