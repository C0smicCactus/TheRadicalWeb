<script>
  let { currentColor, onColorSelected, onClose } = $props();

  let hexInput = $state(currentColor ? currentColor.replace('#', '') : 'f59e0b');
  let previewColor = $state(currentColor || '#f59e0b');

  function parseHex(hexStr) {
    if (!hexStr) return null;
    let clean = hexStr.trim().replace('#', '');
    if (clean.length === 6 && /^[0-9A-Fa-f]{6}$/.test(clean)) {
      return '#' + clean;
    }
    return null;
  }

  function handleInput(e) {
    const target = /** @type {HTMLInputElement} */ (e.currentTarget);
    hexInput = target.value;
    const parsed = parseHex(hexInput);
    if (parsed) {
      previewColor = parsed;
    }
  }

  function apply() {
    const parsed = parseHex(hexInput);
    if (parsed) {
      onColorSelected(parsed);
      onClose();
    }
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
  <button
    class="absolute inset-0 w-full h-full bg-transparent cursor-default border-none"
    onclick={onClose}
    aria-label="Close custom color dialog overlay"
  ></button>
  <div class="relative bg-appSurface border border-borderSubtle max-w-[450px] w-full p-8 flex flex-col z-10 rounded-xl shadow-2xl">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-black tracking-widest text-textMain uppercase">CUSTOM THEME COLOR</h2>
      <button onclick={onClose} class="text-textMuted hover:text-textMain" aria-label="Close custom color modal">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>
    </div>
    <hr class="border-borderSubtle my-6" />

    <div class="text-[10px] font-bold tracking-widest text-textSubtle mb-3 uppercase">ENTER HEX CODE</div>
    <div class="relative flex items-center mb-5">
      <i class="fa-solid fa-palette absolute left-4 text-textMuted"></i>
      <input
        type="text"
        value={hexInput}
        oninput={handleInput}
        placeholder="e.g. FF5733"
        class="w-full bg-appBackground border border-borderSubtle focus:border-textMain text-center py-3 pl-10 pr-4 text-lg font-bold text-textMain uppercase outline-none rounded"
      />
    </div>

    <div class="flex items-center space-x-3 mb-8">
      <span class="text-[10px] font-bold tracking-widest text-textSubtle uppercase">PREVIEW</span>
      <div class="w-10 h-10 border-2 border-borderSubtle rounded shadow-sm" style="background-color: {previewColor};"></div>
    </div>

    <button
      onclick={apply}
      class="w-full py-4 font-black tracking-widest text-white uppercase transition-opacity hover:opacity-90 rounded"
      style="background-color: {previewColor};"
    >
      APPLY COLOR
    </button>
  </div>
</div>