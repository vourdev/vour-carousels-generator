import { Sparkles } from "lucide-react";

/** Minimal markdown renderer for the brief outline — headings, slide markers, lists, bold. */
export function renderMarkdown(md: string) {
  if (!md) return <p className="text-muted-foreground italic text-xs">Brief outline kosong...</p>;

  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed === "---") {
      elements.push(<hr key={idx} className="my-4 border-hairline" />);
      return;
    }

    if (trimmed.startsWith("# ")) {
      const title = trimmed.substring(2);
      const isSlideHeader = title.toLowerCase().includes("slide");
      if (isSlideHeader) {
        elements.push(
          <div key={idx} className="mt-5 mb-3 flex items-center gap-2 p-2.5 px-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs shadow-xs">
            <Sparkles className="size-4 shrink-0" />
            <span>{title}</span>
          </div>
        );
      } else {
        elements.push(
          <h1 key={idx} className="text-base font-bold tracking-tight text-foreground border-b pb-2 mt-4 mb-3 first:mt-0 font-heading">
            {title}
          </h1>
        );
      }
    } else if (trimmed.startsWith("## ")) {
      const text = trimmed.substring(3);
      const isEyebrow = text.toLowerCase() === "eyebrow";
      const isHeadline = text.toLowerCase() === "headline";
      const isHighlight = text.toLowerCase().includes("highlight");
      const isVisual = text.toLowerCase().includes("visual");

      elements.push(
        <h2 key={idx} className={`text-xs font-semibold uppercase tracking-wider mt-3 mb-1 font-heading ${isEyebrow ? "text-indigo-400 font-mono" :
            isHeadline ? "text-amber-400 font-bold" :
              isHighlight ? "text-emerald-400 font-semibold" :
                isVisual ? "text-purple-400 font-semibold" :
                  "text-muted-foreground border-b border-hairline pb-0.5"
          }`}>
          {text}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={idx} className="text-xs font-semibold text-muted-foreground mt-2 mb-1">
          {trimmed.substring(4)}
        </h3>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const text = trimmed.substring(2);
      let content: React.ReactNode = text;
      if (text.includes("**")) {
        const parts = text.split("**");
        content = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-primary px-1 py-0.5 rounded bg-primary/10">{part}</strong> : part);
      }
      elements.push(
        <li key={idx} className="text-xs list-disc ml-4 my-1 text-muted-foreground leading-relaxed">
          {content}
        </li>
      );
    } else if (trimmed === "") {
      elements.push(<div key={idx} className="h-1" />);
    } else {
      let content: React.ReactNode = trimmed;
      if (trimmed.includes("**")) {
        const parts = trimmed.split("**");
        content = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-primary underline decoration-primary/50 underline-offset-2">{part}</strong> : part);
      }
      elements.push(
        <p key={idx} className="text-xs text-muted-foreground leading-relaxed my-1">
          {content}
        </p>
      );
    }
  });

  return <div className="space-y-0.5">{elements}</div>;
}
