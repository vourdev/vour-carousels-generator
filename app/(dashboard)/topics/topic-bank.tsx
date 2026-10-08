"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import {
  Archive,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  Newspaper,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableFacetFilter } from "@/components/data-table/data-table-facet-filter";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { dataTableFeatures } from "@/lib/data-table-features";
import type { Topic, TopicStatus } from "@/lib/topics/bank";

import {
  bulkDeleteTopicsAction,
  bulkUpdateTopicStatusAction,
  createTopicAction,
  deleteTopicAction,
  deleteTopicsByStatusAction,
  discoverTrendingAction,
  generateFromNotesAction,
  generateTopicsAction,
  getProductsAction,
  listTopicsAction,
  type Product,
  updateTopicAction,
} from "./actions";
import { CATEGORIES, categoryLabel, STATUS_TABS, statusLabel } from "./_components/categories";
import { topicColumns } from "./_components/columns";
import { AddTopicDialog, ConfirmDialog, type NewTopic, NotesDialog } from "./_components/topic-dialogs";

type Tab = TopicStatus | "all";
type Confirm = { kind: "single"; topic: Topic } | { kind: "bulk" } | { kind: "published" } | null;

function matches(topic: Topic, q: string, product?: string) {
  return (
    topic.title.toLowerCase().includes(q) ||
    (topic.description?.toLowerCase().includes(q) ?? false) ||
    (topic.angle?.toLowerCase().includes(q) ?? false) ||
    topic.keywords.some((k) => k.toLowerCase().includes(q)) ||
    (product?.toLowerCase().includes(q) ?? false)
  );
}

