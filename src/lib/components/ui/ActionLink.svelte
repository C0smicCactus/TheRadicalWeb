<!-- src/lib/components/ui/ActionLink.svelte -->
<script lang="ts">
  interface Props {
    onclick: () => void;
    /** Font Awesome classes, e.g. "fa-solid fa-circle-info" */
    icon: string;
    text: string;
    primaryColor: string;
  }

  let { onclick, icon, text, primaryColor }: Props = $props();
</script>

<button {onclick} class="w-full flex items-center justify-between p-3 bg-highlightOverlay border border-borderSubtle rounded-sm hover:bg-highlightOverlay transition-colors">
  <div class="flex items-center space-x-3 text-[10px] font-black tracking-widest text-textMain uppercase">
    <i class="{icon} text-xs" style="color: {primaryColor};"></i>
    <span>{text}</span>
  </div>
</button>