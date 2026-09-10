# Performance Audit & Fixes — September 2026

This pass focused on the reported issue: the system, and specifically the
**Inventory In / Out (Inward & Outward) workflow**, felt slow.

## Root causes found

1. **Unbounded native `<select>` dropdowns.** The Item / Job / Vehicle /
   Customer pickers on the Outward (Issue), Inward (Direct-In), and Purchase
   Order forms rendered one `<option>` per record with no limit. As the
   parts catalogue, customer list, or job list grows into the hundreds or
   thousands, the browser has to build and hold every one of those in the
   DOM — this was the single biggest source of lag on the in/out screens.
2. **Over-fetching on every request.** `getItems()` (Inventory list),
   `getIssuableItems()` (Outward/Inward item pickers), and
   `getStockMovements()` (Stock Ledger, Inward/Outward history) pulled deep,
   multi-relation data with generous or no `take` limits, on every page
   load, with no caching (`export const dynamic = "force-dynamic"` on all
   of these pages, which is correct for data freshness but meant zero
   caching benefit).
3. **Missing index** on `Item.isActive`, which is filtered on almost every
   screen in the app (`where: { isActive: true }`).
4. Minor: a few sequential (instead of parallel) existence-check queries in
   the stock-issue API route added avoidable latency per request.

## What changed

- **New:** `src/components/ui/combobox.tsx` — a small, dependency-free
  search-and-select component. It only ever renders a capped number of
  matching rows (default 50) no matter how large the underlying list is,
  so typing/searching stays instant regardless of catalogue size.
- Swapped the Combobox into:
  - `src/components/outward/issue-form.tsx` — Item, Job Card, Customer,
    Vehicle pickers.
  - `src/components/inward/direct-in-form.tsx` — Item picker.
  - `src/components/purchase/po-form.tsx` — Item picker on PO lines.
- `src/lib/items.ts` — capped nested relations (`crossReferences`,
  `compatibilities`, `locationStocks`) with `take`, and pushed the
  "out of stock" filter down into the SQL `where` clause instead of
  fetching everything and filtering in JavaScript afterwards.
- `src/lib/stock-ledger.ts` — reduced the default page size for the Stock
  Ledger / Inward / Outward history from 500 to 200 rows (still
  overridable, hard-capped at 1000 to prevent accidental huge queries).
- `src/app/api/stock/issue/route.ts` — the customer / vehicle / job-card
  existence checks now run in parallel (`Promise.all`) instead of one
  after another.
- `prisma/schema.prisma` — added `@@index([isActive])` and
  `@@index([isActive, name])` to `Item`.
- `next.config.mjs` — enabled `experimental.optimizePackageImports` for
  `lucide-react` and `recharts` (only ships the icons/chart pieces that are
  actually used, shrinking the client JS bundle) and `compress: true`.

## One step you need to run after deploying

The new index only takes effect once it's applied to your database:

```bash
npx prisma db push
# or, if you use migrations:
npx prisma migrate dev --name add-item-active-index
```

Your `.env.example` was already correctly set up to use Supabase's
transaction pooler (`pgbouncer=true`, port 6543) for `DATABASE_URL` and the
direct connection for `DIRECT_URL` — that part didn't need any change.

## Recommended next steps (not yet done, larger changes)

- Add real pagination (page/limit + "load more") to the Inventory list and
  Stock Ledger UI, instead of a single capped fetch — useful once the
  catalogue or movement history grows past a few thousand rows.
- Consider the same Combobox treatment for any remaining large `<select>`
  lists elsewhere in the app (e.g. workshop/estimate forms), if you notice
  those screens are slow too.
