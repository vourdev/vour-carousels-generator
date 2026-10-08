import type { TopicCategory, TopicStatus } from "@/lib/topics/bank";

export const CATEGORIES: { value: TopicCategory; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "evergreen", label: "Evergreen" },
  { value: "personal", label: "Personal" },
  { value: "product", label: "Product" },
  { value: "ai-workflow", label: "AI Workflow" },
  { value: "developer-tools", label: "Developer Tools" },
  { value: "automation", label: "Automation" },
  { value: "nextjs", label: "Next.js" },
  { value: "angular", label: "Angular" },
  { value: "productivity", label: "Productivity" },
  { value: "tutorial", label: "Tutorial" },
  { value: "common-mistakes", label: "Common Mistakes" },
  { value: "case-study", label: "Case Study" },
  { value: "deep-dive", label: "Deep Dive" },
];

export const categoryLabel = (value: string) => CATEGORIES.find((c) => c.value === value)?.label ?? value;

export const STATUS_TABS: { value: TopicStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "idea", label: "Idea" },
  { value: "queued", label: "Queued" },
  { value: "generated", label: "Generated" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const statusLabel = (value: TopicStatus) => STATUS_TABS.find((s) => s.value === value)?.label ?? value;

export function formatScheduled(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}
