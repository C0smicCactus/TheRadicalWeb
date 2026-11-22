<!-- src/lib/components/ui/ToggleSwitch.svelte -->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'checked'> {
    checked?: boolean;
    primaryColor: string;
  }

  let { checked = $bindable(), primaryColor, ...rest }: Props = $props();
</script>

<label class="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" bind:checked {...rest} class="sr-only peer">
  <div class="w-9 h-5 bg-borderSubtle border border-borderSubtle rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" 
       style="background-color: {checked ? primaryColor : ''}"></div>
</label>