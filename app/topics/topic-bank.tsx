"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Sparkles,
  Calendar,
  CalendarRange,
  Trash2,
  Globe,
  FileText,
  Link as LinkIcon,
  Layers,
  X,
  Loader2,
  Search,
  SlidersHorizontal,
  LayoutList,
  LayoutGrid,
  CheckSquare,
  Square,
  MinusSquare,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Archive,
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import type { Topic, TopicCategory, TopicStatus } from "@/lib/topics/bank";
import {
  createTopicAction,
  deleteTopicAction,
  bulkDeleteTopicsAction,
  bulkUpdateTopicStatusAction,
  deleteTopicsByStatusAction,
  generateFromNotesAction,
  generateTopicsAction,
  getProductsAction,
  listTopicsAction,
  updateTopicAction,
  type Product,
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

const STATUS_CONFIG: Record<
  TopicStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  idea: {
    label: "Idea",
    color: "bg-muted text-muted-foreground border-border",
    icon: Inbox,
  },
  queued: {
    label: "Queued",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  generated: {
    label: "Generated",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Sparkles,
  },
  published: {
    label: "Published",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    icon: CheckCircle2,
  },
  archived: {
    label: "Archived",
    color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
    icon: Archive,
  },
};

type SortOption = "priority" | "newest" | "oldest" | "title" | "scheduled";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters, search & view controls
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TopicStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<TopicCategory | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals & Panels
  const [showSettings, setShowSettings] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showClearPublishedDialog, setShowClearPublishedDialog] = useState(false);

  // Notes extraction
  const [notesText, setNotesText] = useState("");

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
  const [formRelatedProduct, setFormRelatedProduct] = useState<string>("none");

  const productsMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      map.set(p.id, p);
    }
    return map;
  }, [products]);

  const fetchTopics = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await listTopicsAction();
      setTopics(list);
    } catch {
      toast.error("Gagal load topics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const list = await getProductsAction();
      setProducts(list);
    } catch {
      // Backend products endpoint may be offline or empty
    }
  }, []);

  useEffect(() => {
    fetchTopics();
    fetchProducts();
  }, [fetchTopics, fetchProducts]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, filterCategory, sortBy, pageSize]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = {
      all: topics.length,
      idea: 0,
      queued: 0,
      generated: 0,
      published: 0,
      archived: 0,
    };
    for (const t of topics) {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    }
    return counts;
  }, [topics]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of topics) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, [topics]);

  // Distribution calculation
  const categoryStats = useMemo(() => {
    if (topics.length === 0) return null;
    const total = topics.length;
    const entries = Object.entries(categoryCounts)
      .map(([cat, count]) => {
        const label = CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
        const pct = Math.round((count / total) * 100);
        return { cat, label, count, pct };
      })
      .sort((a, b) => b.count - a.count);
    return { total, entries };
  }, [topics, categoryCounts]);

  // Filtered & Sorted Topics Pipeline
  const filteredTopics = useMemo(() => {
    return topics
      .filter((topic) => {
        // Tab Filter
        if (activeTab !== "all" && topic.status !== activeTab) {
          return false;
        }
        // Category Filter
        if (filterCategory !== "all" && topic.category !== filterCategory) {
          return false;
        }
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const prodName =
            (topic.relatedProductId
              ? productsMap.get(topic.relatedProductId)?.name
              : "")?.toLowerCase() || "";
          const matchTitle = topic.title.toLowerCase().includes(q);
          const matchDesc = topic.description?.toLowerCase().includes(q) || false;
          const matchAngle = topic.angle?.toLowerCase().includes(q) || false;
          const matchKeywords = topic.keywords.some((k) => k.toLowerCase().includes(q));
          const matchProduct = prodName.includes(q);
          if (!matchTitle && !matchDesc && !matchAngle && !matchKeywords && !matchProduct) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          return (b.priority ?? 0) - (a.priority ?? 0) || b.createdAt - a.createdAt;
        }
        if (sortBy === "newest") {
          return b.createdAt - a.createdAt;
        }
        if (sortBy === "oldest") {
          return a.createdAt - b.createdAt;
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === "scheduled") {
          if (!a.scheduledDate && !b.scheduledDate) return 0;
          if (!a.scheduledDate) return 1;
          if (!b.scheduledDate) return -1;
          return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        }
        return 0;
      });
  }, [topics, activeTab, filterCategory, searchQuery, sortBy, productsMap]);

  // Pagination calculation
  const totalItems = filteredTopics.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTopics = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredTopics.slice(startIndex, startIndex + pageSize);
  }, [filteredTopics, validCurrentPage, pageSize]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allVisibleSelected =
        paginatedTopics.length > 0 && paginatedTopics.every((t) => next.has(t.id));
      if (allVisibleSelected) {
        // Deselect visible
        for (const t of paginatedTopics) {
          next.delete(t.id);
        }
      } else {
        // Select all visible
        for (const t of paginatedTopics) {
          next.add(t.id);
        }
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(new Set(filteredTopics.map((t) => t.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const isAllVisibleSelected =
    paginatedTopics.length > 0 && paginatedTopics.every((t) => selectedIds.has(t.id));
  const isSomeVisibleSelected =
    paginatedTopics.some((t) => selectedIds.has(t.id)) && !isAllVisibleSelected;

  // Single Action Handlers
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

  const handleGenerateFromNotes = () => {
    if (!notesText.trim()) {
      toast.error("Catatan mentah tidak boleh kosong");
      return;
    }
    startTransition(async () => {
      try {
        const extracted = await generateFromNotesAction(notesText.trim());
        toast.success(`${extracted.length} topic ideas berhasil di-extract dari catatan!`);
        setShowNotesModal(false);
        setNotesText("");
        fetchTopics();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed";
        toast.error(`Gagal extract topics: ${msg}`);
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
          relatedProductId:
            formRelatedProduct === "none" || !formRelatedProduct
              ? undefined
              : formRelatedProduct,
          priority: 5,
        });
        toast.success("Topic berhasil ditambahkan");
        setShowAddForm(false);
        setFormTitle("");
        setFormDescription("");
        setFormKeywords("");
        setFormAngle("");
        setFormRelatedProduct("none");
        fetchTopics();
      } catch {
        toast.error("Gagal menambahkan topic");
      }
    });
  };

  const handleConfirmDeleteSingle = () => {
    if (!topicToDelete) return;
    const targetId = topicToDelete.id;
    startTransition(async () => {
      try {
        await deleteTopicAction(targetId);
        toast.success("Topic berhasil dihapus");
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        setTopicToDelete(null);
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
        toast.success(`Status diubah ke ${STATUS_CONFIG[newStatus].label}`);
        fetchTopics();
      } catch {
        toast.error("Gagal update status");
      }
    });
  };

  // Bulk Actions
  const handleBulkStatus = (newStatus: TopicStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await bulkUpdateTopicStatusAction(ids, newStatus);
        toast.success(`${ids.length} topik berhasil diubah ke ${STATUS_CONFIG[newStatus].label}`);
        handleClearSelection();
        fetchTopics();
      } catch {
        toast.error("Gagal update status topik terpilih");
      }
    });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await bulkDeleteTopicsAction(ids);
        toast.success(`${ids.length} topik berhasil dihapus`);
        handleClearSelection();
        setShowBulkDeleteDialog(false);
        fetchTopics();
      } catch {
        toast.error("Gagal menghapus topik terpilih");
      }
    });
  };

  const handleClearAllPublished = () => {
    startTransition(async () => {
      try {
        const count = await deleteTopicsByStatusAction("published");
        toast.success(`${count} topik berstatus Published berhasil dibersihkan`);
        handleClearSelection();
        setShowClearPublishedDialog(false);
        fetchTopics();
      } catch {
        toast.error("Gagal membersihkan topik published");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Action Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between pb-1">
        <div className="flex gap-2 flex-wrap items-center">
          <Button
            onClick={() => handleGenerate("weekly")}
            disabled={isPending}
            className="gap-2 shadow-xs h-8.5 cursor-pointer"
            size="sm"
          >
            <Calendar className="size-4" />
            Weekly (7)
          </Button>
          <Button
            onClick={() => handleGenerate("monthly")}
            disabled={isPending}
            className="gap-2 shadow-xs h-8.5 cursor-pointer"
            variant="default"
            size="sm"
          >
            <CalendarRange className="size-4" />
            Monthly (28)
          </Button>
          <Button
            onClick={() => handleGenerate("ideas")}
            disabled={isPending}
            className="gap-2 shadow-xs h-8.5 cursor-pointer"
            variant="outline"
            size="sm"
          >
            <Sparkles className="size-4" />
            Ideas
          </Button>
          <Button
            onClick={() => setShowNotesModal(true)}
            disabled={isPending}
            className="gap-2 shadow-xs h-8.5 cursor-pointer"
            variant="outline"
            size="sm"
          >
            <FileText className="size-4" />
            From Notes
          </Button>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? "secondary" : "outline"}
            className="gap-1.5 shadow-xs h-8.5 cursor-pointer"
            size="sm"
          >
            <Plus className="size-4" />
            Add Manual
          </Button>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 border border-hairline h-8.5 cursor-pointer"
          >
            <SlidersHorizontal className="size-3.5" />
            Settings
            {(focusArea || directives || research) && (
              <span className="size-1.5 rounded-full bg-primary" />
            )}
          </Button>

          <Button
            onClick={fetchTopics}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground border border-hairline h-8.5 cursor-pointer"
          >
            <RotateCcw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* 2. Collapsible Generation Quality Settings */}
      {showSettings && (
        <Card className="border-border/70 bg-card/60 backdrop-blur-xs shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-primary" />
                Generation Quality Parameters
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="size-6 p-0 cursor-pointer"
                onClick={() => setShowSettings(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Focus area (mis. Next.js 16, AI agents, backend performance)"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="text-xs"
              />
              <Textarea
                placeholder="Quality directives (mis. prioritaskan topik viral, hindari duplikat, target audience pemula)"
                value={directives}
                onChange={(e) => setDirectives(e.target.value)}
                rows={1}
                className="text-xs resize-none"
              />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={research}
                onChange={(e) => setResearch(e.target.checked)}
                className="size-3.5 rounded accent-primary"
              />
              <Globe className="size-3.5 text-primary" />
              Riset berita/tren dev terkini dulu (web search) sebelum generate
            </label>
            {isPending && (
              <p className="text-xs text-muted-foreground animate-pulse">
                Generating{research ? " (riset tren dulu, bisa ~1 menit)" : ""}…
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Category Distribution Bar */}
      {categoryStats && categoryStats.entries.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-hairline text-xs text-muted-foreground flex-wrap">
          <span className="font-semibold text-foreground/80 flex items-center gap-1.5 shrink-0">
            <Layers className="size-3.5 text-primary" />
            Distribusi ({categoryStats.total}):
          </span>
          <span className="leading-relaxed">
            {categoryStats.entries.map((e) => `${e.label} ${e.pct}%`).join(" · ")}
          </span>
        </div>
      )}

      {/* 4. Add Manual Form */}
      {showAddForm && (
        <Card className="border-primary/40 shadow-md animate-in fade-in slide-in-from-top-2 duration-150">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Add New Topic Manual</h3>
              <Button
                variant="ghost"
                size="sm"
                className="size-6 p-0 cursor-pointer"
                onClick={() => setShowAddForm(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
            <Input
              placeholder="Topic Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">
                  Category
                </label>
                <Select
                  value={formCategory}
                  onValueChange={(v) => setFormCategory(v as TopicCategory)}
                >
                  <SelectTrigger className="w-full">
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
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">
                  Related Product (Opsional)
                </label>
                <Select
                  value={formRelatedProduct}
                  onValueChange={(v) => setFormRelatedProduct(v ?? "none")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih produk terkait" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Bukan soft-sell)</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.keyBenefit ? `— ${p.keyBenefit}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Textarea
              placeholder="Description (optional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button onClick={() => setShowAddForm(false)} variant="ghost" size="sm" className="cursor-pointer">
                Cancel
              </Button>
              <Button onClick={handleAddTopic} disabled={isPending} size="sm" className="cursor-pointer">
                Save Topic
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Navigation Tabs & Status Counts */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-hairline pb-2">
        <div className="flex gap-1.5 flex-wrap">
          {(
            [
              { id: "all", label: "All", count: statusCounts.all },
              { id: "idea", label: "Idea", count: statusCounts.idea },
              { id: "queued", label: "Queued", count: statusCounts.queued },
              { id: "generated", label: "Generated", count: statusCounts.generated },
              { id: "published", label: "Published", count: statusCounts.published },
              { id: "archived", label: "Archived", count: statusCounts.archived },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TopicStatus | "all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive
                      ? "bg-background/20 text-background font-bold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Clean Published Action */}
        {statusCounts.published > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearPublishedDialog(true)}
            className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1.5 h-8 font-medium shadow-2xs cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            Clear Published ({statusCounts.published})
          </Button>
        )}
      </div>

      {/* 6. Filter, Search & View Mode Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search & Category Filter */}
        <div className="flex gap-2 flex-1 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search topics, keywords, products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 h-9 text-xs bg-card"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <Select
            value={filterCategory}
            onValueChange={(v) => setFilterCategory(v as TopicCategory | "all")}
          >
            <SelectTrigger className="w-[190px] h-9 text-xs bg-card">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({topics.length})</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label} ({categoryCounts[cat.value] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort & View Mode Switcher */}
        <div className="flex gap-2 items-center self-end sm:self-auto">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px] h-9 text-xs bg-card">
              <ArrowUpDown className="size-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority (High-Low)</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="scheduled">Scheduled Date</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border border-hairline rounded-lg p-0.5 bg-card">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-muted text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table / List View"
            >
              <LayoutList className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-muted text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Floating Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-40 bg-zinc-900/95 dark:bg-zinc-950/95 text-white border border-zinc-700/60 rounded-xl p-2.5 px-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 flex-wrap animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAllVisible}
              className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center cursor-pointer"
              title={isAllVisibleSelected ? "Deselect All on Page" : "Select All on Page"}
            >
              {isAllVisibleSelected ? (
                <CheckSquare className="size-4.5 text-emerald-400" />
              ) : isSomeVisibleSelected ? (
                <MinusSquare className="size-4.5 text-emerald-400" />
              ) : (
                <Square className="size-4.5 text-zinc-400" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                  {selectedIds.size}
                </span>
                Topik Terpilih
              </span>
              {selectedIds.size < filteredTopics.length && (
                <button
                  onClick={handleSelectAllFiltered}
                  className="text-xs text-emerald-400 underline hover:text-emerald-300 ml-1 transition-colors cursor-pointer"
                >
                  Pilih semua {filteredTopics.length} hasil
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant="secondary"
              className="h-7.5 text-xs gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 shadow-xs cursor-pointer"
              onClick={() => handleBulkStatus("queued")}
              disabled={isPending}
            >
              <Clock className="size-3.5 text-blue-400" />
              Queue
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7.5 text-xs gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 shadow-xs cursor-pointer"
              onClick={() => handleBulkStatus("archived")}
              disabled={isPending}
            >
              <Archive className="size-3.5 text-zinc-400" />
              Archive
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7.5 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer"
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={isPending}
            >
              <Trash2 className="size-3.5" />
              Delete ({selectedIds.size})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              onClick={handleClearSelection}
            >
              <X className="size-3.5 mr-1" />
              Deselect
            </Button>
          </div>
        </div>
      )}

      {/* 8. Main Topic Display: Skeleton Loading State OR Table / Grid Views */}
      {isLoading ? (
        /* SKELETON LOADING STATE */
        viewMode === "table" ? (
          <div className="border border-hairline rounded-xl overflow-hidden bg-card shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-hairline text-muted-foreground font-medium">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <div className="size-4 rounded bg-muted animate-pulse mx-auto" />
                  </th>
                  <th className="p-3 font-semibold text-foreground">Topic Title & Details</th>
                  <th className="p-3 w-44 font-semibold text-foreground">Category & Product</th>
                  <th className="p-3 w-28 font-semibold text-foreground">Status</th>
                  <th className="p-3 w-28 font-semibold text-foreground">Scheduled</th>
                  <th className="p-3 w-48 text-right font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3 text-center">
                      <div className="size-4 rounded bg-muted mx-auto" />
                    </td>
                    <td className="p-3 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted/60 rounded w-1/2" />
                      <div className="flex gap-1 pt-1">
                        <div className="h-3.5 w-16 bg-muted/50 rounded" />
                        <div className="h-3.5 w-12 bg-muted/50 rounded" />
                      </div>
                    </td>
                    <td className="p-3 space-y-1.5">
                      <div className="h-5 w-24 bg-muted rounded-full" />
                      <div className="h-4 w-28 bg-muted/60 rounded" />
                    </td>
                    <td className="p-3">
                      <div className="h-5 w-18 bg-muted rounded-full" />
                    </td>
                    <td className="p-3">
                      <div className="h-4 w-16 bg-muted rounded" />
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex gap-1.5 justify-end">
                        <div className="h-7.5 w-16 bg-muted rounded-md" />
                        <div className="size-7.5 bg-muted rounded-md" />
                        <div className="size-7.5 bg-muted rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-border/60 animate-pulse">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-4/5" />
                      <div className="flex gap-1.5">
                        <div className="h-4 w-20 bg-muted rounded-full" />
                        <div className="h-4 w-16 bg-muted rounded-full" />
                      </div>
                    </div>
                    <div className="size-7 bg-muted rounded" />
                  </div>
                  <div className="h-3 bg-muted/60 rounded w-full" />
                  <div className="h-3 bg-muted/60 rounded w-2/3" />
                  <div className="pt-2 border-t border-hairline flex justify-end gap-1.5">
                    <div className="h-7.5 w-20 bg-muted rounded" />
                    <div className="h-7.5 w-16 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : paginatedTopics.length === 0 ? (
        <Card className="border-dashed border-border/80">
          <CardContent className="p-12 text-center space-y-3">
            <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Inbox className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Tidak ada topik yang sesuai</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery || filterCategory !== "all" || activeTab !== "all"
                  ? "Coba ubah kata kunci pencarian atau reset filter di atas."
                  : "Topic bank masih kosong. Mulai dengan Generate Weekly/Monthly atau paste catatan mentah."}
              </p>
            </div>
            {(searchQuery || filterCategory !== "all" || activeTab !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterCategory("all");
                  setActiveTab("all");
                }}
                className="text-xs cursor-pointer"
              >
                Reset All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        /* DENSE TABLE / LIST VIEW (High-Craft Proportional Action Buttons) */
        <div className="border border-hairline rounded-xl overflow-hidden bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-hairline text-muted-foreground font-medium select-none">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <button
                      onClick={handleSelectAllVisible}
                      className="p-1 hover:text-foreground inline-flex items-center cursor-pointer"
                    >
                      {isAllVisibleSelected ? (
                        <CheckSquare className="size-4 text-primary" />
                      ) : isSomeVisibleSelected ? (
                        <MinusSquare className="size-4 text-primary" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 font-semibold text-foreground">Topic Title & Details</th>
                  <th className="p-3 w-44 font-semibold text-foreground">Category & Product</th>
                  <th className="p-3 w-28 font-semibold text-foreground">Status</th>
                  <th className="p-3 w-28 font-semibold text-foreground">Scheduled</th>
                  <th className="p-3 w-48 text-right font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {paginatedTopics.map((topic) => {
                  const isSelected = selectedIds.has(topic.id);
                  const scheduled = formatScheduled(topic.scheduledDate);
                  const relatedProdId = topic.relatedProductId || topic.related_product_id;
                  const linkedProduct = relatedProdId ? productsMap.get(relatedProdId) : null;
                  const productName = linkedProduct
                    ? linkedProduct.name
                    : relatedProdId
                      ? "Product"
                      : null;
                  const statusInfo = STATUS_CONFIG[topic.status];

                  return (
                    <tr
                      key={topic.id}
                      className={`hover:bg-muted/30 transition-colors group ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="p-3 text-center align-middle">
                        <button
                          onClick={() => handleToggleSelect(topic.id)}
                          className="p-1 hover:text-foreground inline-flex items-center cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="size-4 text-primary" />
                          ) : (
                            <Square className="size-4 text-muted-foreground/60 group-hover:text-muted-foreground" />
                          )}
                        </button>
                      </td>

                      <td className="p-3 align-middle space-y-1">
                        <div className="font-semibold text-sm leading-snug text-foreground">
                          {topic.title}
                        </div>
                        {topic.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-xl">
                            {topic.description}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {topic.angle && (
                            <span className="text-[11px] text-muted-foreground italic mr-1">
                              {topic.angle}
                            </span>
                          )}
                          {topic.keywords.slice(0, 3).map((kw) => (
                            <span
                              key={kw}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 align-middle space-y-1.5">
                        <div>
                          <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-muted font-medium text-foreground">
                            {CATEGORIES.find((c) => c.value === topic.category)?.label ??
                              topic.category}
                          </span>
                        </div>
                        {relatedProdId && (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                              <LinkIcon className="size-2.5" />
                              <span className="truncate max-w-[130px]">{productName}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 align-middle">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border font-medium ${statusInfo.color}`}
                        >
                          <statusInfo.icon className="size-3" />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="p-3 align-middle text-xs text-muted-foreground">
                        {scheduled ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                            {scheduled}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Proportional, single-line unstacked actions */}
                      <td className="p-3 align-middle text-right">
                        <div className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
                          {(topic.status === "idea" || topic.status === "queued") && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7.5 px-2.5 text-xs font-medium gap-1 shrink-0 shadow-2xs cursor-pointer"
                              onClick={() => router.push(`/create?topic=${topic.id}`)}
                            >
                              <Sparkles className="size-3" />
                              Buat
                            </Button>
                          )}

                          {topic.status === "generated" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7.5 px-2.5 text-xs font-medium gap-1 shrink-0 shadow-2xs cursor-pointer"
                              onClick={() => router.push(topic.carouselId ? `/history` : `/create?topic=${topic.id}`)}
                            >
                              <CheckCircle2 className="size-3 text-emerald-500" />
                              View
                            </Button>
                          )}

                          {topic.status === "idea" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7.5 p-0 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                              onClick={() => handleUpdateStatus(topic.id, "queued")}
                              title="Queue Topic"
                            >
                              <Clock className="size-3.5" />
                            </Button>
                          )}

                          {topic.status !== "archived" && topic.status !== "published" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7.5 p-0 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                              onClick={() => handleUpdateStatus(topic.id, "archived")}
                              title="Archive Topic"
                            >
                              <Archive className="size-3.5" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-7.5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() => setTopicToDelete(topic)}
                            title="Hapus Topic"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISUAL CARD GRID VIEW */
        <div className="grid gap-3 md:grid-cols-2">
          {paginatedTopics.map((topic) => {
            const isSelected = selectedIds.has(topic.id);
            const scheduled = formatScheduled(topic.scheduledDate);
            const relatedProdId = topic.relatedProductId || topic.related_product_id;
            const linkedProduct = relatedProdId ? productsMap.get(relatedProdId) : null;
            const productName = linkedProduct
              ? linkedProduct.name
              : relatedProdId
                ? "Product"
                : null;
            const statusInfo = STATUS_CONFIG[topic.status];

            return (
              <Card
                key={topic.id}
                className={`hover:shadow-md transition-all relative ${
                  isSelected ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                }`}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1">
                      <button
                        onClick={() => handleToggleSelect(topic.id)}
                        className="p-0.5 mt-0.5 hover:text-foreground cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="size-4 text-primary" />
                        ) : (
                          <Square className="size-4 text-muted-foreground/60" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
                          {topic.title}
                        </h3>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
                          <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">
                            {CATEGORIES.find((c) => c.value === topic.category)?.label ??
                              topic.category}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded border font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                          {scheduled && (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                              {scheduled}
                            </span>
                          )}
                          {relatedProdId && (
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium inline-flex items-center gap-1">
                              <LinkIcon className="size-3" />
                              {productName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-7.5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                      onClick={() => setTopicToDelete(topic)}
                      title="Hapus Topic"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  {topic.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pl-6.5">
                      {topic.description}
                    </p>
                  )}

                  {topic.keywords.length > 0 && (
                    <div className="flex gap-1 flex-wrap pl-6.5">
                      {topic.keywords.slice(0, 3).map((keyword) => (
                        <span
                          key={keyword}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {topic.angle && (
                    <p className="text-xs text-muted-foreground italic pl-6.5">{topic.angle}</p>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-hairline justify-end items-center">
                    {(topic.status === "idea" || topic.status === "queued") && (
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs h-7.5 gap-1 font-medium shadow-2xs cursor-pointer"
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
                        className="text-xs h-7.5 cursor-pointer"
                        onClick={() => handleUpdateStatus(topic.id, "queued")}
                      >
                        Queue
                      </Button>
                    )}
                    {topic.status !== "archived" && topic.status !== "published" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7.5 cursor-pointer"
                        onClick={() => handleUpdateStatus(topic.id, "archived")}
                      >
                        Archive
                      </Button>
                    )}
                    {topic.status === "generated" && topic.carouselId && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs h-7.5 cursor-pointer"
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
      )}

      {/* 9. Pagination Controls */}
      {!isLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground border-t border-hairline">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-foreground font-semibold">
                {(validCurrentPage - 1) * pageSize + 1}
              </strong>
              –
              <strong className="text-foreground font-semibold">
                {Math.min(validCurrentPage * pageSize, totalItems)}
              </strong>{" "}
              of <strong className="text-foreground font-semibold">{totalItems}</strong> topics
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span>Per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v || 25))}
              >
                <SelectTrigger className="h-7 w-16 text-xs bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="size-7 p-0 cursor-pointer"
              onClick={() => setCurrentPage(1)}
              disabled={validCurrentPage <= 1}
              title="First Page"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="size-7 p-0 cursor-pointer"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              title="Previous Page"
            >
              <ChevronLeft className="size-3.5" />
            </Button>

            <span className="px-2.5 text-xs font-medium text-foreground">
              Page {validCurrentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="size-7 p-0 cursor-pointer"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              title="Next Page"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="size-7 p-0 cursor-pointer"
              onClick={() => setCurrentPage(totalPages)}
              disabled={validCurrentPage >= totalPages}
              title="Last Page"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 10. Generate from Notes (shadcn Dialog) */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 text-left">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 flex items-center justify-center">
                <FileText className="size-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-base">Generate from Notes</DialogTitle>
                <DialogDescription>
                  Paste catatan mentah atau outline ide untuk di-extract otomatis menjadi topic cards.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 py-1">
            <label className="text-xs font-medium text-foreground/80 flex items-center justify-between">
              <span>Catatan Mentah (Raw Notes / Outline / Dumps)</span>
              <span className="text-[10px] text-muted-foreground font-mono">Markdown / Plain text</span>
            </label>
            <Textarea
              placeholder="Paste raw notes di sini... Misal:
- Ide 1: Panduan integrasi AI agent dengan Next.js Server Actions
- Ide 2: 5 Kesalahan umum saat implementasi PostgreSQL indexing
- Ide 3: Kenapa developer perlu beralih ke Tailwind CSS v4..."
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={8}
              className="font-mono text-xs leading-relaxed resize-y bg-background/50 border-hairline focus:border-primary/40 focus:ring-1 focus:ring-primary/20 rounded-xl"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              AI akan mengekstrak poin penting, menentukan kategori, keyword, angle, dan
              otomatis menghubungkan produk jika relevan.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowNotesModal(false)}
              disabled={isPending}
              size="sm"
              className="cursor-pointer text-xs"
            >
              Batal
            </Button>
            <Button
              onClick={handleGenerateFromNotes}
              disabled={isPending || !notesText.trim()}
              className="gap-2 cursor-pointer text-xs shadow-xs"
              size="sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  Generate Topics
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 11. Single Topic Delete Confirmation (shadcn Dialog) */}
      <Dialog open={!!topicToDelete} onOpenChange={(open) => !open && setTopicToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive shrink-0 flex items-center justify-center mt-0.5">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-1.5 flex-1 text-left">
              <DialogTitle>Hapus Topik?</DialogTitle>
              <DialogDescription className="leading-relaxed">
                Apakah Anda yakin ingin menghapus topik{" "}
                <strong className="text-foreground font-semibold">
                  &quot;{topicToDelete?.title}&quot;
                </strong>
                ? Tindakan ini permanen dan tidak dapat dibatalkan.
              </DialogDescription>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setTopicToDelete(null)}
              disabled={isPending}
              size="sm"
              className="cursor-pointer text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteSingle}
              disabled={isPending}
              size="sm"
              className="gap-1.5 cursor-pointer shadow-xs text-xs"
            >
              <Trash2 className="size-3.5" />
              Hapus Topik
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 12. Bulk Delete Confirmation (shadcn Dialog) */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive shrink-0 flex items-center justify-center mt-0.5">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-1.5 flex-1 text-left">
              <DialogTitle>Hapus {selectedIds.size} Topik Terpilih?</DialogTitle>
              <DialogDescription className="leading-relaxed">
                Tindakan ini permanen dan akan menghapus <strong className="text-foreground font-semibold">{selectedIds.size} topik</strong> terpilih dari Topic Bank Anda.
              </DialogDescription>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={isPending}
              size="sm"
              className="cursor-pointer text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isPending}
              size="sm"
              className="gap-1.5 cursor-pointer shadow-xs text-xs"
            >
              <Trash2 className="size-3.5" />
              Hapus {selectedIds.size} Topik
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 13. Clear Published Confirmation (shadcn Dialog) */}
      <Dialog open={showClearPublishedDialog} onOpenChange={setShowClearPublishedDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive shrink-0 flex items-center justify-center mt-0.5">
              <Trash2 className="size-5" />
            </div>
            <div className="space-y-1.5 flex-1 text-left">
              <DialogTitle>
                Bersihkan Semua Topik Published ({statusCounts.published})?
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                Semua <strong className="text-foreground font-semibold">{statusCounts.published} topik</strong> dengan status &quot;Published&quot; akan dihapus dari bank untuk merapikan backlog Anda.
              </DialogDescription>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowClearPublishedDialog(false)}
              disabled={isPending}
              size="sm"
              className="cursor-pointer text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAllPublished}
              disabled={isPending}
              size="sm"
              className="gap-1.5 cursor-pointer shadow-xs text-xs"
            >
              <Trash2 className="size-3.5" />
              Hapus Semua ({statusCounts.published})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
