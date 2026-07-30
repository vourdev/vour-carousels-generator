"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Sparkles, Calendar, CalendarRange, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";
import type { Topic, TopicCategory, TopicStatus } from "@/lib/topics/bank";
import {
  createTopicAction,
  deleteTopicAction,
  generateTopicsAction,
  listTopicsAction,
  updateTopicAction,
} from "./actions";

const CATEGORIES: { value: TopicCategory; label: string }[] = [
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

const STATUS_LABELS: Record<TopicStatus, { label: string; color: string }> = {
  idea: { label: "Idea", color: "bg-gray-100 text-gray-700" },
  queued: { label: "Queued", color: "bg-blue-100 text-blue-700" },
  generated: { label: "Generated", color: "bg-green-100 text-green-700" },
  published: { label: "Published", color: "bg-purple-100 text-purple-700" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-500" },
};

function formatScheduled(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}

export function TopicBank() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<TopicCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<TopicStatus | "all">("all");

  // Generation quality settings
  const [focusArea, setFocusArea] = useState("");
  const [directives, setDirectives] = useState("");
  const [research, setResearch] = useState(false);

  // Manual add form
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<TopicCategory>("tutorial");
  const [formDescription, setFormDescription] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formAngle, setFormAngle] = useState("");

  const fetchTopics = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listTopicsAction({
        category: filterCategory === "all" ? undefined : filterCategory,
        status: filterStatus === "all" ? undefined : filterStatus,
      });
      setTopics(list);
    } catch {
      toast.error("Gagal load topics");
    } finally {
      setIsLoading(false);
    }
  }, [filterCategory, filterStatus]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleGenerate = (mode: "weekly" | "monthly" | "ideas") => {
    startTransition(async () => {
      try {
        const saved = await generateTopicsAction({
          mode,
          count: mode === "ideas" ? 7 : undefined,
          category: filterCategory === "all" ? undefined : filterCategory,
          focusArea: focusArea.trim() || undefined,
          directives: directives.trim() || undefined,
          research,
          startDate: new Date().toISOString(),
        });
        toast.success(
          mode === "monthly"
            ? `${saved.length} topics ter-generate untuk 4 minggu ke depan!`
            : mode === "weekly"
              ? `${saved.length} topics ter-generate untuk minggu ini!`
              : `${saved.length} topic ideas ter-generate!`
        );
        fetchTopics();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed";
        toast.error(`Gagal generate topics: ${msg}`);
      }
    });
  };

  const handleAddTopic = () => {
    if (!formTitle.trim()) {
      toast.error("Title harus diisi");
      return;
    }
    startTransition(async () => {
      try {
        await createTopicAction({
          title: formTitle,
          category: formCategory,
          description: formDescription || undefined,
          keywords: formKeywords.split(",").map((k) => k.trim()).filter(Boolean),
          angle: formAngle || undefined,
          priority: 5,
        });
        toast.success("Topic berhasil ditambahkan");
        setShowAddForm(false);
        setFormTitle("");
        setFormDescription("");
        setFormKeywords("");
        setFormAngle("");
        fetchTopics();
      } catch {
        toast.error("Gagal menambahkan topic");
      }
    });
  };

  const handleDeleteTopic = (topicId: string) => {
    if (!confirm("Hapus topic ini?")) return;
    startTransition(async () => {
      try {
        await deleteTopicAction(topicId);
        toast.success("Topic berhasil dihapus");
        fetchTopics();
      } catch {
        toast.error("Gagal menghapus topic");
      }
    });
  };

  const handleUpdateStatus = (topicId: string, newStatus: TopicStatus) => {
    startTransition(async () => {
      try {
        await updateTopicAction(topicId, { status: newStatus });
        toast.success("Status updated");
        fetchTopics();
      } catch {
        toast.error("Gagal update status");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => handleGenerate("weekly")} disabled={isPending} className="gap-2">
            <Calendar className="size-4" />
            Generate Weekly (7)
          </Button>
          <Button
            onClick={() => handleGenerate("monthly")}
            disabled={isPending}
            className="gap-2"
            variant="default"
          >
            <CalendarRange className="size-4" />
            Generate Monthly (28)
          </Button>
          <Button
            onClick={() => handleGenerate("ideas")}
            disabled={isPending}
            className="gap-2"
            variant="outline"
          >
            <Sparkles className="size-4" />
            Generate Ideas
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" className="gap-2">
            <Plus className="size-4" />
            Add Manual
          </Button>
        </div>

        <Button onClick={fetchTopics} disabled={isLoading} variant="secondary" size="sm">
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Generation quality settings */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Generation Settings</h3>
          <Input
            placeholder="Focus area (mis. Next.js 16, AI agents, backend performance)"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
          />
          <Textarea
            placeholder="Quality directives (mis. prioritaskan topik yang lagi rame minggu ini, hindari topik yang sudah pernah dibuat, target audience pemula)"
            value={directives}
            onChange={(e) => setDirectives(e.target.value)}
            rows={2}
          />
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={research}
              onChange={(e) => setResearch(e.target.checked)}
              className="size-4 accent-foreground"
            />
            <Globe className="size-3.5" />
            Riset berita/tren dev terkini dulu (web search) sebelum generate
          </label>
          {isPending && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Generating{research ? " (riset tren dulu, bisa ~1 menit)" : ""}…
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as TopicCategory | "all")}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TopicStatus | "all")}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Add New Topic</h3>
            <Input
              placeholder="Topic Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            <Select value={formCategory} onValueChange={(v) => setFormCategory(v as TopicCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Description (optional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
            />
            <Input
              placeholder="Keywords (comma-separated)"
              value={formKeywords}
              onChange={(e) => setFormKeywords(e.target.value)}
            />
            <Input
              placeholder="Angle (e.g., fokus: Panduan Praktis)"
              value={formAngle}
              onChange={(e) => setFormAngle(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddTopic} disabled={isPending}>
                Save
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="ghost">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topics List */}
      <div className="grid gap-3 md:grid-cols-2">
        {topics.length === 0 && !isLoading && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <p>Belum ada topics. Generate weekly/monthly topics atau add manual.</p>
          </div>
        )}

        {topics.map((topic) => {
          const scheduled = formatScheduled(topic.scheduledDate);
          return (
            <Card key={topic.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm line-clamp-2">{topic.title}</h3>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-muted">
                        {CATEGORIES.find((c) => c.value === topic.category)?.label ?? topic.category}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${STATUS_LABELS[topic.status].color}`}
                      >
                        {STATUS_LABELS[topic.status].label}
                      </span>
                      {scheduled && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                          {scheduled}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteTopic(topic.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {topic.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
                )}

                {topic.keywords.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {topic.keywords.slice(0, 3).map((keyword) => (
                      <span
                        key={keyword}
                        className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                {topic.angle && (
                  <p className="text-xs text-muted-foreground italic">{topic.angle}</p>
                )}

                <div className="flex gap-2 pt-2">
                  {(topic.status === "idea" || topic.status === "queued") && (
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs gap-1"
                      onClick={() => router.push(`/create?topic=${topic.id}`)}
                    >
                      <Sparkles className="size-3" />
                      Buat Carousel
                    </Button>
                  )}
                  {topic.status === "idea" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleUpdateStatus(topic.id, "queued")}
                    >
                      Queue
                    </Button>
                  )}
                  {topic.status !== "archived" && topic.status !== "published" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => handleUpdateStatus(topic.id, "archived")}
                    >
                      Archive
                    </Button>
                  )}
                  {topic.status === "generated" && topic.carouselId && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                      onClick={() => router.push("/history")}
                    >
                      View Carousel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
