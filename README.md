<div align="center">

# TheRadicalWeb 🌐

**A high-performance news aggregator centralised for Australian political and social perspectives, built for rapid information scanning and independent media discovery.**

<p>
  <a href="https://c0smiccactus.github.io/TheRadicalWeb/"><strong>🌍 View Live Site</strong></a>
</p>

<!-- TODO: Add a screenshot of your app here! -->
<!-- <img src="./docs/screenshot.png" alt="The Radical Web Dashboard" width="800" style="border-radius: 12px; margin: 15px 0;"> -->

<div align="center">
  <img src="https://img.shields.io/badge/Svelte-5-ff3e00?style=for-the-badge">
  <img src="https://img.shields.io/badge/Status-Beta-orange?style=for-the-badge&color=ff7070">
  <img src="https://img.shields.io/badge/Feeds-37-green?style=for-the-badge&color=4ac6b7">
  <img src="https://img.shields.io/github/repo-size/C0smicCactus/TheRadicalWeb?style=for-the-badge&color=ff7070">
  <img src="https://img.shields.io/github/stars/C0smicCactus/TheRadicalWeb?style=for-the-badge&color=965f8a">
  <img src="https://img.shields.io/github/license/C0smicCactus/TheRadicalWeb?style=for-the-badge&color=4ac6b7">
</div>

*This is a Svelte 5 port of the Flutter project,
[The Radical](https://github.com/C0smicCactus/TheRadical).*

</div>

---

## ⚠️ Important

> [!WARNING]
> **Beta Disclaimer:** The Radical is currently in active development. As a centralised hub for independent media, it relies on direct RSS/Atom feeds routed through CORS proxies. You may encounter incomplete metadata as we refine our custom parsing engines.

---

## 💡 Motivation

> "For many people an issue does not exist until it appears in the news media. How we view issues, indeed, what we even define as an issue or event, what we see and hear, and what we do not see and hear are greatly determined by those who control the communications world."
> — Michael Parenti

The Radical was born out of a need to centralise news from leftist and independent perspectives without the friction of checking dozens of separate websites. In the current media landscape, independent voices are often scattered; this dashboard brings them into a single, cohesive interface.

---

## ✨ Features

- **📱 Instagram-Style Story Viewer:** Catch up on the latest headlines from each source with a quick, tap-through story UI.
- **🎨 Customisable Interface:** Toggle between dark/light mode and choose your own primary accent color (or enter a custom hex code).
- **🗂️ Topic Filtering:** Automatically categorises articles into topics like Labour, Environment, First Nations, and Praxis.
- **⚡ Offline Caching:** Caches the latest articles to your browser's local storage for instant loading on your next visit.

---

## 📊 Feed Sources

The Radical aggregates from **37 independent news sources**, organised into three categories:

<table>
<tr>
<td valign="top" width="60%">

### Core Sources (30)

- Picket Line
- Green Left
- Red Flag
- Red Spark
- Socialism Today
- Solidarity
- Labor Tribune
- World Socialist Web Site
- The Anvil
- Vanguard
- Partisan!
- Red Ant
- Temokalati
- Co-Op News
- IWW (South East Queensland)
- Freedom
- Disputes Report
- Overland
- Spirit of Eureka
- Black Peoples Union
- IndigenousX
- Red Black Notes
- The Guardian (CPA)
- Arena
- The Communist
- Militant Worker
- Koori Mail
- 3CR
- Eureka Initiative
- LabourStart

</td>
<td valign="top" width="40%">

### Global Sources (3)
*(Filtered for Australian relevance)*
- Jacobin
- The Militant
- Counter Punch

<br>

### Extended Sources (4)
*(Optional broader coverage)*
- Michael West
- Independent Australia
- The Conversation
- The Guardian (GNM)

</td>
</tr>
</table>

> [!TIP]
> **Prefer your own RSS reader? No dramas!**
>
> All the RSS feeds used in this project can be found
> [here](https://github.com/C0smicCactus/TheRadicalWeb/blob/main/src/lib/config/appFeeds.js).

---

## 💻 Local Development

Want to run The Radical locally or contribute to the project? 

1. **Clone the repository:**
   ```bash
   git clone https://github.com/C0smicCactus/TheRadicalWeb.git
   cd TheRadicalWeb
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:3000`*

---

## ❓ FAQ

- **Eww why did you include X!? Those guys are the worst!**

The goal of The Radical is to remain as neutral as possible unifying leftist news in one place. If you do not want to see articles from a specific publisher, there is a setting to manually remove them.

- **Was this project made using AI? If so, how much?**

This project was written almost entirely with Qwen3.6 35B running locally on my laptop.

- **Doesn't this project/website take views away from the original publisher?**

No. I deliberately made the decision to only provide a small amount of each article to force the reader to go to the original site. Ideally, The Radical would bring more traffic to these publishers.

---

## 🚀 Roadmap & Known Issues

### Things to Fix 🛠️
- [ ] Reliably extract and display author names across all formats.
- [ ] Reliably scrape and display article thumbnail photos.
- [ ] Filter out non-news articles (theory pieces, podcasts, announcements).