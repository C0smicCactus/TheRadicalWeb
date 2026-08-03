<script>
  import { appUtils } from '$lib/core/appUtils.js';
  import { feedParser } from '$lib/services/feedParser.js';

  let { article, primaryColor, onArticleOpen } = $props();

  let currentIndex = $state(0);
  let finalThumbnail = $state(undefined);

  // Swipe gesture state
  let touchStartX = $state(0);
  let touchStartY = $state(0);
  let touchCurrentX = $state(0);
  let isSwiping = $state(false);
  let swipeDirection = $state('');

  // Minimum distance in pixels to register a swipe
  const SWIPE_THRESHOLD = 50;
  // Maximum Y movement allowed during swipe (to distinguish from vertical scrolling)
  const SWIPE_Y_THRESHOLD = 100;

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = true;
    swipeDirection = '';
  }

  function handleTouchMove(e) {
    if (!isSwiping) return;

    touchCurrentX = e.touches[0].clientX;
    const deltaX = touchCurrentX - touchStartX;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

    // If vertical movement is too large, cancel swipe (user is scrolling)
    if (deltaY > SWIPE_Y_THRESHOLD) {
      isSwiping = false;
      swipeDirection = '';
      return;
    }

    // Determine swipe direction
    if (Math.abs(deltaX) > 10) {
      swipeDirection = deltaX > 0 ? 'right' : 'left';
    }
  }

  function handleTouchEnd(e) {
    if (!isSwiping) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // Swiped right -> go to previous slide
        prevSlide();
      } else {
        // Swiped left -> go to next slide
        nextSlide();
      }
    }

    // Reset swipe state
    isSwiping = false;
    swipeDirection = '';
    touchStartX = 0;
    touchStartY = 0;
    touchCurrentX = 0;
  }

  $effect(() => {
    if (!finalThumbnail && article.link) {
      feedParser.scrapeUrlForImage(article.link).then(scraped => {
        if (scraped) finalThumbnail = feedParser.scrapeImage(scraped) ? feedParser.scrapeImage(scraped) : scraped;
      });
    }
    return () => {
      finalThumbnail = undefined;
    };
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
</script>

<!-- svelte-ignore state_referenced_locally -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  role="article"
  aria-roledescription="card"
  class="w-[400px] h-[610px] flex flex-col select-none"
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
>
  <!-- Author / Source Row -->
  <div class="flex items-center px-1 pb-2">
    <div class="w-7 h-7 rounded-full bg-[#131313] border border-white/10 flex items-center justify-center text-white/30">
      <i class="fa-solid fa-user text-[11px]"></i>
    </div>
    <div class="ml-2.5 text-[11px] font-bold tracking-wide text-white truncate max-w-[340px]">
      {article.author || article.source}
    </div>
  </div>

  <!-- Carousel Slide Frame (4:5 Aspect Ratio) -->
  <div class="relative w-full aspect-[4/5] rounded-[28px] overflow-hidden bg-[#151515] group">
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
            onerror={(e) => {
              const target = /** @type {HTMLImageElement} */ (e.currentTarget);
              if (target) target.style.display = 'none';
            }}
          />
        {/if}
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90"></div>

        <!-- Topic Badges -->
        <div class="absolute top-3 left-3 flex flex-col items-start gap-1 z-10 max-w-[200px]">
          {#each article.topics as topic}
            <div class="px-2 py-1 bg-white text-black text-[9px] font-bold uppercase tracking-wider shadow">
              {topic}
            </div>
          {/each}
        </div>

        <!-- Source Badge -->
        <div
          class="absolute top-3 right-0 px-3 py-1.5 rounded-tl-lg rounded-bl-lg text-white text-[9px] font-black tracking-widest uppercase shadow z-10"
          style="background-color: {primaryColor};"
        >
          {article.source}
        </div>

        <!-- Title -->
        <div class="absolute bottom-6 left-4 right-10 z-10">
          <h3 class="font-display text-[22px] font-bold italic text-white leading-snug line-clamp-3">
            {article.title}
          </h3>
        </div>
      </div>

      <!-- Slide 1: Information / Full Description Slide -->
      <div class="w-1/2 h-full bg-[#151515] p-7 flex flex-col justify-between border border-white/5">
        <div>
          <i class="fa-solid fa-circle-info text-white text-lg"></i>
          <div class="mt-4 font-display font-black text-lg text-white leading-tight uppercase line-clamp-3 tracking-tighter">
            {article.title}
          </div>
          <div class="mt-4 text-white/80 text-sm leading-relaxed max-h-[300px] overflow-y-auto pr-1">
            {article.description}
          </div>
        </div>

        <button
          onclick={openLink}
          class="w-full bg-white text-black py-4 font-black text-[10px] tracking-widest uppercase hover:bg-gray-200 transition-colors mt-4"
        >
          OPEN ARTICLE
        </button>
      </div>
    </div>

    <!-- Carousel Page Indicator Dots -->
    <div class="absolute bottom-3 left-0 right-0 flex justify-center space-x-1.5 pointer-events-none z-20">
      <div class="w-1.5 h-1.5 rounded-full transition-colors" style="background-color: {currentIndex === 0 ? '#ffffff' : 'rgba(255,255,255,0.24)'};"></div>
      <div class="w-1.5 h-1.5 rounded-full transition-colors" style="background-color: {currentIndex === 1 ? '#ffffff' : 'rgba(255,255,255,0.24)'};"></div>
    </div>

    <!-- Swipe Feedback Indicator -->
    {#if isSwiping && swipeDirection}
      <div
        class="absolute inset-0 flex items-center justify-center pointer-events-none z-[30]"
        style="opacity: {Math.min(Math.abs(touchCurrentX - touchStartX) / 150, 0.4)};"
      >
        {#if swipeDirection === 'left'}
          <i class="fa-solid fa-arrow-left text-white text-4xl drop-shadow-lg"></i>
        {:else}
          <i class="fa-solid fa-arrow-right text-white text-4xl drop-shadow-lg"></i>
        {/if}
      </div>
    {/if}

    <!-- Desktop Chevron Navigation Arrows -->
    {#if currentIndex === 1}
      <button
        onclick={prevSlide}
        class="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center transition-all hover:bg-black/90 z-20"
        aria-label="Previous slide"
      >
        <i class="fa-solid fa-chevron-left text-[10px]"></i>
      </button>
    {/if}
    {#if currentIndex === 0}
      <button
        onclick={nextSlide}
        class="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center transition-all hover:bg-black/90 z-20"
        aria-label="Next slide"
      >
        <i class="fa-solid fa-chevron-right text-[10px]"></i>
      </button>
    {/if}
  </div>

  <!-- Caption Area -->
  <div class="px-1 py-1.5 flex flex-col">
    <div class="text-[8px] text-textSubtle font-bold uppercase tracking-wider">
      {appUtils.formatRelativeDate(article.parsedDate)}
    </div>
    <div class="mt-0.5 text-[13px] leading-snug text-white line-clamp-2">
      <span class="font-black text-[11px] mr-2 uppercase" style="color: {primaryColor};">
        {article.source}
      </span>
      {article.description.substring(0, 85)}{article.description.length > 85 ? '...' : ''}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span class="text-textSubtle ml-1 cursor-pointer hover:underline" onclick={openLink}>more</span>
    </div>
  </div>
</div>
