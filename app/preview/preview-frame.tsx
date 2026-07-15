// No interactivity → server component (kept out of the client bundle).
import { Card, CardContent } from "@/components/ui/card";

const SLIDE_W = 1080;
const SLIDE_H = 1350;
const SCALE = 1 / 3; // 1080×1350 → 360×450 per slide for phone viewing.

export function PreviewFrame({ html, slideCount }: { html: string; slideCount: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        {/* Render the iframe at true size, then CSS-scale it down so every
            slide is fully visible (no clipping). */}
        <div
          className="mx-auto overflow-hidden rounded-md border border-hairline"
          style={{ width: SLIDE_W * SCALE, height: SLIDE_H * slideCount * SCALE }}
        >
          <iframe
            title="carousel preview"
            srcDoc={html}
            style={{
              width: SLIDE_W,
              height: SLIDE_H * slideCount,
              border: 0,
              transform: `scale(${SCALE})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
