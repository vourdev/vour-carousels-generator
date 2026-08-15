"use client";

export const STAGES = [
  { id: 1, label: "Ide" },
  { id: 2, label: "Brief" },
  { id: 3, label: "Slide" },
  { id: 4, label: "Gambar" },
  { id: 5, label: "Jadwal" },
] as const;

/**
 * Where you are, in one line.
 *
 * This replaces the five clickable step buttons that dominated the old header. Jumping
 * between stages now happens by clicking an artifact card in the conversation, which is
 * where the thing you want to go back to actually is — so this only has to answer
 * "how far along am I", and can be small enough to ignore.
 */
export function ProgressStrip({ step }: { step: number }) {
  const current = STAGES.find((s) => s.id === step) ?? STAGES[0];

  return (
    <div className="flex items-center gap-2 min-w-0" aria-label={`Tahap ${step} dari ${STAGES.length}: ${current.label}`}>
      <div className="flex items-center gap-1" aria-hidden="true">
        {STAGES.map((s) => (
          <span
            key={s.id}
            className={`h-1 rounded-full transition-all duration-300 ${
              s.id === step
                ? "w-5 bg-primary"
                : s.id < step
                  ? "w-1.5 bg-primary/40"
                  : "w-1.5 bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground truncate">
        {current.label}
        <span className="text-muted-foreground/50 font-mono ml-1.5">
          {step}/{STAGES.length}
        </span>
      </span>
    </div>
  );
}
