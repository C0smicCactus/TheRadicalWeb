<script>
  import { appUtils } from '$lib/core/appUtils.js';
  import { feedParser } from '$lib/services/feedParser.js';

  let { articles, initialIndex = 0, sourceName, primaryColor, onStoryViewed, onClose } = $props();

  /* svelte-ignore state_referenced_locally */
  let currentIndex = $state(initialIndex);
  let resolvedThumbnails = $state({});
  let progress = $state(0);
  let animationFrame;
  let startTime;

  // Swipe gesture state
  let touchStartX = $state(0);
  let touchStartY = $state(0);
  let touchCurrentX = $state(0);
  let isSwiping = $state(false);
  let swipeDirection = $state(''); // 'left' or 'right'

  function loadThumb(index) {
    const article = articles[index];
    if (!article || article.thumbnail || resolvedThumbnails[index]) return;
    feedParser.scrapeUrlForImage(article.link).then(scraped => {
      if (scraped) {
        resolvedThumbnails = { ...resolvedThumbnails, [index]: scraped };
      }
    });
  }

  function startStoryTimer() {
    if (articles[currentIndex]) {
      onStoryViewed(articles[currentIndex].link);
    }
    progress = 0;
    startTime = Date.now();
    cancelAnimationFrame(animationFrame);

    function tick() {
      const elapsed = Date.now() - startTime;
      progress = elapsed / 10000; // 10s story duration
      if (progress >= 1) {
        nextStory();
      } else {
        animationFrame = requestAnimationFrame(tick);
      }
    }
    animationFrame = requestAnimationFrame(tick);
  }

  function nextStory() {
    cancelAnimationFrame(animationFrame);
    if (currentIndex + 1 < articles.length) {
      currentIndex++;
      loadThumb(currentIndex);
      startStoryTimer();
    } else {
      onClose();
    }
  }

  function prevStory() {
    cancelAnimationFrame(animationFrame);
    if (currentIndex > 0) {
      currentIndex--;
      startStoryTimer();
    } else {
      startStoryTimer();
    }
  }

  $effect(() => {
    loadThumb(currentIndex);
    startStoryTimer();
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  });

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
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
    const deltaX = touchCurrentX - touchStartX;

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

  function handleTouchEnd() {
    if (!isSwiping) return;

    const deltaX = touchCurrentX - touchStartX;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // Swiped right -> go to previous story
        prevStory();
      } else {
        // Swiped left -> go to next story
        nextStory();
      }
    }

    // Reset swipe state
    isSwiping = false;
    swipeDirection = '';
    touchStartX = 0;
    touchStartY = 0;
    touchCurrentX = 0;
  }

  function handleTap(e) {
    // Don't process tap if a swipe occurred
    if (swipeDirection || isSwiping) return;

    const width = window.innerWidth;
    const x = e.clientX;
    if (x < width / 3) {
      prevStory();
    } else if (x > (2 * width) / 3) {
      nextStory();
    } else {
      if (articles[currentIndex]) {
        window.open(articles[currentIndex].link, '_blank', 'noopener,noreferrer');
      }
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-black z-50 flex flex-col cursor-pointer select-none"
  onclick={handleTap}
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
>
  <!-- Swipe Feedback Indicator -->
  {#if isSwiping && swipeDirection}
    <div
      class="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]"
      style="opacity: {Math.min(Math.abs(touchCurrentX - touchStartX) / 150, 0.5)};"
    >
      {#if swipeDirection === 'left'}
        <i class="fa-solid fa-arrow-left text-white text-6xl drop-shadow-lg"></i>
      {:else}
        <i class="fa-solid fa-arrow-right text-white text-6xl drop-shadow-lg"></i>
      {/if}
    </div>
  {/if}
  <!-- Background Image & Gradient -->
  <div class="absolute inset-0 bg-[#131313]">
    {#if articles[currentIndex]}
      {@const activeImg = resolvedThumbnails[currentIndex] || articles[currentIndex].thumbnail}
      {#if activeImg}
        <img
          src={activeImg}
          alt=""
          class="w-full h-full object-cover"
        />
      {/if}
    {/if}
    <div class="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" style="background-image: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 40%, rgba(0,0,0,0.95) 100%);"></div>
  </div>

  <!-- UI Content Overlay -->
  <div class="relative z-10 flex flex-col h-full pt-safe-top">
    <!-- Story Segment Progress Indicators -->
    <div class="flex px-3 pt-3 space-x-1">
      {#each articles as _, i}
        <div class="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
          <div
            class="h-full bg-white rounded-full transition-all duration-75"
            style="width: {i < currentIndex ? '100%' : (i === currentIndex ? Math.min(progress * 100, 100) + '%' : '0%')};"
          ></div>
        </div>
      {/each}
    </div>

    <!-- Header Bar -->
    <div class="flex items-center px-4 mt-3">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center font-black text-black text-xs uppercase"
        style="background-color: {primaryColor};"
      >
        {sourceName[0]}
      </div>
      <div class="ml-3 flex flex-col">
        <span class="font-bold text-sm text-white">{sourceName}</span>
        <span class="text-white/60 text-[10px] font-bold uppercase">
          {articles[currentIndex] ? appUtils.formatRelativeDate(articles[currentIndex].parsedDate) : ''}
        </span>
      </div>
      <div class="flex-1"></div>
      <button
        onclick={(e) => { e.stopPropagation(); onClose(); }}
        class="text-white/80 hover:text-white p-2 rounded-full bg-black/40"
        aria-label="Close"
      >
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>
    </div>

    <div class="flex-1"></div>

    <!-- Story Content Footer -->
    {#if articles[currentIndex]}
      <div class="p-6 pb-10 flex flex-col max-w-[800px] mx-auto w-full">
        <h2 class="font-display text-2xl sm:text-3xl font-bold italic leading-tight text-white mb-4">
          {articles[currentIndex].title}
        </h2>
        <p class="text-white/80 text-sm sm:text-base line-clamp-3 leading-relaxed">
          {articles[currentIndex].description}
        </p>

        <div class="mt-8 flex flex-col items-center animate-bounce">
          <i class="fa-solid fa-chevron-up text-sm mb-1" style="color: {primaryColor};"></i>
          <span class="text-[10px] font-black tracking-widest uppercase" style="color: {primaryColor};">
            TAP TO READ FULL ARTICLE
          </span>
        </div>
      </div>
    {/if}
  </div>
</div>
