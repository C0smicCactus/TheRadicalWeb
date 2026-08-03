<script>
  import { appFeeds } from '$lib/core/appFeeds.js';

  let { primaryColor, extendedMode, allSourcesEnabled, enabledSources, onSaved, onClose } = $props();

  let allNames = $derived.by(() => {
    const list = [
      ...Object.values(appFeeds.coreSources),
      ...Object.values(appFeeds.globalSources)
    ];
    if (extendedMode) list.push(...Object.values(appFeeds.extendedSources));
    return [...new Set(list)].sort();
  });

  let initValues = { all: allSourcesEnabled, set: enabledSources };
  let localAllEnabled = $state(initValues.all);
  let localEnabledSet = $state(new Set(initValues.set));

  function save() {
    onSaved(localAllEnabled, localEnabledSet);
    onClose();
  }

  function toggleSource(name, checked) {
    const next = new Set(localEnabledSet);
    if (checked) next.add(name);
    else next.delete(name);
    localEnabledSet = next;
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
  <button
    class="absolute inset-0 w-full h-full bg-transparent cursor-default border-none"
    onclick={onClose}
    aria-label="Close sources dialog overlay"
  ></button>
  <div class="relative bg-appSurface border border-borderSubtle max-w-[500px] w-full max-h-[700px] h-[80vh] flex flex-col p-8 z-10">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-black tracking-widest text-white uppercase">SIGNAL SOURCES</h2>
      <button onclick={onClose} class="text-white/60 hover:text-white" aria-label="Close dialog">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>
    </div>
    <hr class="border-borderSubtle my-6" />

    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="font-bold text-[13px] text-white">ALL SOURCES</div>
        <div class="text-[11px] text-textMuted">Include all signals automatically.</div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={localAllEnabled}
          onchange={(e) => localAllEnabled = /** @type {HTMLInputElement} */ (e.currentTarget).checked}
          class="sr-only peer"
        >
        <div class="w-9 h-5 bg-borderSubtle rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" style="background-color: {localAllEnabled ? primaryColor : ''}"></div>
      </label>
    </div>

    <div class="flex-1 overflow-y-auto mb-6 pr-2 space-y-1" style="opacity: {localAllEnabled ? 0.4 : 1.0}; pointer-events: {localAllEnabled ? 'none' : 'auto'};">
      {#each allNames as name}
        <label class="flex items-center justify-between py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 px-2 rounded">
          <span class="text-xs font-medium text-white">{name}</span>
          <input
            type="checkbox"
            checked={localAllEnabled || localEnabledSet.has(name)}
            onchange={(e) => toggleSource(name, /** @type {HTMLInputElement} */ (e.currentTarget).checked)}
            class="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            style="accent-color: {primaryColor};"
          />
        </label>
      {/each}
    </div>

    <button onclick={save} class="w-full py-4 text-black font-black tracking-widest uppercase transition-opacity hover:opacity-90" style="background-color: {primaryColor};">
      SAVE & REFRESH
    </button>
  </div>
</div>
