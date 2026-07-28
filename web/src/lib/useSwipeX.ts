import { useRef } from 'react';

/**
 * Returns pointer handlers that detect a horizontal swipe/drag past
 * `threshold` pixels, firing onSwipeLeft/onSwipeRight accordingly.
 * Pointer Events cover touch AND mouse in one API, so this also works as
 * a click-and-drag gesture on desktop for testing without a touchscreen.
 * A vertical drag (e.g. someone scrolling the page starting on this
 * element) is ignored — it only fires when horizontal movement dominates.
 */
export function useSwipeX(onSwipeLeft?: () => void, onSwipeRight?: () => void, threshold = 48) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
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

  const onPointerUp = (e: React.PointerEvent) => finish(e.clientX, e.clientY);

  const onPointerCancel = () => {
    dragging.current = false;
    startX.current = null;
    startY.current = null;
  };

  return { onPointerDown, onPointerUp, onPointerCancel };
}