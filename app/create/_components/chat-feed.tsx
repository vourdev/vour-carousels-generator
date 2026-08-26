"use client";

import { useEffect, useRef } from "react";
import { FileText, LayoutGrid, ImageIcon } from "lucide-react";
import { StepLoader, type LoadingKind } from "./step-loader";

export interface Message {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

/**
 * A produced artifact, surfaced in the conversation as a clickable card.
 *
 * This is what replaced the stepper: the way back to an earlier stage is the thing
 * itself, sitting in the transcript where it was made, rather than a numbered button
 * in the header that you have to map onto a mental model of the pipeline.
 */
export interface ArtifactCard {
  kind: "brief" | "slides" | "images";
  title: string;
  subtitle: string;
}

const ARTIFACT_ICON = {
  brief: FileText,
  slides: LayoutGrid,
  images: ImageIcon,
} as const;

export function ChatFeed({
  messages,
  busy,
  loadingJob,
  artifacts,
  onOpenArtifact,
  footer,
  emptyState,
}: {
  messages: Message[];
  busy: boolean;
  loadingJob: LoadingKind | null;
  artifacts: ArtifactCard[];
  onOpenArtifact: (kind: ArtifactCard["kind"]) => void;
  /** Contextual actions for the current stage, rendered under the last message. */
  footer?: React.ReactNode;
  /** Shown instead of the transcript before the first exchange. */
  emptyState?: React.ReactNode;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, loadingJob, footer]);

  const conversationStarted = messages.some((m) => m.sender === "user");

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Before the first exchange the feed has nothing to scroll, so the invitation is
          centred in the space instead of clinging to the top of an empty column. */}
      <div
        className={`mx-auto w-full max-w-[720px] px-4 md:px-6 py-6 flex flex-col gap-5 ${
          conversationStarted ? "" : "min-h-full justify-center"
        }`}
      >
        {!conversationStarted && emptyState}

        {conversationStarted &&
          messages.map((m, idx) =>
            m.sender === "user" ? (
              <div key={idx} className="flex justify-end">
                <div className="chat-bubble-user max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed">
                  {m.text}
                </div>
              </div>
            ) : (
              // Assistant turns are plain prose, not bubbles — the same choice Claude and
              // ChatGPT make. Bubbles on both sides make a transcript read as an argument.
              <div key={idx} className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {m.text}
              </div>
            )
          )}

        {artifacts.length > 0 && (
          <div className="flex flex-col gap-2">
            {artifacts.map((a) => {
              const Icon = ARTIFACT_ICON[a.kind];
              return (
                <button
                  key={a.kind}
                  type="button"
                  onClick={() => onOpenArtifact(a.kind)}
                  className="group flex items-center gap-3 w-full text-left rounded-xl border border-hairline bg-card hover:bg-muted/40 hover:border-primary/30 transition-colors px-3.5 py-3"
                >
                  <span className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{a.title}</span>
                    <span className="block text-xs text-muted-foreground truncate">{a.subtitle}</span>
                  </span>
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Buka
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {loadingJob && <StepLoader key={loadingJob} kind={loadingJob} variant="inline" />}

        {footer && <div className="flex flex-wrap items-center gap-2 pt-1">{footer}</div>}

        <div ref={endRef} />
      </div>
    </div>
  );
}
