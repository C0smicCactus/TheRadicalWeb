/**
 * @file helpers.ts
 * @description General-purpose helpers: relative date formatting and limiting how often a function runs.
 */

export const helpers = {
  /**
   * Formats a date input into a human-readable relative time string (e.g., "2 HOURS AGO")
   * or a formatted date string (DD/MM/YYYY) for older entries.
   *
   * @param dateInput - The date to format.
   * @returns The formatted relative time or date string.
   */
  formatRelativeDate(dateInput: string | Date): string {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = date.getTime() - now.getTime(); // Negative for past time
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const dayStr = String(date.getDate()).padStart(2, '0');
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    const yearStr = date.getFullYear();
    const formattedDate = `${dayStr}/${monthStr}/${yearStr}`;

    // Utilizing browser's native i18n relative time format
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always', style: 'long' });

    if (Math.abs(diffHours) < 24) {
      if (Math.abs(diffMins) <= 1) return "JUST NOW";
      if (Math.abs(diffHours) < 1) return rtf.format(diffMins, 'minute').toUpperCase();
      return rtf.format(diffHours, 'hour').toUpperCase();
    } else if (Math.abs(diffDays) <= 14) {
      return `${rtf.format(diffDays, 'day').toUpperCase()} (${formattedDate})`;
    } else {
      return formattedDate;
    }
  },

  /**
   * Limits how often a function runs (used to throttle localStorage writes).
   * The first call runs straight away. Calls that follow within `wait` milliseconds
   * are combined: only the last one runs, `wait` milliseconds after the final call.
   *
   * @param fn - The function to limit.
   * @param wait - Quiet time in milliseconds (default: 1000).
   */
  debounce<Args extends unknown[]>(fn: (...args: Args) => void, wait = 1000) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pendingArgs: Args | null = null;

    return (...args: Args) => {
      if (timeoutId === null) {
        fn(...args); // first call in a burst: run now
      } else {
        pendingArgs = args; // later call in the same burst: keep only the latest
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (pendingArgs) {
          const latest = pendingArgs;
          pendingArgs = null;
          fn(...latest);
        }
      }, wait);
    };
  }
};