"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { captureAction } from "@/app/create/actions";
import { namedBlobs, downloadNamedBlobs } from "@/lib/export/download";

export function ExportButton({ html }: { html: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onExport() {
    setPending(true);
    setError("");
    try {
      // Download-only: this button has no draft to attach the uploaded URLs to, so it
      // uses the base64 the capture returns alongside them.
      const { images } = await captureAction(html);
      const blobs = images.map((b) => {
        const bin = window.atob(b);
        const len = bin.length;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
        return new Blob([u8], { type: "image/jpeg" });
      });
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
