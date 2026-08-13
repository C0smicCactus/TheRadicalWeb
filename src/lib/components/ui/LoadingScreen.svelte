<script>
  let { primaryColor, progressPercent, statusMessage } = $props();
</script>

<div class="flex-1 flex flex-col items-center justify-center p-8">
  <div class="w-12 h-12 border-4 rounded-full animate-spin mb-6" style="border-color: {primaryColor}; border-top-color: transparent;"></div>
  <div class="font-display text-3xl font-bold text-textMain">{progressPercent}%</div>
  <div class="text-[10px] font-black tracking-widest mt-2.5 mb-5 uppercase" style="color: {primaryColor};">
    RECEIVING SIGNALS...
  </div>
  <div class="text-textSubtle text-[9px] font-bold tracking-wider uppercase max-w-[400px] text-center">
    {statusMessage}
  </div>
</div>