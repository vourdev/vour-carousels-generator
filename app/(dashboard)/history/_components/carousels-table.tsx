"use client";

import { useMemo, useState } from "react";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { Search, X } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableFacetFilter, inFilter } from "@/components/data-table/data-table-facet-filter";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { CAROUSEL_STATUS, CarouselStatusBadge } from "@/components/status-badge";
import { Thumb } from "@/components/thumb";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { type DataTableFeatures, dataTableFeatures } from "@/lib/data-table-features";
import type { Carousel, CarouselStatus } from "@/lib/history/repo";

const dueFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const channels = (c: Carousel) => [c.bufferIgId && "IG", c.bufferTtId && "TikTok"].filter(Boolean).join(" · ");

const columns: ColumnDef<DataTableFeatures, Carousel>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Judul" ascLabel="A–Z" descLabel="Z–A" />,
    sortFn: "text",
    meta: { className: "w-full max-w-0" },
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="flex items-center gap-3">
          <Thumb src={c.thumbnail} />
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{c.title || "Untitled"}</p>
            <p className="hidden truncate text-muted-foreground text-xs sm:block">{c.caption}</p>
            {/* Phones drop the Jadwal column; the date moves under the title. */}
            <p className="truncate text-muted-foreground text-xs sm:hidden">
              {c.dueAt ? dueFmt.format(new Date(c.dueAt)) : "Belum dijadwalkan"}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    id: "model",
    accessorFn: (c) => (c.model ? (c.model.split("/").pop() ?? c.model) : c.source),
    header: "Model",
    enableSorting: false,
    meta: { className: "hidden xl:table-cell" },
    cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span>,
  },
  {
    accessorKey: "slideCount",
    header: "Slide",
    enableSorting: false,
    meta: { className: "hidden lg:table-cell" },
    cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.slideCount}</span>,
  },
  {
    id: "due",
    accessorFn: (c) => (c.dueAt ? Date.parse(c.dueAt) : 0),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Jadwal" ascLabel="Terlama" descLabel="Terbaru" />,
    sortFn: "alphanumeric",
    meta: { className: "hidden sm:table-cell" },
    cell: ({ row }) => {
      const c = row.original;
      if (!c.dueAt) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="tabular-nums">
          {dueFmt.format(new Date(c.dueAt))}
          {channels(c) ? <span className="block text-muted-foreground text-xs">{channels(c)}</span> : null}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    filterFn: inFilter,
    cell: ({ row }) => <CarouselStatusBadge status={row.original.status} />,
  },
];

/** Every deck, newest first, filterable by status — the template's Tasks table pattern. */
export function CarouselsTable({ items, onSelect }: { items: Carousel[]; onSelect: (c: Carousel) => void }) {
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((c) => c.title.toLowerCase().includes(q) || c.caption?.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const statusCounts = useMemo(() => {
    const n: Partial<Record<CarouselStatus, number>> = {};
    for (const c of items) n[c.status] = (n[c.status] ?? 0) + 1;
    return n;
  }, [items]);

  const table = useTable({
    features: dataTableFeatures,
    data: rows,
    columns,
    state: { sorting, columnFilters, pagination },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-4">
        <InputGroup className="w-full sm:w-72">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Cari judul atau caption…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              table.setPageIndex(0);
            }}
            aria-label="Cari carousel"
          />
        </InputGroup>
        <DataTableFacetFilter
          table={table}
          columnId="status"
          title="Status"
          options={(Object.keys(CAROUSEL_STATUS) as CarouselStatus[])
            .filter((s) => statusCounts[s])
            .map((s) => ({ value: s, label: CAROUSEL_STATUS[s].label, count: statusCounts[s] }))}
        />
        {search || columnFilters.length ? (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              table.resetColumnFilters();
            }}
          >
            <X data-icon="inline-start" />
            Reset
          </Button>
        ) : null}
      </div>
      <DataTable
        table={table}
        onRowClick={(row) => onSelect(row.original)}
        empty={items.length ? "Tidak ada carousel yang cocok." : "Belum ada carousel. Buat yang pertama dari Create."}
      />
      <DataTablePagination table={table} noun="carousel" />
    </div>
  );
}
