export const appUtils = {
  formatRelativeDate(dateInput) {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const dayStr = String(date.getDate()).padStart(2, '0');
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    const yearStr = date.getFullYear();
    const formattedDate = `${dayStr}/${monthStr}/${yearStr}`;

    if (diffHours < 24) {
      if (diffHours <= 0) {
        return diffMins <= 1 ? "JUST NOW" : `${diffMins} MINUTES AGO`;
      }
      return `${diffHours} HOURS AGO`;
    } else if (diffDays <= 14) {
      return `${diffDays} DAYS AGO (${formattedDate})`;
    } else {
      return formattedDate;
    }
  }
};
