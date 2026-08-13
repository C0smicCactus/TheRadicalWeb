/**
 * Shared swipe gesture composable for touch-based horizontal swipe detection.
 * Used by components that need swipe navigation (ArticleTile, StoryViewer).
 */
export function useSwipeGesture({ threshold = 50, yThreshold = 100, onSwipe } = {}) {
  let touchStartX = $state(0);
  let touchStartY = $state(0);
  let touchEndX = $state(0);
  let isSwiping = $state(false);
  let swipeDirection = $state('');

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchEndX = touchStartX;
    isSwiping = true;
    swipeDirection = '';
  }

  function handleTouchMove(e) {
    if (!isSwiping) return;

    touchEndX = e.touches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

    if (deltaY > yThreshold) {
      isSwiping = false;
      swipeDirection = '';
      return;
    }

    if (Math.abs(deltaX) > 10) {
      swipeDirection = deltaX > 0 ? 'right' : 'left';
    }
  }

  function handleTouchEnd() {
    if (!isSwiping) return;

    const deltaX = touchEndX - touchStartX;
    if (Math.abs(deltaX) > threshold) {
      const direction = deltaX > 0 ? 'right' : 'left';
      if (onSwipe) onSwipe(direction);
    }

    isSwiping = false;
    swipeDirection = '';
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
  }

  function reset() {
    isSwiping = false;
    swipeDirection = '';
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
  }

  // Svelte 5 requires getters to maintain reactivity when returning primitives
  return {
    get touchStartX() { return touchStartX; },
    get touchStartY() { return touchStartY; },
    get touchEndX() { return touchEndX; },
    get isSwiping() { return isSwiping; },
    get swipeDirection() { return swipeDirection; },
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    reset
  };
}