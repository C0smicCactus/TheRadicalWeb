<script>
  import { appUtils } from '$lib/utils/appUtils.js';
  import { useSwipeGesture } from '$lib/composables/useSwipeGesture.svelte.js';

  let { article, primaryColor, onArticleOpen, topicsEnabled, finalThumbnail, lazyLoadAction } = $props();

  let currentIndex = $state(0);

  const swipe = useSwipeGesture({
    threshold: 50,
    yThreshold: 100,
    onSwipe: (direction) => {
      if (direction === 'right') prevSlide();
      else nextSlide();
    }
  });

  function openLink(e) {
    if (e) e.stopPropagation();
    if (onArticleOpen) onArticleOpen(article.title);
  }

  function nextSlide(e) { if (e) e.stopPropagation(); currentIndex = 1; }
  function prevSlide(e) { if (e) e.stopPropagation(); currentIndex = 0; }
</script>

<div role="article" class="w-[400px] max-w-full h-[610px] flex flex-col" ontouchstart={swipe.handleTouchStart} ontouchmove={swipe.handleTouchMove} ontouchend={swipe.handleTouchEnd} use:lazyLoadAction>
  <div class="flex items-center px-1 pb-2">
    <div class="w-7 h-7 rounded-full bg-appSurface border border-borderSubtle flex items-center justify-center text-textSubtle">
      <i class="fa-solid fa-user text-[11px]"></i>
    </div>
    <div class="ml-2.5 text-[11px] font-bold tracking-wide text-textMain truncate max-w-[340px]">
      {article.author || article.source}
    </div>
  </div>

  <div class="relative w-full aspect-[4/5] rounded-[28px] overflow-hidden bg-tileBackground group">
    <div class="flex transition-transform duration-300 ease-out h-full w-[200%]" style="transform: translateX(-{currentIndex * 50}%);">
      <!-- Main Story image area -->
      <a href={article.link} target="_blank" rel="noopener noreferrer" class="w-1/2 h-full relative cursor-pointer text-left border-none bg-transparent block p-0 m-0" onclick={openLink}>
        {#if finalThumbnail || article.thumbnail}
          <img src={finalThumbnail || article.thumbnail} alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover" onerror={(e) => { e.currentTarget.style.display = 'none'; }} />
        {/if}
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90"></div>

        {#if topicsEnabled}
        <div class="absolute top-3 left-3 flex flex-col items-start gap-1 z-10 max-w-[200px]">
          {#each article.topics as topic}
            <div class="px-2 py-1 bg-white text-black text-[9px] font-bold uppercase tracking-wider shadow">{topic}</div>
          {/each}
        </div>
        {/if}

        <div class="absolute top-3 right-0 px-3 py-1.5 rounded-tl-lg rounded-bl-lg text-white drop-shadow text-[9px] font-black tracking-widest uppercase shadow z-10" style="background-color: {primaryColor};">
          {article.source}
        </div>

        <div class="absolute bottom-6 left-4 right-10 z-10">
          <h3 class="font-display text-[22px] font-bold italic text-white leading-snug line-clamp-3 drop-shadow-md">
            {article.title}
          </h3>
        </div>
      </a>

      <div class="w-1/2 h-full bg-tileBackground p-7 flex flex-col justify-between border border-borderSubtle">
        <div>
          <i class="fa-solid fa-circle-info text-textMain text-lg"></i>
          <div class="mt-4 font-display font-black text-lg text-textMain leading-tight uppercase line-clamp-3 tracking-tighter">{article.title}</div>
          <div class="mt-4 text-textMuted text-sm leading-relaxed line-clamp-6 pr-1">{article.description}</div>
        </div>
        <a href={article.link} target="_blank" rel="noopener noreferrer" onclick={openLink} class="block text-center w-full bg-textMain text-appBackground py-4 font-black text-[10px] tracking-widest uppercase hover:opacity-90 transition-opacity mt-4 border border-borderSubtle rounded">OPEN ARTICLE</a>
      </div>
    </div>

    <div class="absolute bottom-3 left-0 right-0 flex justify-center space-x-1.5 pointer-events-none z-20">
      <div class="w-1.5 h-1.5 rounded-full transition-colors bg-white shadow-sm" style="opacity: {currentIndex === 0 ? 1 : 0.3};"></div>
      <div class="w-1.5 h-1.5 rounded-full transition-colors bg-white shadow-sm" style="opacity: {currentIndex === 1 ? 1 : 0.3};"></div>
    </div>

    {#if swipe.isSwiping && swipe.swipeDirection}
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-[30]" style="opacity: {Math.min(Math.abs(swipe.touchEndX - swipe.touchStartX) / 150, 0.4)};">
        <i class="fa-solid {swipe.swipeDirection === 'left' ? 'fa-arrow-left' : 'fa-arrow-right'} text-white text-4xl drop-shadow-lg"></i>
      </div>
    {/if}
  </div>

  <div class="px-1 py-1.5 flex flex-col mt-1">
    <div class="text-[8px] text-textSubtle font-bold uppercase tracking-wider">{appUtils.formatRelativeDate(article.parsedDate)}</div>
    <div class="mt-0.5 text-[13px] leading-[1.45em] max-h-[2.9em] text-textMain overflow-hidden relative">
      <span class="font-black text-[11px] mr-2 uppercase" style="color: {primaryColor};">{article.source}</span>
      {article.description}
      {#if article.description.length > 85}
        <div class="absolute bottom-0 right-0 pl-8 pr-1 flex items-center text-[13px]" style="background: linear-gradient(to right, transparent, var(--bg-main) 35%, var(--bg-main) 100%);">
          <span class="text-textMain">...</span><a href={article.link} target="_blank" rel="noopener noreferrer" class="text-textSubtle ml-1 cursor-pointer hover:underline border-none bg-transparent p-0 m-0" onclick={openLink}>more</a>
        </div>
      {/if}
    </div>
  </div>
</div>