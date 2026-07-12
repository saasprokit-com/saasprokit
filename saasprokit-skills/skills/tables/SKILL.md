---
name: tables
description: Server-driven data table pages for this repo — the one pattern behind every page that lists, paginates, sorts, or filters database records. Read before creating or modifying any table or list page.
---

# Table Page Patterns & Scaffold Recipe

One pattern powers every data table: **TanStack Table in fully-manual mode + nuqs URL state + Prisma**. The URL is the single source of truth — page, sort, and filters are query params; `useDataTable` writes them with `{ shallow: false }`, which re-runs the server component, so all row math happens in Prisma. Nothing is filtered, sorted, or paginated client-side.

Canonical examples, all under `apps/web/app/[locale]/(app)/[orgSlug]/members/`: `members/` (root), `invitations/`, `invite-links/`. **Copy from `invitations/`** — it exercises everything: search, two faceted filters, conditional row selection, bulk + per-row actions.

## Shared infrastructure — reuse, never recreate

| Piece | Path | Provides |
| --- | --- | --- |
| `useDataTable` | `apps/web/hooks/use-data-table.ts` | Binds table state to URL params; sets `manualPagination/Sorting/Filtering`; resets to page 1 on sort/filter change. `filterFields: {id, urlKey, type: "string" \| "array"}[]` maps column ids → URL keys |
| `sortingStateParser` | `apps/web/lib/parsers.ts` | `SortingState` ⇄ `"createdAt.desc"` in the URL |
| `GetListPayload<T>` | `apps/web/types/queries.ts` | Query return shape `{ data, total, totalPage, limit }` |
| Table pieces | `packages/design-system/components/data-table/` | `column-header`, `pagination`, `faceted-filter`, `view-options`, `table-skeleton` |
| Debounce | `apps/web/hooks/use-debounced-callback.ts` | Search input debouncing (`SEARCH_DEBOUNCE_MS`, see `members/utils.ts`) |

**Never import** `data-table/data-table.tsx` or `data-table/toolbar.tsx` from the design system — unused legacy client-side implementations (`getFilteredRowModel` etc.) that silently break the server-driven pattern.

## File layout (colocated with the feature)

```
your-feature/
├── page.tsx            # RSC: auth → parse URL → start query promise → Suspense
├── validations.ts      # nuqs search-params cache — THE URL contract
├── queries.ts          # server-only Prisma query → GetListPayload<T>
├── schemas.ts          # zod schemas for mutation inputs
├── actions.ts          # server actions (see saasprokit:forms)
├── utils.ts            # permission flags + SEARCH_DEBOUNCE_MS (redeclare per feature; don't cross-import from members/)
└── components/
    ├── x-table.tsx     # use(promise) + useDataTable + render
    ├── x-columns.tsx   # getXColumns() factory + filter options
    ├── x-toolbar.tsx   # search, faceted filters, bulk actions
    ├── x-actions.tsx   # per-row dropdown
    └── *-dialog.tsx    # confirm/bulk dialogs
```

## Recipe

**1. `validations.ts`** — write this first; its parsed type IS the contract `queries.ts` consumes:

```ts
import { createSearchParamsCache, parseAsArrayOf, parseAsInteger, parseAsString } from "nuqs/server";
import { sortingStateParser } from "@/lib/parsers";

export const thingsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: sortingStateParser.withDefault([]),
  q: parseAsString.withDefault(""),                       // text search — always "q"
  status: parseAsArrayOf(parseAsString).withDefault([]),  // one per faceted filter
});
export type ThingsSearchParams = Awaited<ReturnType<typeof thingsSearchParamsCache.parse>>;
```

**2. `queries.ts`** — starts with `import "server-only"`; input is `ThingsSearchParams & { organizationId: string }`:

```ts
const thingSelect = { id: true, name: true, createdAt: true } satisfies Prisma.ThingSelect;
export type Thing = Prisma.ThingGetPayload<{ select: typeof thingSelect }>;
const SORTABLE_FIELDS = new Set(["name", "createdAt"]); // allow-list — sort ids come from the URL

// where: q → { contains: q, mode: "insensitive" }; enum arrays → { in: [...] }
const [data, total] = await Promise.all([
  database.thing.findMany({ where, select: thingSelect, skip: (page - 1) * perPage, take: perPage, orderBy }),
  database.thing.count({ where }),
]);
return { data, total, totalPage: Math.ceil(total / perPage), limit: perPage };
```

**3. `page.tsx`** — `validateOrgMembershipBySlug(orgSlug)` + `getDictionary(locale)`, then parse and stream. **Start the query promise WITHOUT awaiting it** — the client resolves it with `use()` inside Suspense, so the shell streams and `TableSkeleton` shows:

