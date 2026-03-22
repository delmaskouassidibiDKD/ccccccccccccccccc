import React, { useRef, useCallback, useEffect, useState } from "react";
import { FlatList, Platform, useWindowDimensions, ViewToken } from "react-native";

interface NativeVideoFeedProps {
  children: React.ReactNode[];
  onPageChange: (i: number) => void;
  initialIndex?: number;
}

/* ────────────────────────────────────────────────────────────────
   Web — scroll verrouillé : exactement 1 vidéo par molette/swipe
──────────────────────────────────────────────────────────────────*/
function WebVideoFeed({ items, height, onPageChangeRef, initialIndex = 0 }: {
  items: React.ReactNode[];
  height: number;
  onPageChangeRef: React.MutableRefObject<(i: number) => void>;
  initialIndex?: number;
}) {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);

  const goTo = useCallback((nextIdx: number, total: number) => {
    if (isAnimating.current) return;
    const clamped = Math.max(0, Math.min(total - 1, nextIdx));
    if (clamped === currentIdx) return; // même valeur, mais on a besoin de currentIdx...
    isAnimating.current = true;
    setCurrentIdx(clamped);
    onPageChangeRef.current(clamped);
    setTimeout(() => { isAnimating.current = false; }, 600);
  }, [currentIdx, onPageChangeRef]);

  /* Molette souris / trackpad */
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
      setTimeout(() => { isAnimating.current = false; }, 600);
    };
    window.addEventListener("wheel", handle, { passive: false });
    return () => window.removeEventListener("wheel", handle);
  }, [currentIdx, items.length, onPageChangeRef]);

  /* Touch (mobile web) */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) < 30) return;
    const dir = delta > 0 ? 1 : -1;
    const total = items.length;
    const next = Math.max(0, Math.min(total - 1, currentIdx + dir));
    if (next === currentIdx) return;
    isAnimating.current = true;
    setCurrentIdx(next);
    onPageChangeRef.current(next);
    setTimeout(() => { isAnimating.current = false; }, 600);
  }, [currentIdx, items.length, onPageChangeRef]);

  return (
    <div
      style={{ width: "100%", height, overflow: "hidden", position: "relative" } as React.CSSProperties}
      onTouchStart={handleTouchStart as any}
      onTouchEnd={handleTouchEnd as any}
    >
      <div
        style={{
          width: "100%",
          transform: `translateY(${-currentIdx * height}px)`,
          transition: "transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "transform",
        } as React.CSSProperties}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{ width: "100%", height, overflow: "hidden", flexShrink: 0 } as React.CSSProperties}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Composant principal
──────────────────────────────────────────────────────────────────*/
export default function VideoFeed({ children, onPageChange, initialIndex = 0 }: NativeVideoFeedProps) {
  const { height } = useWindowDimensions();
  const items = React.Children.toArray(children);

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  /* Hooks natifs — toujours déclarés avant tout return conditionnel */
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        onPageChangeRef.current(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  }).current;

  /* ── Web ── */
  if (Platform.OS === "web") {
    return (
      <WebVideoFeed
        items={items}
        height={height}
        onPageChangeRef={onPageChangeRef}
        initialIndex={initialIndex}
      />
    );
  }

  /* ── Native FlatList (Android / iOS) ── */
  const renderItem = ({ item }: { item: React.ReactNode }) => <>{item}</>;

  const getItemLayout = (_: any, index: number) => ({
    length: height,
    offset: height * index,
    index,
  });

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(_, i) => String(i)}
      pagingEnabled
      snapToInterval={height}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      getItemLayout={getItemLayout}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      maxToRenderPerBatch={2}
      windowSize={5}
      initialNumToRender={1}
      initialScrollIndex={initialIndex}
      removeClippedSubviews
      scrollEventThrottle={16}
    />
  );
}
