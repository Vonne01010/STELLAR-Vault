'use client';
import { useRef, useEffect, useCallback, useState, CSSProperties } from 'react';

interface UseSwipeYOptions {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  maxDrag?: number;
  canSwipeDown?: boolean;
}

function applyRubberBand(delta: number, max: number): number {
  const sign = Math.sign(delta);
  const abs = Math.abs(delta);
  const damped = (abs * max) / (abs + max * 0.85);
  return sign * damped;
}

export function useSwipeY({
  onSwipeUp,
  onSwipeDown,
  threshold = 35,
  maxDrag = 50,
  canSwipeDown,
}: UseSwipeYOptions = {}) {
  const startY = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Swipe down is locked unless explicitly allowed or currently expanded
  const allowDown = canSwipeDown !== undefined ? canSwipeDown : isExpanded;
  const allowDownRef = useRef(allowDown);

  useEffect(() => {
    allowDownRef.current = allowDown;
  }, [allowDown]);

  const expand = useCallback(() => {
    setIsExpanded(true);
    onSwipeUp?.();
  }, [onSwipeUp]);

  const collapse = useCallback(() => {
    setIsExpanded(false);
    onSwipeDown?.();
  }, [onSwipeDown]);

  const toggle = useCallback(() => {
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  }, [isExpanded, expand, collapse]);

  const handleStart = useCallback((y: number) => {
    startY.current = y;
    setIsDragging(true);
    setDragY(0);
  }, []);

  const handleMove = useCallback((y: number) => {
    if (startY.current === null) return;
    
    let delta = y - startY.current;
    
    // Lock downward displacement when swipe down is disabled
    if (delta > 0 && !allowDownRef.current) {
      delta = 0;
    }

    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setDragY(delta);
    });
  }, []);

  const handleEnd = useCallback((y: number) => {
    if (startY.current === null) return;
    
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    const distance = y - startY.current;
    
    if (distance < -threshold) {
      expand();
    } else if (distance > threshold && allowDownRef.current) {
      collapse();
    }
    
    startY.current = null;
    setIsDragging(false);
    setDragY(0);
  }, [expand, collapse, threshold]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY);
    const handleMouseUp = (e: MouseEvent) => handleEnd(e.clientY);
    const handleTouchEnd = (e: TouchEvent) => handleEnd(e.changedTouches[0].clientY);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const dampedDragY = applyRubberBand(dragY, maxDrag);

  const cardStyle: CSSProperties = {
    transform: `translate3d(0, ${isDragging ? dampedDragY : 0}px, 0) scale(${isDragging ? 0.985 : 1})`,
    transition: isDragging 
      ? 'none' 
      : 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: isDragging ? 'transform' : 'auto',
    backfaceVisibility: 'hidden',
  };

  const cardShadowClass = isDragging
    ? 'shadow-[0_16px_30px_-8px_rgba(0,0,0,0.18)]'
    : isExpanded
    ? 'shadow-[0_10px_20px_-6px_rgba(0,0,0,0.12)]'
    : 'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06)]';

  const pillClass = `absolute bottom-2 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all duration-300 pointer-events-none ${
    isDragging ? 'bg-white/70 w-12' : 'bg-white/30 w-9'
  }`;

  const drawerContainerClass = `relative z-10 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] grid ${
    isExpanded 
      ? '-mt-3 pt-3 rounded-b-2xl border-x border-b border-slate-200/80 bg-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] grid-rows-[1fr] opacity-100' 
      : 'grid-rows-[0fr] opacity-0 pt-0 -mt-0 border-none bg-transparent shadow-none'
  }`;

  const drawerContentClass = `space-y-2.5 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
    isExpanded ? 'p-4 translate-y-0' : 'p-0 -translate-y-2'
  }`;

  return {
    isDragging,
    isExpanded,
    expand,
    collapse,
    toggle,
    cardStyle,
    cardShadowClass,
    pillClass,
    drawerContainerClass,
    drawerContentClass,
    swipeHandlers: {
      onMouseDown: (e: React.MouseEvent) => handleStart(e.clientY),
      onTouchStart: (e: React.TouchEvent) => handleStart(e.touches[0].clientY),
      onDragStart: (e: React.DragEvent) => e.preventDefault(),
    },
  };
}