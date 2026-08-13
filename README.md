<div align="center">

# TheRadicalWeb 🌐

**A high-performance news aggregator centralised for Australian political and social perspectives built for rapid information scanning and independent media discovery.**

<p>
  <a href="https://c0smiccactus.github.io/TheRadicalWeb/"><strong>🌍 View Live Site</strong></a>
</p>

<div align="center">
  <img src="https://img.shields.io/badge/Svelte-5-ff3e00?style=for-the-badge">
  <img src="https://img.shields.io/badge/Status-Beta-orange?style=for-the-badge&color=ff7070">
  <img src="https://img.shields.io/badge/Feeds-37-green?style=for-the-badge&color=4ac6b7">
  <img src="https://img.shields.io/github/repo-size/C0smicCactus/TheRadicalWeb?style=for-the-badge&color=ff7070">
  <img src="https://img.shields.io/github/stars/C0smicCactus/TheRadicalWeb?style=for-the-badge&color=965f8a">
  <img src="https://img.shields.io/github/license/C0smicCactus/TheRadicalWeb?style=for-the-badge&color=4ac6b7">
</div>

*This is a Svelte port of the Flutter project,
[The Radical](https://github.com/C0smicCactus/TheRadical).*

</div>

---

## ⚠️ Important

> [!WARNING]
> **Beta Disclaimer:** The Radical is currently in active development. As a centralised hub for independent media, it relies on direct RSS/Atom feeds. You may encounter incomplete metadata as we refine our custom regex-based parsing engines.

---

## 💡 Motivation

> "For many people an issue does not exist until it appears in the news media. How we view issues, indeed, what we even define as an issue or event, what we see and hear, and what we do not see and hear are greatly determined by those who control the communications world."
> — Michael Parenti

The Radical was born out of a need to centralise news from leftist and independent perspectives without the friction of checking dozens of separate websites. In the current media landscape, independent voices are often scattered; this dashboard brings them into a single, cohesive interface.

---

# 📊 Feed Sources

The Radical aggregates from **37 independent news sources**, organised into three categories:

<table>
<tr>
<td valign="top" width="60%">

## Core Sources (30)

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

## Global Sources (3)

- Jacobin
- The Militant
- Counter Punch

<br>

## Extended Sources (4)

- Michael West
- Independent Australia
- The Conversation
- The Guardian (GNM)

</td>
</tr>
</table>

---

> [!TIP]
> **Prefer your own RSS reader? No dramas!**
>
> All the RSS feeds used in this project can be found
> [here](https://github.com/C0smicCactus/TheRadicalWeb/blob/main/src/lib/core/appFeeds.js).

---

# 🚀 Roadmap & Known Issues

## Things to Fix 🛠️

- [ ] Reliably display authors.
- [ ] Reliably display article photos.
- [ ] Filter out non-news articles (theory, podcasts, etc.).
