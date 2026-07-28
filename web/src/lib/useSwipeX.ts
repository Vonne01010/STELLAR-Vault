import { useRef } from 'react';

/**
 * Returns pointer handlers that detect a horizontal swipe/drag past
 * `threshold` pixels, firing onSwipeLeft/onSwipeRight accordingly.
 * Pointer Events cover touch AND mouse in one API, so this also works as
 * a click-and-drag gesture on desktop for testing without a touchscreen.
 * A vertical drag (e.g. someone scrolling the page starting on this
 * element) is ignored — it only fires when horizontal movement dominates.
 */
export function useSwipeX(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 48,
  capture = true
) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);
  const ignoreSwipe = useRef(false);

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;

    return target.closest('button, a, input, textarea, select, summary, [role="button"], [data-swipe-ignore]') !== null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (isInteractiveTarget(e.target)) {
      ignoreSwipe.current = true;
      return;
    }

    ignoreSwipe.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    dragging.current = true;
    if (capture) e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const finish = (clientX: number, clientY: number) => {
    if (!dragging.current || startX.current === null || startY.current === null) return;
    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    dragging.current = false;
    startX.current = null;
    startY.current = null;

    if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (ignoreSwipe.current) {
      ignoreSwipe.current = false;
      return;
    }

    e.stopPropagation();
    finish(e.clientX, e.clientY);
  };

  const onPointerCancel = () => {
    ignoreSwipe.current = false;
    dragging.current = false;
    startX.current = null;
    startY.current = null;
  };

  return { onPointerDown, onPointerUp, onPointerCancel };
}