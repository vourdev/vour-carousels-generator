"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SLIDE_W = 1080;
const SLIDE_H = 1350;

/** Renders the 1080-wide carousel scaled to the card's full width — every
    slide fully visible, no clipping. Scale = containerWidth / 1080. */
export function PreviewFrame({ html, slideCount }: { html: string; slideCount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [width, setWidth] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    // Set initial width
    setWidth(el.getBoundingClientRect().width || el.offsetWidth || 540);
    
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) {
        setWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll to slide on change
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.scrollTo({
        top: currentSlide * SLIDE_H,
        behavior: "smooth"
      });
    } catch (e) {
      console.error(e);
    }
  }, [currentSlide, html]);

  // Adjust scroll when slide count changes to avoid out of bounds
  useEffect(() => {
    if (currentSlide >= slideCount && slideCount > 0) {
      setCurrentSlide(slideCount - 1);
    }
  }, [slideCount, currentSlide]);

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.scrollTo(0, currentSlide * SLIDE_H);
  };

  const scale = width ? width / SLIDE_W : 0.5;
  const viewportH = SLIDE_H * scale;

  return (
    <Card className="w-full max-w-[540px]">
      <CardContent className="p-4 flex flex-col gap-4">
        
        {/* Slide Frame (Viewport height of 1 slide) */}
        <div
          ref={ref}
          className="w-full overflow-hidden rounded-md border border-hairline bg-white"
          style={{
            height: viewportH,
            aspectRatio: `${SLIDE_W} / ${SLIDE_H}`
          }}
        >
          {width > 0 && (
            <iframe
              ref={iframeRef}
              onLoad={handleIframeLoad}
              title="carousel preview"
              srcDoc={html}
              style={{
                width: SLIDE_W,
                height: SLIDE_H * slideCount,
                border: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                overflow: "hidden"
              }}
            />
          )}
        </div>

        {/* Presenter Pagination Footer */}
        <div className="flex items-center justify-between border-t pt-3 mt-1 text-xs">
          <Button
            size="sm"
            variant="outline"
            disabled={currentSlide === 0}
            onClick={() => setCurrentSlide((c) => Math.max(0, c - 1))}
            className="h-8 px-3 font-medium text-[11px]"
          >
            Prev
          </Button>

          <span className="font-mono text-[10px] text-muted-foreground font-semibold">
            Slide {currentSlide + 1} of {slideCount}
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={currentSlide === slideCount - 1}
            onClick={() => setCurrentSlide((c) => Math.min(slideCount - 1, c + 1))}
            className="h-8 px-3 font-medium text-[11px]"
          >
            Next
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
