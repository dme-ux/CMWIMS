# Update — Sales, Gross Profit, Attendance & Advance/EMI (Sep 2026)

## 1. Sales (new)
**Sidebar → Sales**

Customer billing, separate from vendor purchase bills:
- Each sale: date, customer (pick existing or type a name), vehicle no,
  description, **Sale Amount** and **Cost of Goods** (optional).
- "Collect" records a payment (Cash / Bank / UPI), full or partial.
- Top cards: Revenue, Gross Profit, Margin % for the current month.
- CSV + **PDF export**.

## 2. Unbilled Purchases (new)
**Sidebar → Unbilled Purchases**

For vendor material received without a formal bill (cash/informal supply) —
date, vendor name (free text), description, amount, paid so far, mode. Feeds
into "All Expenses Report" and "Company Monthly Summary" alongside proper
vendor bills.

## 3. Salary — Attendance & Advance/EMI
**Sidebar → Salary**

- Each row now has a **Present Days** box — enter how many days out of the
  month an employee worked, and Gross pay is automatically prorated
  (baseSalary × presentDays / totalDays). Leave blank for a full month.
- **Advances / EMI** (Sidebar → Salary → "Advances / EMI" button): record
  money given to an employee with a monthly installment amount. From the
  next "Generate Salaries" onward, that installment is automatically
  deducted from the employee's salary each month until fully recovered —
  visible as a "Deductions" column and "Gross − Deductions = Net" breakdown
  in the Pay dialog.

## 4. Reports
- **All Expenses Report** — every rupee that left the company (Expenses +
  Vendor Payments + Unbilled Purchases + Salary paid) as one row-level list.
- **Gross Profit Report** — Sales revenue vs Cost of Goods, month by month.
- **Company Monthly Summary** — extended to include Unbilled Purchases,
  Sales and Gross Profit alongside Expenses/Vendor Payments/Salary.
- **Every report now has a "Export PDF" button** next to "Export CSV" — a
  branded, professional PDF (CMW header, striped table, page numbers).

## Files touched
- `prisma/schema.prisma` — `SalaryPayment` gets `baseSalary`/`presentDays`/
  `totalDays`/`grossAmount`/`deductions`; new `SalaryDeduction`,
  `CustomerInvoice`, `UnbilledPurchase` models; `Customer.invoices` relation
- `SETUP.sql` — matching tables/columns/indexes
- `src/lib/sales.ts`, `src/lib/unbilled.ts` (new)
- `src/lib/salary.ts` — attendance proration, deduction application at
  generation, `SalaryDeduction` CRUD
- `src/app/api/sales/*`, `src/app/api/unbilled-purchases/*`,
  `src/app/api/salary/deductions/*` (new); `src/app/api/salary/[id]` —
  accepts `presentDays` for attendance
- `src/app/(dashboard)/sales/`, `src/app/(dashboard)/unbilled-purchases/`,
  `src/app/(dashboard)/salary/advances/` + matching client components (new)
- `src/components/reports/export-pdf-button.tsx` (new) — used on every
  report page and on Sales/Salary/Expenses lists
- `src/lib/reports.ts` — `all-expenses`, `gross-profit` reports;
  `company-summary` extended
- `src/lib/auth/rbac.ts` — new `sales.view`/`sales.manage` permissions
- `src/components/layout/sidebar.tsx`, dashboard stat cards/quick actions
- `package.json` — added `jspdf` + `jspdf-autotable` for PDF export

## Deploy
```bash
npm install             # picks up jspdf/jspdf-autotable
npx prisma db push       # creates SalaryDeduction, CustomerInvoice,
                          # UnbilledPurchase tables + new SalaryPayment columns
npm run build
```
On Supabase (manual SQL path): run only the **new** `SalaryPayment` columns
and the three new `CREATE TABLE` blocks (`SalaryDeduction`,
`CustomerInvoice`, `UnbilledPurchase`) from the updated `SETUP.sql` if this
is an existing production database — don't re-run the whole script.
