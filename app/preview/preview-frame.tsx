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
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = width ? width / SLIDE_W : 0;
  const contentH = SLIDE_H * slideCount;

  return (
    <Card>
      <CardContent className="p-4">
        <div
          ref={ref}
          className="w-full overflow-hidden rounded-md border border-hairline"
          style={
            scale
              ? { height: contentH * scale }
              : { aspectRatio: `${SLIDE_W} / ${contentH}` }
          }
        >
          {scale > 0 && (
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
