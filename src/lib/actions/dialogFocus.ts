import type { Action } from 'svelte/action';

/**
 * For dialogs: moves keyboard focus into the dialog when it opens, and back to
 * whatever had focus before (usually the button that opened it) when it closes.
 * The element needs tabindex="-1" so it can take focus.
 */
export const dialogFocus: Action<HTMLElement> = (node) => {
  const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  node.focus();
  return {
    destroy() {
      previouslyFocused?.focus();
    }
  };
};
