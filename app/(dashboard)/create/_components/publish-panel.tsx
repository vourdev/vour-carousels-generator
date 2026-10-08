"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface PublishState {
  status: "idle" | "uploading" | "publishing" | "success" | "error";
  progressMsg: string;
  errorMsg?: string;
  igPostId?: string;
  ttPostId?: string;
}

/** Scheduling + caption, shown only once there are images to publish. */
export function PublishPanel({
  dueAt,
  onDueAtChange,
  title,
  onTitleChange,
  caption,
  onCaptionChange,
  onCommitEdits,
  config,
  state,
  onPublish,
  onSaveToStock,
  onReset,
}: {
  dueAt: string;
  onDueAtChange: (v: string) => void;
  title: string;
  onTitleChange: (v: string) => void;
  caption: string;
  onCaptionChange: (v: string) => void;
  onCommitEdits: () => void;
  config: { hasIg: boolean; hasTt: boolean } | null;
  state: PublishState;
  onPublish: () => void;
  onSaveToStock: () => void;
  onReset: () => void;
}) {
  const locked = state.status === "uploading" || state.status === "publishing";
  const noDestination = !config?.hasIg && !config?.hasTt;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="p-3.5 flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-2.5">
          <Destination name="Instagram" active={Boolean(config?.hasIg)} envVar="BUFFER_IG_CHANNEL_ID" />
          <Destination name="TikTok" active={Boolean(config?.hasTt)} envVar="BUFFER_TIKTOK_CHANNEL_ID" />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" />
            Waktu posting
          </span>
          <Input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => onDueAtChange(e.target.value)}
            disabled={locked}
            className="text-xs"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">Judul (TikTok)</span>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onCommitEdits}
            disabled={locked}
            placeholder="Judul postingan…"
            className="text-xs"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">Caption (Instagram &amp; TikTok)</span>
          <Textarea
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            onBlur={onCommitEdits}
            disabled={locked}
            placeholder="Tulis caption di sini…"
            className="text-xs h-28 resize-none"
          />
        </label>

        {state.status === "idle" && (
          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={onPublish} disabled={noDestination} className="font-medium">
              Jadwalkan lewat Buffer
            </Button>
            <Button onClick={onSaveToStock} variant="outline" className="font-medium">
              Simpan ke Stock Konten
            </Button>
            {noDestination && (
              <p className="text-[11px] text-muted-foreground text-center">
                Belum ada tujuan aktif. Isi salah satu channel Buffer di <span className="font-mono">.env</span> untuk menjadwalkan.
              </p>
            )}
          </div>
        )}

        {locked && (
          <div className="flex flex-col items-center gap-2.5 py-4">
            <div className="size-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs text-foreground">{state.progressMsg}</p>
          </div>
        )}

        {state.status === "success" && (
          <div className="flex flex-col items-center gap-2.5 py-3 text-center">
            <CheckCircle2 className="size-7 text-emerald-500" />
            <p className="text-xs font-medium text-emerald-600">{state.progressMsg || "Berhasil!"}</p>
            {(state.igPostId || state.ttPostId) && (
              <div className="w-full text-left text-[11px] font-mono border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-2.5 space-y-1">
                {state.igPostId && <div>Instagram: {state.igPostId}</div>}
                {state.ttPostId && <div>TikTok: {state.ttPostId}</div>}
              </div>
            )}
            <Button onClick={onReset} className="w-full mt-1 font-medium">
              Buat konten baru
            </Button>
          </div>
        )}

        {state.status === "error" && (
          <div className="flex flex-col items-center gap-2.5 py-3 text-center">
            <XCircle className="size-7 text-destructive" />
            <p className="text-xs font-medium text-destructive">Gagal mempublikasikan</p>
            <p className="w-full text-[11px] text-muted-foreground border border-destructive/20 bg-destructive/5 rounded-lg p-2.5 font-mono text-left max-h-32 overflow-y-auto">
              {state.errorMsg}
            </p>
            <Button onClick={onPublish} variant="outline" className="w-full">
              Coba lagi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Destination({ name, active, envVar }: { name: string; active: boolean; envVar: string }) {
  return (
    <div className="bg-card border border-hairline rounded-lg p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{name}</span>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            active
              ? "text-emerald-600 bg-emerald-500/10 border border-emerald-500/20"
              : "text-muted-foreground bg-muted border border-border"
          }`}
        >
          {active ? "Aktif" : "Nonaktif"}
        </span>
      </div>
      {!active && (
        <p className="text-[10px] text-muted-foreground mt-1 font-mono truncate" title={envVar}>
          {envVar}
        </p>
      )}
    </div>
  );
}
