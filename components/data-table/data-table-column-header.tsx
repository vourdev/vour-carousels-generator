"use client";

import type { Column, RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableFeatures } from "@/lib/data-table-features";

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "desc") return <ArrowDown data-icon="inline-end" />;
  if (direction === "asc") return <ArrowUp data-icon="inline-end" />;
  return <ArrowUpDown data-icon="inline-end" />;
}

/** A column title that opens Asc / Desc / Reset, as on the template's Tasks table. */
export function DataTableColumnHeader<TData extends RowData>({
  column,
  title,
  ascLabel = "Naik",
  descLabel = "Turun",
}: {
  column: Column<DataTableFeatures, TData, unknown>;
  title: string;
  ascLabel?: string;
  descLabel?: string;
}) {
  if (!column.getCanSort()) return <span>{title}</span>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="-ml-3 text-muted-foreground data-[state=open]:bg-accent">
          {title}
          <SortIcon direction={column.getIsSorted()} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
          <ArrowUp />
          {ascLabel}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
          <ArrowDown />
          {descLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => column.clearSorting()}>
          <RotateCcw />
          Reset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
