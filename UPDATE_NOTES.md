# Update — Expenses Module + Vendor Ledger (Sep 2026)

## 1. Expenses module (new)
**Sidebar → Expenses**

Tracks day-to-day operational spend — food, electricity, fuel, rent, tools,
water, internet, or any category you add — separate from vendor purchase
bills.

- Add / edit / delete expense entries (date, category, description, amount,
  paid by, payment mode)
- Categories are fully editable — add a new one inline from the entry form,
  no code change needed
- Table shows every entry with search (description / paid by / mode),
  category filter, date-range filter, and a running total
- Dashboard-style cards: Today, This month, Filtered total
- Category-wise pie chart + last-8-weeks trend line chart
- CSV export of whatever is currently filtered
- Also listed under **Reports → Expense Report**

## 2. Vendor Ledger (Accounting page)
**Sidebar → Accounting**

New table above the bills list: one row per vendor showing **Billed /
Paid / Pending**, running total across every bill — this is the "boss
view" of how much is owed to which vendor and how much has already been
paid. Also added as **Reports → Vendor Payment Report** (CSV export).

## 3. Dashboard
- New "Expenses (month)" stat card
- "Add expense" quick action

## Files touched
- `prisma/schema.prisma` — `ExpenseCategory`, `Expense` models
- `SETUP.sql` — matching tables/indexes for the Supabase manual-setup path
- `src/lib/expenses.ts`, `src/lib/accounting.ts` (added `getVendorDues`)
- `src/lib/master-config.ts`, `src/app/api/masters/[type]/route.ts` — expense
  categories also manageable from Masters (Admin/Manager)
- `src/app/api/expenses/*` — CRUD + category quick-add API
- `src/app/(dashboard)/expenses/page.tsx`, `src/components/expenses/expenses-client.tsx`
- `src/lib/reports.ts` — `vendor-payments`, `expenses` report definitions
- `src/components/layout/sidebar.tsx`, `src/lib/auth/rbac.ts` (new
  `expenses.view` / `expenses.manage` permissions)
- `src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard/stat-cards.tsx`

## Deploy
Same as before — after pulling this update:
```bash
npm install
npx prisma db push     # creates ExpenseCategory + Expense tables
npm run build
```
On Supabase (manual SQL path), re-run the updated `SETUP.sql` — but note it
**drops and recreates the whole schema**, so only use it on a fresh database,
not on production data. For an existing production database, run
`npx prisma db push` instead — it only adds the new tables.
