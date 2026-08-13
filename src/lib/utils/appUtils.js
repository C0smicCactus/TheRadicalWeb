export const appUtils = {
  formatRelativeDate(dateInput) {
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
   * @param {Function} fn - The function to debounce
   * @param {number} wait - Wait time in milliseconds (default: 1000)
   * @returns {Function} Debounced function with `flush()` method
   */
  debounce(fn, wait = 1000) {
    let timeoutId;
    let pendingArgs;

    const debounced = function (...args) {
      pendingArgs = args;

      if (!timeoutId) {
        fn.apply(this, args);
      }

      clearTimeout(timeoutId);
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