import React, { useRef, useEffect, useCallback } from "react";

interface WebVideoFeedProps {
  children: React.ReactNode[];
  onPageChange: (i: number) => void;
}

export default function VideoFeed({ children, onPageChange }: WebVideoFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const reportPage = useCallback(() => {
    const el = feedRef.current;
    if (!el) return;
    const h = el.clientHeight || window.innerHeight;
    if (h === 0) return;
    const index = Math.round(el.scrollTop / h);
    onPageChangeRef.current(index);
  }, []);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(reportPage, 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [reportPage]);

  return (
    <>
      <style>{`
        .tiktok-feed {
          scroll-snap-type: y mandatory;
          -webkit-overflow-scrolling: touch;
          overflow-y: scroll;
          overflow-x: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .tiktok-feed::-webkit-scrollbar { display: none; }
        .tiktok-page {
          scroll-snap-align: start;
          scroll-snap-stop: always;
          flex: 0 0 100%;
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
      `}</style>
      <div ref={feedRef} className="tiktok-feed">
        {React.Children.map(children, (child, i) => (
          <div key={i} className="tiktok-page">
            {child}
          </div>
        ))}
      </div>
    </>
  );
}
