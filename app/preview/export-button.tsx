"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { captureCarousel } from "@/lib/export/capture";
import { namedBlobs, downloadNamedBlobs } from "@/lib/export/download";

export function ExportButton({ html }: { html: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onExport() {
    setPending(true);
    setError("");
    try {
      const blobs = await captureCarousel(html);
      downloadNamedBlobs(namedBlobs(blobs));
    } catch (e) {
      setError(e instanceof Error ? e.message : "export failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={onExport} disabled={pending}>
        {pending ? "Exporting…" : "Export images"}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