```tsx
const parsed = thingsSearchParamsCache.parse(resolvedSearchParams);
const thingsPromise = getThings({ ...parsed, organizationId: orgContext.organizationId }); // no await
return (
  <Suspense fallback={<TableSkeleton />}>
    <ThingsTable thingsPromise={thingsPromise} errors={dict.errors.action} /* + permissions, orgId */ />
  </Suspense>
);
```

Derive page-level permission flags in `utils.ts` from `orgContext.role` via `orgRoleDefinitions[role].statements` — copy `getMemberPermissions` in `members/utils.ts`. Type trap: `statements.member ?? []` typechecks because every role declares `member`; for a resource missing from some role (e.g. `team`), the property access itself fails on the union — guard with `"team" in statements ? statements.team : []`.

**4. `x-columns.tsx`** — a `getThingColumns({ canManage, errors, organizationId })` **factory**, not a static array: conditionally `push` the select-checkbox column (`id: "id"` — must not collide with an accessor) and the actions column when `canManage`. Sortable headers use `DataTableColumnHeader`; the column's `accessorKey` must be a Prisma field in `SORTABLE_FIELDS`. Export `xFilterOptions` arrays for faceted filters. Copy `invitations-columns.tsx`.

**5. `x-table.tsx`** — `"use client"`: `use(thingsPromise)`, `useMemo` the columns, then

```ts
const { table } = useDataTable({ data, columns, pageCount: totalPage || 1,
  filterFields: [{ id: "name", urlKey: "q", type: "string" }], // ids/urlKeys mirror validations.ts
  enableRowSelection: canManage });
```

Render toolbar → bordered `<Table>` with `flexRender` + empty-state row → `<DataTablePagination>`. Copy `invitations-table.tsx`.

**6. `x-toolbar.tsx`** — search `Input` with local `useState` synced from URL, `useDebouncedCallback` → `column.setFilterValue(value || undefined)` (never a router push); `DataTableFacetedFilter` per enum column; Reset button when `columnFilters.length > 0`; bulk-action dialog when `table.getSelectedRowModel()` has rows; `DataTableViewOptions`. Copy `invitations-toolbar.tsx`.

**7. Mutations** — standard server actions (`saasprokit:forms`): `schema.parse` → `checkOrgPermission` (early-return `actionError("unauthorized")` from `@/lib/auth/action-error` when it fails) → mutate → **`revalidateOrgPage(orgSlug, ORG_PAGES.X)`** so the table refreshes in the same roundtrip. Scope every write by `organizationId` in the `where`. Dialogs use the RHF + `startTransition` recipe; irreversible per-row actions (deletes) get a confirm `AlertDialog` — invitations' instant cancel is not the model for destructive ops.

**8. Wiring** — BOTH halves of the route: `orgRoutes.x(slug)` helper AND `ORG_PAGES.X` constant (`@/lib/routes` — one sometimes exists without the other); sidebar nav item in `org-sidebar.tsx`; `layout.tsx` with `SetBreadcrumbs` + `ContentSection` if it's a new section — copy `members/layout.tsx` (see `saasprokit:workflows`).

## Gotchas

- **Never await the query in the RSC** — that serializes rendering and defeats the `TableSkeleton` streaming.
- **No client row models** (`getFilteredRowModel`/`getSortedRowModel`/`getPaginationRowModel`) and no local sort/filter state — everything routes through `useDataTable`'s `filterFields`, or the URL and the server query drift apart.
- **Three-way alignment**: column `accessorKey` (columns) = `filterFields.id` (table) = query param the server consumes (validations/queries). Text search URL key is `q` — `invite-links/` uses `search`, the outlier; don't copy that.
- **Allow-list sortable fields** in `buildOrderBy` — `?sort=` ids come from the URL; an unknown field makes Prisma throw at runtime. The canonical `invitations/queries.ts` predates this rule and writes any URL id into `orderBy` — don't copy its `buildOrderBy` verbatim.
- `pageCount: totalPage || 1` — TanStack misbehaves with `pageCount: 0`.
- New action error keys: `toActionError`'s `fallback` is typed against `errors.action` — add the key to every `packages/internationalization/dictionaries/*.json` (English is fine; `languine` translates later).

See `saasprokit:workflows` (new-page skeleton), `saasprokit:auth` (`validateOrgMembershipBySlug`, `checkOrgPermission`), `saasprokit:data-access` (file placement), `saasprokit:forms` (actions + dialogs).
