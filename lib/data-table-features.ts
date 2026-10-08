import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";
import type { CellData, RowData, TableFeatures } from "@tanstack/table-core";

/** Per-column extras the dashboard tables read: responsive visibility and a label for the View menu. */
export interface DataTableColumnMeta {
  /** Applied to the header and every cell, e.g. "hidden md:table-cell". */
  className?: string;
  label?: string;
}

declare module "@tanstack/table-core" {
  // Declaration merging: the generics must match the original, and the members come from
  // DataTableColumnMeta, so the body is empty on purpose.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, TValue extends CellData = CellData>
    extends DataTableColumnMeta {}
}

/**
 * One TanStack Table v9 feature registry for every data table in the dashboard.
 * V9 registers features and built-in functions explicitly; sharing this registry and its
 * inferred type keeps useTable instances, ColumnDefs and table helpers on one contract,
 * and lets the bundler drop whatever the dashboard does not use.
 */
export const dataTableFeatures = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    arrIncludes: filterFn_arrIncludes,
    equalsString: filterFn_equalsString,
    includesString: filterFn_includesString,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
});

export type DataTableFeatures = typeof dataTableFeatures;
