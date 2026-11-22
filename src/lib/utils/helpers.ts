/**
 * @file helpers.ts
 * @description General-purpose utility functions for date formatting and function debouncing.
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
   * Creates a debounced version of a function that delays invocation until after `wait` milliseconds.
   * Invokes the function immediately on the first call, then queues subsequent calls.
   * The debounced function has a `flush()` method to force immediate execution.
   *
   * @param fn - The function to debounce.
   * @param wait - Wait time in milliseconds (default: 1000).
   * @returns Debounced function with `flush()` and `cancel()` methods.
   */
  debounce<Args extends unknown[]>(fn: (...args: Args) => void, wait = 1000) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pendingArgs: Args | undefined;

    const debounced = function (this: unknown, ...args: Args) {
      pendingArgs = args;

      if (!timeoutId) {
        fn.apply(this, args);
      }

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (pendingArgs) {
          fn.apply(this, pendingArgs);
        }
      }, wait);
    };

    debounced.flush = function () {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    debounced.cancel = function () {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    return debounced;
  }
};