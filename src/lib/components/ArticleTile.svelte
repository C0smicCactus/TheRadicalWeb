<script>
  import { onMount } from 'svelte';
  import { appUtils } from '$lib/core/appUtils.js';
  import { feedParser } from '$lib/services/feedParser.js';
  import { useSwipeGesture } from '$lib/core/useSwipeGesture.svelte.js';

  let { article, primaryColor, onArticleOpen, variant = "mobile", topicsEnabled = false } = $props();

  let currentIndex = $state(0);
  let finalThumbnail = $state(undefined);

  // Swipe gesture composable (for mobile only)
  const swipe = useSwipeGesture({
    threshold: 50,
    yThreshold: 100,
    onSwipe: (direction) => {
      if (variant !== 'mobile') return;
      if (direction === 'right') {
        prevSlide();
      } else {
        nextSlide();
      }
    }
  });

  function openLink(e) {
    if (e) e.stopPropagation();
    if (onArticleOpen) onArticleOpen(article.title);
    window.open(article.link, '_blank', 'noopener,noreferrer');
  }

  function nextSlide(e) {
    if (e) e.stopPropagation();
    currentIndex = 1;
  }

  function prevSlide(e) {
    if (e) e.stopPropagation();
    currentIndex = 0;
  }

  onMount(() => {
    let mounted = true;

    if (!finalThumbnail && article.link) {
      feedParser.scrapeUrlForImage(article.link).then(scraped => {
        if (!mounted) return;
        if (scraped) {
          const extracted = feedParser.scrapeImage(scraped);
          finalThumbnail = extracted || scraped;
        }
      });
    }

    return () => {
      mounted = false;
    };
  });
</script>

