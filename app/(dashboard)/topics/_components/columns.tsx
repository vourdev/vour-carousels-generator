"use client";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { Subscribe } from "@tanstack/react-table";
import { Archive, Clock, ExternalLink, Link as LinkIcon, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { inFilter } from "@/components/data-table/data-table-facet-filter";
import { TopicStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableFeatures } from "@/lib/data-table-features";
import type { Topic, TopicStatus } from "@/lib/topics/bank";

import { categoryLabel, formatScheduled } from "./categories";

export interface TopicRowActions {
  onStatus: (topic: Topic, status: TopicStatus) => void;
  onDelete: (topic: Topic) => void;
  productName: (id?: string) => string | undefined;
}

const canCreate = (t: Topic) => t.status === "idea" || t.status === "queued";

export function topicColumns({ onStatus, onDelete, productName }: TopicRowActions): ColumnDef<DataTableFeatures, Topic>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Subscribe
          source={table.atoms.rowSelection}
          selector={() =>
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected() && "indeterminate")
          }
        >
          {(checked) => (
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Pilih semua topik di halaman ini"
              className="translate-y-0.5"
            />
          )}
        </Subscribe>
      ),
      cell: ({ row }) => (
        <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
          {(checked) => (
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label={`Pilih topik: ${row.original.title}`}
              className="translate-y-0.5"
            />
          )}
        </Subscribe>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Topik" ascLabel="A–Z" descLabel="Z–A" />,
      sortFn: "text",
      meta: { label: "Topik", className: "w-full min-w-44 whitespace-normal sm:min-w-64" },
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium text-sm leading-snug">{t.title}</span>
            {t.description ? (
              <span className="line-clamp-1 max-w-2xl text-muted-foreground text-xs">{t.description}</span>
            ) : null}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Status and category move here when their own columns step out. */}
              <TopicStatusBadge status={t.status} className="sm:hidden" />
              <Badge variant="outline" className="rounded-sm bg-transparent lg:hidden">
                {categoryLabel(t.category)}
              </Badge>
              {t.angle ? <span className="text-muted-foreground text-xs italic">{t.angle}</span> : null}
              {t.keywords.slice(0, 3).map((kw) => (
                <span key={kw} className="rounded bg-muted px-1.5 text-[11px] text-muted-foreground">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Kategori",
      filterFn: inFilter,
      enableSorting: false,
      meta: { label: "Kategori", className: "hidden lg:table-cell" },
      cell: ({ row }) => {
        const product = productName(row.original.relatedProductId);
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant="outline" className="rounded-sm bg-transparent">
              {categoryLabel(row.original.category)}
            </Badge>
            {product ? (
              <span className="inline-flex max-w-40 items-center gap-1 text-muted-foreground text-xs">
                <LinkIcon className="size-3 shrink-0" />
                <span className="truncate">{product}</span>
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: inFilter,
      enableSorting: false,
      meta: { label: "Status", className: "hidden sm:table-cell" },
      cell: ({ row }) => <TopicStatusBadge status={row.original.status} />,
    },
    {
      id: "scheduled",
      accessorFn: (t) => (t.scheduledDate ? Date.parse(t.scheduledDate) : Number.POSITIVE_INFINITY),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Jadwal" ascLabel="Terdekat" descLabel="Terjauh" />
      ),
      sortFn: "alphanumeric",
      meta: { label: "Jadwal", className: "hidden md:table-cell" },
      cell: ({ row }) => {
        const s = formatScheduled(row.original.scheduledDate);
        return s ? <span className="tabular-nums">{s}</span> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Prioritas" ascLabel="Rendah dulu" descLabel="Tinggi dulu" />
      ),
      sortFn: "alphanumeric",
      meta: { label: "Prioritas", className: "hidden xl:table-cell" },
      cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.priority}</span>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            {canCreate(t) ? (
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href={`/create?topic=${t.id}`}>
                  <Sparkles data-icon="inline-start" />
                  Buat
                </Link>
              </Button>
            ) : null}
            {t.status === "generated" ? (
              <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
                <Link href={t.carouselId ? "/history" : `/create?topic=${t.id}`}>
                  <ExternalLink data-icon="inline-start" />
                  Lihat
                </Link>
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground data-[state=open]:bg-muted">
                  <MoreHorizontal />
                  <span className="sr-only">Aksi untuk {t.title}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canCreate(t) ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/create?topic=${t.id}`}>
                      <Sparkles />
                      Buat carousel
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {t.status === "idea" ? (
                  <DropdownMenuItem onSelect={() => onStatus(t, "queued")}>
                    <Clock />
                    Masukkan antrean
                  </DropdownMenuItem>
                ) : null}
                {t.status !== "archived" && t.status !== "published" ? (
                  <DropdownMenuItem onSelect={() => onStatus(t, "archived")}>
                    <Archive />
                    Arsipkan
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => onDelete(t)}>
                  <Trash2 />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
