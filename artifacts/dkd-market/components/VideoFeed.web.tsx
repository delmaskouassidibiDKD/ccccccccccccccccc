import React, { useRef, useEffect, useCallback, useState } from "react";

interface WebVideoFeedProps {
  children: React.ReactNode[];
  onPageChange: (i: number) => void;
  initialIndex?: number;
}

export default function VideoFeed({ children, onPageChange, initialIndex = 0 }: WebVideoFeedProps) {
  const items = React.Children.toArray(children);
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  /* Hauteur de la fenêtre (recalculée si resize) */
  const [H, setH] = useState(window.innerHeight);
  useEffect(() => {
    const onResize = () => setH(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* Molette souris / trackpad — 1 vidéo exactement par scroll */
  useEffect(() => {
    const total = items.length;
    const handle = (e: WheelEvent) => {
      e.preventDefault();
      if (isAnimating.current) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(total - 1, currentIdx + dir));
      if (next === currentIdx) return;
      isAnimating.current = true;
      setCurrentIdx(next);
      onPageChangeRef.current(next);
      setTimeout(() => { isAnimating.current = false; }, 650);
    };
    window.addEventListener("wheel", handle, { passive: false });
    return () => window.removeEventListener("wheel", handle);
  }, [currentIdx, items.length]);

  /* Touch (mobile web) */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) < 30) return;
    const dir = delta > 0 ? 1 : -1;
    const next = Math.max(0, Math.min(items.length - 1, currentIdx + dir));
    if (next === currentIdx) return;
    isAnimating.current = true;
    setCurrentIdx(next);
    onPageChangeRef.current(next);
    setTimeout(() => { isAnimating.current = false; }, 650);
  }, [currentIdx, items.length]);

  return (
    <div
      style={{ width: "100%", height: H, overflow: "hidden", position: "relative" } as React.CSSProperties}
      onTouchStart={handleTouchStart as any}
      onTouchEnd={handleTouchEnd as any}
    >
      <div
        style={{
          width: "100%",
          transform: `translateY(${-currentIdx * H}px)`,
          transition: "transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "transform",
        } as React.CSSProperties}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{ width: "100%", height: H, overflow: "hidden", flexShrink: 0, position: "relative" } as React.CSSProperties}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
