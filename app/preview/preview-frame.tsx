// No interactivity → server component (kept out of the client bundle).
import { Card, CardContent } from "@/components/ui/card";

export function PreviewFrame({ html }: { html: string }) {
  return (
    <Card>
      <CardContent className="overflow-auto p-4">
        {/* 540×675 = the 1080×1350 slide at half scale for phone viewing.
            Scroll within the frame to see every slide. */}
        <iframe
          title="carousel preview"
          srcDoc={html}
          className="h-[675px] w-[540px] border-0"
        />
      </CardContent>
    </Card>
  );
}