{#if variant === 'mobile'}
  <!-- Mobile 4:5 UI (Instagram Style) -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    role="article"
    class="w-[400px] max-w-full h-[610px] flex flex-col"
    ontouchstart={swipe.handleTouchStart}
    ontouchmove={swipe.handleTouchMove}
    ontouchend={swipe.handleTouchEnd}
  >
    <!-- Author / Source Row -->
    <div class="flex items-center px-1 pb-2">
      <div class="w-7 h-7 rounded-full bg-appSurface border border-borderSubtle flex items-center justify-center text-textSubtle">
        <i class="fa-solid fa-user text-[11px]"></i>
      </div>
      <div class="ml-2.5 text-[11px] font-bold tracking-wide text-textMain truncate max-w-[340px]">
        {article.author || article.source}
      </div>
    </div>

    <!-- Carousel Slide Frame (4:5 Aspect Ratio) -->
    <div class="relative w-full aspect-[4/5] rounded-[28px] overflow-hidden bg-tileBackground group">
      <div
        class="flex transition-transform duration-300 ease-out h-full w-[200%]"
        style="transform: translateX(-{currentIndex * 50}%);"
      >
        <!-- Slide 0: Main Image Slide -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="w-1/2 h-full relative cursor-pointer" onclick={openLink}>
          {#if finalThumbnail || article.thumbnail}
            <img
              src={finalThumbnail || article.thumbnail}
              alt=""
              loading="lazy"
              class="absolute inset-0 w-full h-full object-cover"
              onerror={(e) => { const target = /** @type {HTMLImageElement} */ (e.currentTarget); if (target) target.style.display = 'none'; }}
            />
          {/if}
          <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90"></div>

          <!-- Topic Badges -->
          {#if topicsEnabled}
          <div class="absolute top-3 left-3 flex flex-col items-start gap-1 z-10 max-w-[200px]">
            {#each article.topics as topic}
              <div class="px-2 py-1 bg-white text-black text-[9px] font-bold uppercase tracking-wider shadow">
                {topic}
              </div>
            {/each}
          </div>
          {/if}

          <!-- Source Badge -->
          <div
            class="absolute top-3 right-0 px-3 py-1.5 rounded-tl-lg rounded-bl-lg text-white drop-shadow text-[9px] font-black tracking-widest uppercase shadow z-10"
            style="background-color: {primaryColor};"
          >
            {article.source}
          </div>

          <!-- Title -->
          <div class="absolute bottom-6 left-4 right-10 z-10">
            <h3 class="font-display text-[22px] font-bold italic text-white leading-snug line-clamp-3 drop-shadow-md">
              {article.title}
            </h3>
          </div>
        </div>

        <!-- Slide 1: Information / Full Description Slide -->
        <div class="w-1/2 h-full bg-tileBackground p-7 flex flex-col justify-between border border-borderSubtle">
          <div>
            <i class="fa-solid fa-circle-info text-textMain text-lg"></i>
            <div class="mt-4 font-display font-black text-lg text-textMain leading-tight uppercase line-clamp-3 tracking-tighter">
              {article.title}
            </div>
            <div class="mt-4 text-textMuted text-sm leading-relaxed line-clamp-6 pr-1">
              {article.description}
            </div>
          </div>

          <button
            onclick={openLink}
            class="w-full bg-textMain text-appBackground py-4 font-black text-[10px] tracking-widest uppercase hover:opacity-90 transition-opacity mt-4 border border-borderSubtle rounded"
          >
            OPEN ARTICLE
          </button>
        </div>
      </div>

      <!-- Carousel Page Indicator Dots -->
      <div class="absolute bottom-3 left-0 right-0 flex justify-center space-x-1.5 pointer-events-none z-20">
        <div class="w-1.5 h-1.5 rounded-full transition-colors bg-white shadow-sm" style="opacity: {currentIndex === 0 ? 1 : 0.3};"></div>
        <div class="w-1.5 h-1.5 rounded-full transition-colors bg-white shadow-sm" style="opacity: {currentIndex === 1 ? 1 : 0.3};"></div>
      </div>

      <!-- Swipe Feedback Indicator -->
      {#if swipe.isSwiping && swipe.swipeDirection}
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-[30]" style="opacity: {Math.min(Math.abs(swipe.touchEndX - swipe.touchStartX) / 150, 0.4)};">
          {#if swipe.swipeDirection === 'left'}
            <i class="fa-solid fa-arrow-left text-white text-4xl drop-shadow-lg"></i>
          {:else}
            <i class="fa-solid fa-arrow-right text-white text-4xl drop-shadow-lg"></i>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Caption Area -->
    <div class="px-1 py-1.5 flex flex-col mt-1">
      <div class="text-[8px] text-textSubtle font-bold uppercase tracking-wider">
        {appUtils.formatRelativeDate(article.parsedDate)}
      </div>
      <div class="mt-0.5 text-[13px] leading-[1.45em] max-h-[2.9em] text-textMain overflow-hidden relative">
        <span class="font-black text-[11px] mr-2 uppercase" style="color: {primaryColor};">
          {article.source}
        </span>
        {article.description}
        {#if article.description.length > 85}
          <div class="absolute bottom-0 right-0 pl-8 pr-1 flex items-center text-[13px]" style="background: linear-gradient(to right, transparent, var(--bg-main) 35%, var(--bg-main) 100%);">
            <span class="text-textMain">...</span>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span class="text-textSubtle ml-1 cursor-pointer hover:underline" onclick={openLink}>more</span>
          </div>
        {/if}
      </div>
    </div>
  </div>

{:else if variant === 'desktop'}
  <!-- Desktop Card UI (Standard Grid) -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="flex flex-col gap-3 group cursor-pointer bg-appSurface border border-borderSubtle rounded-2xl overflow-hidden hover:shadow-lg transition-all" onclick={openLink}>
    <div class="relative w-full aspect-[16/9] bg-tileBackground overflow-hidden">
      {#if finalThumbnail || article.thumbnail}
        <img
          src={finalThumbnail || article.thumbnail}
          alt=""
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onerror={(e) => { const target = /** @type {HTMLImageElement} */ (e.currentTarget); if (target) target.style.display = 'none'; }}
        />
      {/if}
      <div class="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent z-0"></div>
      
      <!-- Source Badge -->
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
      <p class="text-sm text-textMuted line-clamp-2">
        {article.description}
      </p>
    </div>
  </div>

{:else if variant === 'hero'}
  <!-- Desktop Split Hero UI -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="flex flex-col lg:flex-row gap-0 group cursor-pointer bg-appSurface border border-borderSubtle rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all" onclick={openLink}>
    <div class="relative w-full lg:w-[60%] aspect-video bg-tileBackground overflow-hidden border-r border-borderSubtle">
      {#if finalThumbnail || article.thumbnail}
        <img
          src={finalThumbnail || article.thumbnail}
          alt=""
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onerror={(e) => { const target = /** @type {HTMLImageElement} */ (e.currentTarget); if (target) target.style.display = 'none'; }}
        />
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
      <p class="text-base text-textMuted line-clamp-4 leading-relaxed mt-2">
        {article.description}
      </p>
      <div class="mt-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-transform group-hover:translate-x-1" style="color: {primaryColor};">
        READ FULL STORY <i class="fa-solid fa-arrow-right"></i>
      </div>
    </div>
  </div>
{/if}