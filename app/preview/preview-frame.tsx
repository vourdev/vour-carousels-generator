"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const SLIDE_W = 1080;
const SLIDE_H = 1350;

/** Renders the 1080-wide carousel scaled to the card's full width — every
    slide fully visible, no clipping. Scale = containerWidth / 1080. */
export function PreviewFrame({ html, slideCount }: { html: string; slideCount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

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

  const scale = width ? width / SLIDE_W : 0.5;
  const contentH = SLIDE_H * slideCount;

  return (
    <Card className="w-full max-w-[540px]">
      <CardContent className="p-4">
        <div
          ref={ref}
          className="w-full overflow-hidden rounded-md border border-hairline bg-white"
          style={
            scale
              ? { height: contentH * scale }
              : { aspectRatio: `${SLIDE_W} / ${contentH}` }
          }
        >
          {width > 0 && (
            <iframe
              title="carousel preview"
              srcDoc={html}
              style={{
                width: SLIDE_W,
                height: contentH,
                border: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
