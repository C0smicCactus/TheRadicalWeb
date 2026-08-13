<script>
  import { appUtils } from '$lib/utils/appUtils.js';
  let { article, primaryColor, onArticleOpen, topicsEnabled, finalThumbnail } = $props();

  function openLink(e) {
    if (e) e.stopPropagation();
    if (onArticleOpen) onArticleOpen(article.title);
    window.open(article.link, '_blank', 'noopener,noreferrer');
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col lg:flex-row gap-0 group cursor-pointer bg-appSurface border border-borderSubtle rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all" onclick={openLink}>
  <div class="relative w-full lg:w-[60%] aspect-video bg-tileBackground overflow-hidden border-r border-borderSubtle">
    {#if finalThumbnail || article.thumbnail}
      <img src={finalThumbnail || article.thumbnail} alt="" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror={(e) => { e.currentTarget.style.display = 'none'; }} />
    {/if}
    <div class="absolute top-4 left-4 px-3 py-1.5 text-white drop-shadow-sm text-[10px] font-black tracking-widest uppercase rounded shadow-sm z-10" style="background-color: {primaryColor};">
      {article.source}
    </div>
  </div>
  
  <div class="flex flex-col justify-center lg:w-[40%] p-6 lg:p-8 gap-4 bg-appSurface">
    <div class="flex items-center gap-2 text-[11px] font-bold text-textSubtle uppercase tracking-wider">
      <span>{appUtils.formatRelativeDate(article.parsedDate)}</span>
      {#if topicsEnabled && article.topics.length > 0}
        <span class="w-1 h-1 rounded-full bg-textSubtle"></span>
        <span style="color: {primaryColor};">{article.topics[0]}</span>
      {/if}
    </div>
    <h2 class="font-display text-3xl xl:text-4xl font-black italic leading-tight text-textMain group-hover:underline decoration-[3px] underline-offset-4" style="text-decoration-color: {primaryColor};">
      {article.title}
    </h2>
    <p class="text-base text-textMuted line-clamp-4 leading-relaxed mt-2">{article.description}</p>
    <div class="mt-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-transform group-hover:translate-x-1" style="color: {primaryColor};">
      READ FULL STORY <i class="fa-solid fa-arrow-right"></i>
    </div>
  </div>
</div>