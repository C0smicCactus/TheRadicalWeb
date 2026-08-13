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
<div class="flex flex-col gap-3 group cursor-pointer bg-appSurface border border-borderSubtle rounded-2xl overflow-hidden hover:shadow-lg transition-all" onclick={openLink}>
  <div class="relative w-full aspect-[16/9] bg-tileBackground overflow-hidden">
    {#if finalThumbnail || article.thumbnail}
      <img src={finalThumbnail || article.thumbnail} alt="" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror={(e) => { e.currentTarget.style.display = 'none'; }} />
    {/if}
    <div class="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent z-0"></div>
    <div class="absolute top-3 left-3 px-2.5 py-1 text-white drop-shadow-sm text-[9px] font-black tracking-widest uppercase rounded shadow-sm z-10" style="background-color: {primaryColor};">
      {article.source}
    </div>
  </div>
  
  <div class="p-4 flex flex-col gap-2">
    <div class="flex items-center gap-2 text-[10px] text-textSubtle font-bold uppercase tracking-wider">
      <span>{appUtils.formatRelativeDate(article.parsedDate)}</span>
      {#if topicsEnabled && article.topics.length > 0}
        <span class="w-1 h-1 rounded-full bg-textSubtle"></span>
        <span>{article.topics[0]}</span>
      {/if}
    </div>
    <h3 class="font-display text-lg font-bold leading-snug line-clamp-2 text-textMain group-hover:underline decoration-2 underline-offset-2" style="text-decoration-color: {primaryColor};">
      {article.title}
    </h3>
    <p class="text-sm text-textMuted line-clamp-2">{article.description}</p>
  </div>
</div>