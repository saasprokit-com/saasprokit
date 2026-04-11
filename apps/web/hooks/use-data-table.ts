"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { sortingStateParser } from "@/lib/parsers";

const coreRowModel = getCoreRowModel();

type FilterField = {
  /** TanStack Table column ID */
  id: string;
  /** URL search param key */
  urlKey: string;
  /** "string" for single text value, "array" for multi-select */
  type: "string" | "array";
};

type UseDataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pageCount: number;
  filterFields?: FilterField[];
  defaultPerPage?: number;
  defaultSort?: SortingState;
  enableRowSelection?: boolean | ((row: TData) => boolean);
};

const NUQS_OPTIONS = { shallow: false, clearOnDefault: true } as const;

export function useDataTable<TData>({
  data,
  columns,
  pageCount,
  filterFields = [],
  defaultPerPage = 10,
  defaultSort = [],
  enableRowSelection,
}: UseDataTableProps<TData>) {
  // ── URL-driven state via nuqs ──────────────────────────────────────────

  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions(NUQS_OPTIONS)
  );

  const [perPage, setPerPage] = useQueryState(
    "perPage",
    parseAsInteger.withDefault(defaultPerPage).withOptions(NUQS_OPTIONS)
  );

  const [sorting, setSorting] = useQueryState(
    "sort",
    sortingStateParser.withDefault(defaultSort).withOptions(NUQS_OPTIONS)
  );

  // ── Filter state from URL ─────────────────────────────────────────────

  // Use useQueryStates with a static parsers map built from filterFields.
  // We build the parsers map once (stable reference via useMemo).
  // biome-ignore lint/suspicious/noExplicitAny: dynamic parser map requires flexible typing
  const filterParsers = useMemo<Record<string, any>>(() => {
    const parsers: Record<string, unknown> = {};
    for (const field of filterFields) {
      if (field.type === "string") {
        parsers[field.urlKey] = parseAsString;
      } else if (field.type === "array") {
        parsers[field.urlKey] = parseAsArrayOf(parseAsString);
      }
    }
    return parsers;
  }, [filterFields]);

  const [filterUrlState, setFilterUrlState] = useQueryStates(
    filterParsers,
    NUQS_OPTIONS
  );

  // ── Local (ephemeral) UI state ─────────────────────────────────────────

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // ── Map URL state → TanStack Table state ──────────────────────────────

  const pagination: PaginationState = useMemo(
    () => ({ pageIndex: page - 1, pageSize: perPage }),
    [page, perPage]
  );

  const columnFilters: ColumnFiltersState = useMemo(() => {
    const filters: ColumnFiltersState = [];
    for (const field of filterFields) {
      const urlValue = filterUrlState[field.urlKey];
      if (urlValue != null && urlValue !== "") {
        filters.push({ id: field.id, value: urlValue });
      }
    }
    return filters;
  }, [filterFields, filterUrlState]);

  // ── Handlers that sync TanStack changes → URL ─────────────────────────

  const handlePaginationChange = useCallback(
    (
      updaterOrValue:
        | PaginationState
        | ((old: PaginationState) => PaginationState)
    ) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue;

      if (next.pageSize !== pagination.pageSize) {
        setPage(1);
      } else {
        setPage(next.pageIndex + 1);
      }
      setPerPage(next.pageSize);
    },
    [pagination, setPage, setPerPage]
  );

  const handleSortingChange = useCallback(
    (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;
      setSorting(next);
      // Reset to page 1 on sort change
      setPage(1);
    },
    [sorting, setSorting, setPage]
  );

  const handleColumnFiltersChange = useCallback(
    (
      updaterOrValue:
        | ColumnFiltersState
        | ((old: ColumnFiltersState) => ColumnFiltersState)
    ) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(columnFilters)
          : updaterOrValue;

      // Build URL state update from column filters
      const newFilterState: Record<string, string | string[] | null> = {};
      for (const field of filterFields) {
        const filter = next.find((f) => f.id === field.id);
        newFilterState[field.urlKey] =
          (filter?.value as string | string[]) ?? null;
      }
      setFilterUrlState(newFilterState);
      // Reset to page 1 on filter change
      setPage(1);
    },
    [columnFilters, filterFields, setFilterUrlState, setPage]
  );

  // ── Create table instance ─────────────────────────────────────────────

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: enableRowSelection as
      | boolean
      | ((row: { original: TData }) => boolean)
      | undefined,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: coreRowModel,
  });

  return { table };
}
