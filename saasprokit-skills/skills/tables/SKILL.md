---
name: tables
description: Server-driven data table pages for this repo — the one pattern behind every page that lists, paginates, sorts, or filters database records. Read before creating or modifying any table or list page.
---

# Table Page Patterns & Scaffold Recipe

One pattern: **TanStack Table (manual mode) + nuqs URL state + Prisma**. The URL is the single source of truth — `useDataTable` writes params with `{ shallow: false }`, re-running the server component so every filter/sort/page happens in Prisma. Nothing runs client-side.

**Copy from `apps/web/app/[locale]/(app)/[orgSlug]/members/invitations/`** — the fullest example (search + two faceted filters + row selection + bulk & per-row actions). Siblings: `members/`, `members/invite-links/`.

## Reuse — never recreate

| Piece | Path |
| --- | --- |
| `useDataTable` — URL binding, manual modes, page-reset on sort/filter | `apps/web/hooks/use-data-table.ts` |
| `sortingStateParser` — `SortingState` ⇄ `createdAt.desc` | `apps/web/lib/parsers.ts` |
| `GetListPayload<T>` = `{ data, total, totalPage, limit }` | `apps/web/types/queries.ts` |
| `column-header` · `pagination` · `faceted-filter` · `view-options` · `table-skeleton` | `packages/design-system/components/data-table/` |
| `useDebouncedCallback`, `SEARCH_DEBOUNCE_MS` | `apps/web/hooks/`, `members/utils.ts` |

**Never import** `data-table/data-table.tsx` or `data-table/toolbar.tsx` — dead client-side implementations (`getFilteredRowModel` etc.) that break the pattern.

## Steps — one file each, in build order

1. **`validations.ts`** — the URL contract; its parsed type is what `queries.ts` consumes:
   ```ts
   export const thingsSearchParamsCache = createSearchParamsCache({
     page: parseAsInteger.withDefault(1),
     perPage: parseAsInteger.withDefault(10),
     sort: sortingStateParser.withDefault([]),
     q: parseAsString.withDefault(""),                     // text search — always "q"
     roles: parseAsArrayOf(parseAsString).withDefault([]), // array filters — always plural
   });
   export type ThingsSearchParams = Awaited<ReturnType<typeof thingsSearchParamsCache.parse>>;
   ```

2. **`queries.ts`** (`import "server-only"`) — input `ThingsSearchParams & { organizationId }`. `select` via `satisfies Prisma.ThingSelect`, row type via `GetPayload`. Build `where` (`q` → `{ contains, mode: "insensitive" }`; arrays → `{ in }`). `Promise.all([findMany, count])` → `GetListPayload<T>`. **Allow-list** sortable fields in `buildOrderBy` — `?sort=` ids come from the URL, and an unknown field throws at runtime.

3. **`page.tsx`** (RSC) — `validateOrgMembershipBySlug(orgSlug)` + `getDictionary(locale)`, `cache.parse(searchParams)`, then **start the query promise without awaiting** and stream it:
   ```tsx
   const thingsPromise = getThings({ ...parsed, organizationId }); // no await
   <Suspense fallback={<TableSkeleton />}><ThingsTable thingsPromise={thingsPromise} …/></Suspense>
   ```

4. **`utils.ts`** — per-feature `SEARCH_DEBOUNCE_MS` and permission flags from `orgRoleDefinitions[role].statements` (copy `getMemberPermissions`). Type trap: use `"team" in statements ? statements.team : []` — a bare `statements.team` fails on roles that omit it.

5. **`components/x-columns.tsx`** — a `getThingColumns({ canManage, … })` **factory**, not a static array: push the select-checkbox (`id: "id"`) and actions columns only when `canManage`; sortable headers via `DataTableColumnHeader` with `accessorKey` ∈ `SORTABLE_FIELDS`; export `xFilterOptions` for facets. Copy `invitations-columns.tsx`.

6. **`components/x-table.tsx`** (`"use client"`) — `use(thingsPromise)`, `useMemo` the columns, then:
   ```ts
   useDataTable({ data, columns, pageCount: totalPage || 1,
     filterFields: [{ id: "email", urlKey: "q", type: "string" }], enableRowSelection: canManage });
   ```
   Copy `invitations-table.tsx` for the render markup + empty-state row.

7. **`components/x-toolbar.tsx`** — debounced search → `column.setFilterValue(v || undefined)` (never a router push); `DataTableFacetedFilter` per facet; Reset when filtered; bulk dialog on `getSelectedRowModel()`; `DataTableViewOptions`. Copy `invitations-toolbar.tsx`.

8. **`actions.ts` + `schemas.ts`** — server actions (`saasprokit:forms`): `schema.parse` → `checkOrgPermission` (else `actionError("unauthorized")`) → mutate scoped by `organizationId` → **`revalidateOrgPage(orgSlug, ORG_PAGES.X)`**. Destructive per-row actions get a confirm `AlertDialog`. Add new `errors.action.*` keys to every `dictionaries/*.json`.

9. **Wiring** — `ORG_PAGES.X` **and** `orgRoutes.x(slug)` in `@/lib/routes` (one often exists without the other); sidebar item in `org-sidebar.tsx`; `layout.tsx` (`SetBreadcrumbs` + `ContentSection`) for a new section. See `saasprokit:workflows`.

## Gotchas

- **Never await the query in the RSC** — it kills the `TableSkeleton` stream.
- **No client row models** (`getFilteredRowModel`/`getSortedRowModel`/`getPaginationRowModel`) and no local sort/filter state — route everything through `filterFields`.
- **Three-way alignment**: `filterFields.urlKey` (table) = cache key (validations) = destructured param (queries). Not typecheck-caught — a mismatch silently breaks filtering. Column `id`/`accessorKey` is separate and stays.
- **Naming**: text search = `q`; array filter params are plural (`roles`, `statuses`).
- `pageCount: totalPage || 1` — TanStack misbehaves on `0`.

See `saasprokit:workflows`, `saasprokit:auth`, `saasprokit:data-access`, `saasprokit:forms`.
