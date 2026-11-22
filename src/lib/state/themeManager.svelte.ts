import { colors } from '#lib/config/colors.js';

export class ThemeManager {
  primaryColor = $state(colors.themeChoices[0]);
  isDark = $state(true);

  init() {
    if (localStorage.getItem('theme') === 'light' || (!('theme' in localStorage) && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDark = false;
    } else {
      this.isDark = true;
    }
    const colorVal = localStorage.getItem('theme_color');
    if (colorVal) this.primaryColor = colorVal;
  }

  toggleTheme = () => {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  updateTheme = (color: string) => {
    this.primaryColor = color;
    localStorage.setItem('theme_color', color);
  }
}