"use client";

import type { ReactTable, Row, RowData } from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { cn } from "@/lib/utils";

/**
 * The body of every dashboard table, in the admin template's Tasks style. Column
 * `meta.className` lands on the header and every cell, which is how a column steps out
 * on narrow screens ("hidden md:table-cell") without a second layout.
 */
export function DataTable<TData extends RowData>({
  table,
  empty,
  onRowClick,
  loading = false,
}: {
  table: ReactTable<DataTableFeatures, TData>;
  empty: React.ReactNode;
  onRowClick?: (row: Row<DataTableFeatures, TData>) => void;
  loading?: boolean;
}) {
  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleLeafColumns().length;

  return (
    <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent">
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                className={cn("h-11 font-medium text-muted-foreground", header.column.columnDef.meta?.className)}
              >
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: 6 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell colSpan={columnCount} className="py-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </TableCell>
            </TableRow>
          ))
        ) : rows.length ? (
          rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={table.state.rowSelection?.[row.id] ? "selected" : undefined}
              className={cn("border-border/60 hover:bg-muted/20", onRowClick && "cursor-pointer")}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={cn("py-3 align-middle", cell.column.columnDef.meta?.className)}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columnCount} className="h-32 text-center text-muted-foreground whitespace-normal">
              {empty}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