export function TopicBank() {
  const [isPending, startTransition] = useTransition();
  const [running, setRunning] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [directives, setDirectives] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "priority", desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

  const productName = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p.name]));
    return (id?: string) => (id ? map.get(id) : undefined);
  }, [products]);

  const fetchTopics = useCallback(async () => {
    setIsLoading(true);
    try {
      setTopics(await listTopicsAction());
    } catch {
      toast.error("Gagal memuat topik");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // First load: isLoading already starts true, so nothing is set before the data arrives.
  useEffect(() => {
    listTopicsAction()
      .then(setTopics)
      .catch(() => toast.error("Gagal memuat topik"))
      .finally(() => setIsLoading(false));
    getProductsAction()
      .then(setProducts)
      .catch(() => {
        // The products endpoint may be offline; the product column just stays empty.
      });
  }, []);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: topics.length, idea: 0, queued: 0, generated: 0, published: 0, archived: 0 };
    for (const t of topics) if (t.status in c) c[t.status]++;
    return c;
  }, [topics]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of topics) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, [topics]);

  // Tab and search narrow the rows before the table sees them; category is a column filter
  // so its facet menu can show what is selected.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topics.filter(
      (t) => (tab === "all" || t.status === tab) && (!q || matches(t, q, productName(t.relatedProductId))),
    );
  }, [topics, tab, search, productName]);

  const run = (key: string, task: () => Promise<void>) => {
    setRunning(key);
    startTransition(async () => {
      try {
        await task();
      } finally {
        setRunning(null);
      }
    });
  };

  const handleStatus = (topic: Topic, status: TopicStatus) =>
    run("status", async () => {
      try {
        await updateTopicAction(topic.id, { status });
        toast.success(`Status diubah ke ${statusLabel(status)}`);
        await fetchTopics();
      } catch {
        toast.error("Gagal mengubah status");
      }
    });

  const columns = useMemo(
    () => topicColumns({ onStatus: handleStatus, onDelete: (topic) => setConfirm({ kind: "single", topic }), productName }),
    // handleStatus only closes over stable setters and fetchTopics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productName],
  );

  const table = useTable({
    features: dataTableFeatures,
    data: rows,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const clearSelection = () => setRowSelection({});

  const handleGenerate = (mode: "weekly" | "monthly" | "ideas") =>
    run(mode, async () => {
      try {
        const saved = await generateTopicsAction({
          mode,
          count: mode === "ideas" ? 7 : undefined,
          focusArea: focusArea.trim() || undefined,
          directives: directives.trim() || undefined,
          startDate: new Date().toISOString(),
        });
        toast.success(
          mode === "monthly"
            ? `${saved.length} topik untuk 4 minggu ke depan`
            : mode === "weekly"
              ? `${saved.length} topik untuk minggu ini`
              : `${saved.length} ide topik baru`,
        );
        await fetchTopics();
      } catch (e) {
        toast.error(`Gagal generate topik: ${e instanceof Error ? e.message : "failed"}`);
      }
    });

  /**
   * Sweep the tech press for trending topics. The toast reports the funnel, not just the
   * count: a sweep that saves nothing is normal — the corroboration rule drops most of any
   * news day — and a bare "0 topics" would read as a broken feature every time.
   */
  const handleTrending = () =>
    run("trending", async () => {
      try {
        const { topics: found, skipped, stats } = await discoverTrendingAction();
        if (found.length > 0) {
          toast.success(`${found.length} topik trending masuk bank — dari ${stats.corroborated} berita terkonfirmasi ≥2 sumber.`);
        } else {
          const dup = skipped.filter((s) => s.reason === "duplicate").length;
          toast.info(
            stats.corroborated === 0
              ? `Tidak ada berita yang terkonfirmasi 2 sumber independen dari ${stats.itemsFetched} item hari ini.`
              : dup > 0
                ? `${stats.corroborated} berita terkonfirmasi, tapi ${dup} sudah ada di bank dan sisanya tidak lolos filter signifikansi.`
                : `${stats.corroborated} berita terkonfirmasi, tidak ada yang cukup signifikan untuk audiens Vour.`,
          );
        }
        if (stats.feedsFailed > 0) toast.warning(`${stats.feedsFailed} sumber berita tidak bisa dibaca kali ini.`);
        await fetchTopics();
      } catch (e) {
        toast.error(`Gagal riset berita: ${e instanceof Error ? e.message : "failed"}`);
      }
    });

  const handleNotes = (notes: string) =>
    run("notes", async () => {
      try {
        const extracted = await generateFromNotesAction(notes);
        toast.success(`${extracted.length} ide topik diekstrak dari catatan`);
        setShowNotes(false);
        await fetchTopics();
      } catch (e) {
        toast.error(`Gagal ekstrak topik: ${e instanceof Error ? e.message : "failed"}`);
      }
    });

  const handleAdd = (topic: NewTopic) =>
    run("add", async () => {
      try {
        await createTopicAction({ ...topic, priority: 5 });
        toast.success("Topik ditambahkan");
        setShowAdd(false);
        await fetchTopics();
      } catch {
        toast.error("Gagal menambahkan topik");
      }
    });

  const handleBulkStatus = (status: TopicStatus) =>
    run("bulk", async () => {
      try {
        await bulkUpdateTopicStatusAction(selectedIds, status);
        toast.success(`${selectedIds.length} topik diubah ke ${statusLabel(status)}`);
        clearSelection();
        await fetchTopics();
      } catch {
        toast.error("Gagal mengubah status topik terpilih");
      }
    });

  const handleConfirm = () =>
    run("delete", async () => {
      try {
        if (confirm?.kind === "single") {
          await deleteTopicAction(confirm.topic.id);
          const gone = confirm.topic.id;
          setRowSelection((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => id !== gone)));
          toast.success("Topik dihapus");
        } else if (confirm?.kind === "bulk") {
          await bulkDeleteTopicsAction(selectedIds);
          toast.success(`${selectedIds.length} topik dihapus`);
          clearSelection();
        } else if (confirm?.kind === "published") {
          const n = await deleteTopicsByStatusAction("published");
          toast.success(`${n} topik Published dibersihkan`);
          clearSelection();
        }
        setConfirm(null);
        await fetchTopics();
      } catch {
        toast.error("Gagal menghapus");
      }
    });

  const distribution = useMemo(() => {
    if (!topics.length) return "";
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, n]) => `${categoryLabel(cat)} ${Math.round((n / topics.length) * 100)}%`)
      .join(" · ");
  }, [topics.length, categoryCounts]);

  const hideable = table.getAllColumns().filter((c) => typeof c.accessorFn !== "undefined" && c.getCanHide());
  const busy = (key: string) => isPending && running === key;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title="Topics"
        description="Bank ide konten: generate, antrekan, lalu jadikan carousel."
        actions={
          <>
            <ButtonGroup>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={isPending}>
                    {["weekly", "monthly", "ideas"].includes(running ?? "") ? (
                      <Loader2 className="animate-spin" data-icon="inline-start" />
                    ) : (
                      <Sparkles data-icon="inline-start" />
                    )}
                    Generate
                    <ChevronDown data-icon="inline-end" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Generate dengan AI</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={() => handleGenerate("weekly")}>
                      <CalendarDays />
                      Mingguan
                      <span className="ml-auto text-muted-foreground text-xs">7 topik</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleGenerate("monthly")}>
                      <CalendarRange />
                      Bulanan
                      <span className="ml-auto text-muted-foreground text-xs">28 topik</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleGenerate("ideas")}>
                      <Sparkles />
                      Ide bebas
                      <span className="ml-auto text-muted-foreground text-xs">7 ide</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleTrending}>
                    <Newspaper />
                    Riset berita trending
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setShowNotes(true)}>
                    <FileText />
                    Dari catatan…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <GenerateSettings
                focusArea={focusArea}
                directives={directives}
                onFocusArea={setFocusArea}
                onDirectives={setDirectives}
              />
            </ButtonGroup>
            <Button variant="outline" onClick={() => setShowAdd(true)}>
              <Plus data-icon="inline-start" />
              Tambah
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void fetchTopics()}
              disabled={isLoading}
              aria-label="Muat ulang"
              title="Muat ulang"
            >
              <RotateCcw className={isLoading ? "animate-spin" : undefined} />
            </Button>
          </>
        }
      />

      {busy("trending") ? (
        <p className="flex items-center gap-2 text-muted-foreground text-sm" role="status">
          <Loader2 className="size-4 animate-spin" /> Menyisir berita teknologi… bisa 1–2 menit.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
        <div className="flex flex-col gap-3 border-b px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as Tab);
                table.setPageIndex(0);
              }}
              className="min-w-0 max-w-full"
            >
              {/* One scrollable row: wrapped triggers overlap, since each is sized to the list's height. */}
              <TabsList className="max-w-full justify-start overflow-x-auto [scrollbar-width:none]">
                {STATUS_TABS.map((s) => (
                  <TabsTrigger key={s.value} value={s.value} className="flex-none gap-1.5">
                    {s.label}
                    <span className="text-muted-foreground text-xs tabular-nums">{counts[s.value]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {counts.published > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-destructive hover:text-destructive lg:self-auto"
                onClick={() => setConfirm({ kind: "published" })}
              >
                <Trash2 data-icon="inline-start" />
                Bersihkan Published ({counts.published})
              </Button>
            ) : null}
          </div>

          {selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
              <span className="font-medium text-sm">{selectedIds.length} topik dipilih</span>
              {selectedIds.length < table.getFilteredRowModel().rows.length ? (
                <Button
                  variant="link"
                  size="sm"
                  className="px-1"
                  onClick={() => table.toggleAllRowsSelected(true)}
                >
                  Pilih semua {table.getFilteredRowModel().rows.length}
                </Button>
              ) : null}
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleBulkStatus("queued")}>
                  <Clock data-icon="inline-start" />
                  Antrekan
                </Button>
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleBulkStatus("archived")}>
                  <Archive data-icon="inline-start" />
                  Arsipkan
                </Button>
                <Button size="sm" variant="destructive" disabled={isPending} onClick={() => setConfirm({ kind: "bulk" })}>
                  <Trash2 data-icon="inline-start" />
                  Hapus
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  <X data-icon="inline-start" />
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <InputGroup className="w-full sm:w-72">
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Cari judul, keyword, produk…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      table.setPageIndex(0);
                    }}
                    aria-label="Cari topik"
                  />
                </InputGroup>
                <DataTableFacetFilter
                  table={table}
                  columnId="category"
                  title="Kategori"
                  options={CATEGORIES.filter((c) => categoryCounts[c.value]).map((c) => ({
                    value: c.value,
                    label: c.label,
                    count: categoryCounts[c.value],
                  }))}
                />
                {search || columnFilters.length > 0 ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearch("");
                      table.resetColumnFilters();
                      table.setPageIndex(0);
                    }}
                  >
                    <X data-icon="inline-start" />
                    Reset
                  </Button>
                ) : null}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-auto hidden lg:flex">
                    <Settings2 data-icon="inline-start" />
                    Kolom
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel>Tampilkan kolom</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hideable.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    >
                      {column.columnDef.meta?.label ?? column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {distribution ? (
            <p className="text-muted-foreground text-xs">
              <span className="font-medium text-foreground">Distribusi ({topics.length})</span> · {distribution}
            </p>
          ) : null}
        </div>

        <DataTable
          table={table}
          loading={isLoading && topics.length === 0}
          empty={
            topics.length === 0 ? (
              <span>
                Bank topik masih kosong. Mulai dengan <Badge variant="outline">Generate</Badge> atau tambah manual.
              </span>
            ) : (
              "Tidak ada topik yang cocok dengan filter ini."
            )
          }
        />
        <DataTablePagination table={table} noun="topik" />
      </div>

      <AddTopicDialog open={showAdd} onOpenChange={setShowAdd} products={products} pending={busy("add")} onSubmit={handleAdd} />
      <NotesDialog open={showNotes} onOpenChange={setShowNotes} pending={busy("notes")} onSubmit={handleNotes} />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        pending={busy("delete")}
        onConfirm={handleConfirm}
        {...(confirm?.kind === "single"
          ? {
              title: "Hapus topik?",
              description: `“${confirm.topic.title}” dihapus permanen dari bank.`,
              confirmLabel: "Hapus topik",
            }
          : confirm?.kind === "bulk"
            ? {
                title: `Hapus ${selectedIds.length} topik?`,
                description: "Topik terpilih dihapus permanen dari bank.",
                confirmLabel: `Hapus ${selectedIds.length} topik`,
              }
            : {
                title: `Bersihkan ${counts.published} topik Published?`,
                description: "Semua topik berstatus Published dihapus dari bank untuk merapikan backlog.",
                confirmLabel: `Hapus ${counts.published} topik`,
              })}
      />
    </div>
  );
}

/** Focus area and quality directives that shape the next Generate run. */
function GenerateSettings({
  focusArea,
  directives,
  onFocusArea,
  onDirectives,
}: {
  focusArea: string;
  directives: string;
  onFocusArea: (v: string) => void;
  onDirectives: (v: string) => void;
}) {
  const active = Boolean(focusArea || directives);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" aria-label="Parameter generate" title="Parameter generate" className="relative">
          <SlidersHorizontal />
          {active ? <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary-foreground" /> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="gen-focus">Focus area</FieldLabel>
            <Input
              id="gen-focus"
              value={focusArea}
              onChange={(e) => onFocusArea(e.target.value)}
              placeholder="Next.js 16, AI agents, backend performance"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="gen-directives">Arahan kualitas</FieldLabel>
            <Textarea
              id="gen-directives"
              value={directives}
              onChange={(e) => onDirectives(e.target.value)}
              rows={3}
              placeholder="Prioritaskan topik viral, hindari duplikat, audiens pemula"
            />
            <FieldDescription>Dipakai oleh Mingguan, Bulanan dan Ide bebas.</FieldDescription>
          </Field>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
}
