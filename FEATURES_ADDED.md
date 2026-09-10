# New Features — September 2026 Update

## 1. Vendor Material Report
**Reports → Vendor Material Report**

Shows exactly what material came in from which vendor: date, vendor, item,
SKU, quantity received, rate, amount, PO number and GRN number — one row per
line received. Filter by a specific vendor and/or a From–To date range, or
leave both blank to see everything. Uses the actual Goods Receipt records,
so it reflects real receipts, not just what was ordered.

## 2. Vendor Payment Report
**Reports → Vendor Payment Report**

Vendor-wise summary: how much was billed in the selected period, how much
was paid in that period, and how much is still pending across all open
bills (pending is always shown as a current, running total — it isn't
squeezed into the date filter, since "how much do I owe this vendor right
now" doesn't make sense as a period-limited number). Filter by vendor
and/or date range the same way as the material report.

Both reports support CSV export via the existing "Export" button, same as
every other report.

## 3. Clickable dashboard stat cards
Every card on the Dashboard (Inventory value, Total items, Low stock, Out
of stock, Pending orders, Pending payments) is now a link:

- **Inventory value / Total items** → Inventory list
- **Low stock** → Inventory list, pre-filtered to low stock
- **Out of stock** → Inventory list, pre-filtered to out of stock
- **Pending orders** → Purchase Orders list
- **Pending payments** → Accounting (bills + outstanding summary)

## Files touched
- `src/lib/reports.ts` — added `vendor-material` and `vendor-payments`
  report definitions, plus a shared `ReportFilters` type (vendor + date
  range) that any report can opt into.
- `src/components/reports/report-filter-bar.tsx` — new vendor/date-range
  filter UI, used by the two new reports.
- `src/app/(dashboard)/reports/[report]/page.tsx` — reads `vendorId`,
  `from`, `to` from the URL and renders the filter bar for reports that
  declare `filterable`.
- `src/components/dashboard/stat-cards.tsx` — each card is now a `Link`.
- `prisma/schema.prisma` — added indexes on `GoodsReceiptItem.createdAt`,
  `PurchaseInvoice.vendorId`/`invoiceDate`, and `Payment.vendorId`/`paidAt`
  to keep the new date-range/vendor filters fast.

Same as before: run `npx prisma db push` after deploying so the new
indexes take effect on your database.
