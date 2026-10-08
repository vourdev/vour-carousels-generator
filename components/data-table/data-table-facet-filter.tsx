"use client";

import type { ReactTable, RowData } from "@tanstack/react-table";
import { ListFilter, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { cn } from "@/lib/utils";

export interface FacetOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * Multi-select filter on one column, the template's Status/Priority filter made generic.
 * The column needs a `filterFn` that accepts a string[] (see `inFilter`).
 */
export function DataTableFacetFilter<TData extends RowData>({
  table,
  columnId,
  title,
  options,
}: {
  table: ReactTable<DataTableFeatures, TData>;
  columnId: string;
  title: string;
  options: FacetOption[];
}) {
  const column = table.getColumn(columnId);
  if (!column) return null;

  const selected = new Set((column.getFilterValue() as string[] | undefined) ?? []);

  function toggle(value: string) {
    if (selected.has(value)) selected.delete(value);
    else selected.add(value);
    const values = Array.from(selected);
    column?.setFilterValue(values.length ? values : undefined);
    table.setPageIndex(0);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("border-dashed", selected.size > 0 && "border-solid bg-muted")}>
          <ListFilter data-icon="inline-start" />
          {title}
          {selected.size > 0 ? (
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {selected.size}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-56">
        <DropdownMenuGroup>
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selected.has(option.value)}
              onCheckedChange={() => toggle(option.value)}
              onSelect={(event) => event.preventDefault()}
            >
              <span className="flex-1">{option.label}</span>
              {option.count !== undefined ? (
                <span className="ml-auto text-muted-foreground text-xs tabular-nums">{option.count}</span>
              ) : null}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                column.setFilterValue(undefined);
                table.setPageIndex(0);
              }}
              className="justify-center text-center"
            >
              <X />
              Hapus filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Row passes when its value is one of the selected options. */
export function inFilter<TRow extends { getValue: (id: string) => unknown }>(row: TRow, id: string, value: unknown) {
  return Array.isArray(value) && value.includes(row.getValue(id));
}
