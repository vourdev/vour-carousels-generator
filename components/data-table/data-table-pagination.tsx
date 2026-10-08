"use client";

import type { ReactTable, RowData } from "@tanstack/react-table";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { cn } from "@/lib/utils";

function pageNumbers(currentPage: number, pageCount: number) {
  if (pageCount <= 3) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (currentPage <= 2) return [1, 2, 3];
  if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
  return [currentPage - 1, currentPage, currentPage + 1];
}

const stop = (event: React.MouseEvent<HTMLAnchorElement>) => event.preventDefault();

/** Footer of every dashboard table: selection count, rows per page, pager. */
export function DataTablePagination<TData extends RowData>({
  table,
  noun = "baris",
  pageSizes = [10, 25, 50, 100],
}: {
  table: ReactTable<DataTableFeatures, TData>;
  noun?: string;
  pageSizes?: number[];
}) {
  const pageIndex = table.state.pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);
  const currentPage = Math.min(pageIndex + 1, pageCount);
  const pages = pageNumbers(currentPage, pageCount);
  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
  const selected = table.getFilteredSelectedRowModel().rows.length;
  const total = table.getFilteredRowModel().rows.length;

  return (
    // Wraps instead of switching at a breakpoint: with the sidebar open, a 768px screen
    // leaves ~500px, less than the row needs.
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t px-4 py-4">
      <div className="text-muted-foreground text-sm">
        {selected > 0 ? `${selected} dari ${total} ${noun} dipilih` : `${total} ${noun}`}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <p className="font-medium text-muted-foreground text-sm">Per halaman</p>
          <Select value={`${table.state.pagination.pageSize}`} onValueChange={(v) => table.setPageSize(Number(v))}>
            <SelectTrigger className="h-8 w-18" aria-label="Baris per halaman">
              <SelectValue placeholder={table.state.pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {pageSizes.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center font-medium text-sm whitespace-nowrap">
          Hal. {currentPage} dari {pageCount}
        </div>
        <Pagination className="mx-0 w-auto justify-start sm:justify-end">
          <PaginationContent className="gap-1">
            <PaginationItem className="hidden lg:block">
              <PaginationLink
                href="#"
                aria-label="Halaman pertama"
                aria-disabled={!canPrev}
                className={cn(!canPrev && "pointer-events-none opacity-50")}
                onClick={(e) => {
                  stop(e);
                  if (canPrev) table.setPageIndex(0);
                }}
              >
                <ChevronsLeft />
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Prev"
                aria-disabled={!canPrev}
                className={cn(!canPrev && "pointer-events-none opacity-50")}
                onClick={(e) => {
                  stop(e);
                  if (canPrev) table.previousPage();
                }}
              />
            </PaginationItem>
            {pages[0] > 1 ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : null}
            {pages.map((n) => (
              <PaginationItem key={n}>
                <PaginationLink
                  href="#"
                  isActive={pageIndex === n - 1}
                  onClick={(e) => {
                    stop(e);
                    table.setPageIndex(n - 1);
                  }}
                >
                  {n}
                </PaginationLink>
              </PaginationItem>
            ))}
            {pages[pages.length - 1] < pageCount ? (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            ) : null}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={!canNext}
                className={cn(!canNext && "pointer-events-none opacity-50")}
                onClick={(e) => {
                  stop(e);
                  if (canNext) table.nextPage();
                }}
              />
            </PaginationItem>
            <PaginationItem className="hidden lg:block">
              <PaginationLink
                href="#"
                aria-label="Halaman terakhir"
                aria-disabled={!canNext}
                className={cn(!canNext && "pointer-events-none opacity-50")}
                onClick={(e) => {
                  stop(e);
                  if (canNext) table.setPageIndex(pageCount - 1);
                }}
              >
                <ChevronsRight />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
