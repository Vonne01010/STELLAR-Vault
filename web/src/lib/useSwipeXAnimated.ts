import { useRef, useState } from 'react';

interface UseSwipeXAnimatedResult {
  /** Live horizontal offset in px while dragging (0 when idle). Drive your transform with this. */
  dragX: number;
  /** True while a pointer is actively down and dragging this element. */
  dragging: boolean;
  /** True for the brief window after a swipe has been committed, while the exit animation plays. */
  exiting: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: () => void;
}

/**
 * Like `useSwipeX`, but tracks the live drag position so the caller can animate
 * the element following the pointer, then plays a short "flung off" exit
 * animation before firing the swipe callback (rather than firing instantly).
 *
 * `exitDurationMs` should match whatever CSS transition duration you use for
 * the transform when `exiting` is true.
 */
export function useSwipeXAnimated(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 64,
  exitDurationMs = 220
): UseSwipeXAnimatedResult {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(false);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const active = useRef(false);
  const ignoreSwipe = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (exiting) return;

    const target = e.target;
    const isInteractiveControl = target instanceof Element && target.closest('button, a, input, textarea, select, summary, [role="button"], [data-swipe-ignore]') !== null;

    if (isInteractiveControl) {
      ignoreSwipe.current = true;
      return;
    }

    ignoreSwipe.current = false;
    e.preventDefault();
    e.stopPropagation();
    startX.current = e.clientX;
    startY.current = e.clientY;
    active.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (ignoreSwipe.current) return;
    if (active.current) e.preventDefault();
    if (!active.current || startX.current === null || startY.current === null) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;
    // A vertical drag (e.g. page scroll starting on the card) shouldn't drag the card sideways.
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 12) return;
    setDragX(deltaX);
  };

  const finish = (clientX: number, clientY: number) => {
    if (ignoreSwipe.current) {
      ignoreSwipe.current = false;
      setDragging(false);
      setDragX(0);
      return;
    }

    if (!active.current || startX.current === null || startY.current === null) {
      setDragging(false);
      return;
    }
    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;
    active.current = false;
    startX.current = null;
    startY.current = null;
    setDragging(false);

    const passed = Math.abs(deltaX) >= threshold && Math.abs(deltaX) >= Math.abs(deltaY);

    if (!passed) {
      setDragX(0);
      return;
    }

    // Commit: fling the card the rest of the way off-screen, then fire the
    // callback once the exit animation has had time to play.
    setExiting(true);
    setDragX(deltaX < 0 ? -400 : 400);
    window.setTimeout(() => {
      if (deltaX < 0) onSwipeLeft?.();
      else onSwipeRight?.();
      setExiting(false);
      setDragX(0);
    }, exitDurationMs);
  };

  const onPointerUp = (e: React.PointerEvent) => finish(e.clientX, e.clientY);

  const onPointerCancel = () => {
    ignoreSwipe.current = false;
    active.current = false;
    startX.current = null;
    startY.current = null;
    setDragging(false);
    setDragX(0);
  };

  return { dragX, dragging, exiting, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
