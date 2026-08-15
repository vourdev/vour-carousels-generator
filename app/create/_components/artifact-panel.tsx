"use client";

import { X } from "lucide-react";
import { StepLoader, type LoadingKind } from "./step-loader";

export type ArtifactTab = "brief" | "preview" | "images" | "publish";

export interface ArtifactTabDef {
  id: ArtifactTab;
  label: string;
}

/**
 * The right-hand canvas: chrome only, content comes from the orchestrator.
 *
 * Tabs are passed in already filtered to what exists, so the panel never offers a view
 * of something that has not been produced yet. That is the progressive-disclosure rule
 * for this screen — a tab appearing is how you learn the stage moved on.
 */
export function ArtifactPanel({
  tabs,
  active,
  onSelect,
  onClose,
  loadingJob,
  children,
}: {
  tabs: ArtifactTabDef[];
  active: ArtifactTab;
  onSelect: (t: ArtifactTab) => void;
  onClose: () => void;
  loadingJob: LoadingKind | null;
  children: React.ReactNode;
}) {
  return (
    // No border or radius of its own: the studio is one container now, and the split
    // handle to the left of this panel is the only divider between the two panes.
    <aside className="flex flex-col h-full min-h-0 w-full bg-card overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-hairline shrink-0">
        <div className="flex items-center gap-0.5 min-w-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              aria-current={active === t.id}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                active === t.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup panel"
          className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="relative flex-1 min-h-0 flex flex-col">
        {children}
        {loadingJob && <StepLoader key={loadingJob} kind={loadingJob} />}
      </div>
    </aside>
  );
}
