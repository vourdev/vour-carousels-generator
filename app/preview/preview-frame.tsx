// No interactivity → server component (kept out of the client bundle).
export function PreviewFrame({ html }: { html: string }) {
  return (
    <div className="overflow-auto rounded-md border border-hairline p-4">
      {/* 540×675 = the 1080×1350 slide at half scale for phone viewing.
          Scroll within the frame to see every slide. */}
      <iframe
        title="carousel preview"
        srcDoc={html}
        className="h-[675px] w-[540px] border-0"
      />
    </div>
  );
}
