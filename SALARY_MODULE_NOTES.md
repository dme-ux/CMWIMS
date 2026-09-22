# Update — Employee & Salary Module (Sep 2026)

## 1. Employees (new)
**Sidebar → Employees**

Add each employee once — name, role, phone, and a **fixed monthly salary**.
Edit or deactivate anytime. (Deleting an employee with past salary history
deactivates them instead, so old months' records stay intact.)

## 2. Salary (new)
**Sidebar → Salary**

- **Generate Salaries** — one click at the start of the month creates a
  salary entry for every active employee, using their fixed salary amount.
  Safe to click again — it only fills in employees who don't have an entry
  for that month yet.
- Pick any month with the month picker to see that month's ledger, or go
  back to past months.
- **Mark Paid** — record a payment (full or partial) against any employee's
  salary, with mode **Cash / Bank / UPI** and an optional note (e.g.
  "advance adjusted").
- Status per entry: **Pending / Partial / Paid**.
- Top cards: Due, Paid, Pending for the selected month — the "boss view" of
  total salary outgo.
- CSV export of the selected month's ledger.

## 3. Reports
- **Salary Report** — every employee, every month, with due/paid/pending/mode.
- **Company Monthly Summary** — Expenses + Vendor Payments + Salary side by
  side, month by month, so "company mein kitna kahan ja raha hai" is visible
  in one table.

## 4. Dashboard
- New "Salary (month)" stat card
- "Manage salary" quick action

## Files touched
- `prisma/schema.prisma` — `salary`/`joinedAt` added to `Employee`, new
  `SalaryPayment` model
- `SETUP.sql` — matching tables/indexes for the Supabase manual-setup path
- `src/lib/salary.ts` (new)
- `src/app/api/employees/*`, `src/app/api/salary/*` (new)
- `src/app/(dashboard)/employees/page.tsx`, `src/components/employees/employees-client.tsx` (new)
- `src/app/(dashboard)/salary/page.tsx`, `src/components/salary/salary-client.tsx` (new)
- `src/lib/reports.ts` — `salary`, `company-summary` report definitions
- `src/lib/auth/rbac.ts` — new `salary.view` / `salary.manage` permissions
  (granted to Admin, Manager, Accounts)
- `src/components/layout/sidebar.tsx` — Salary + Employees nav items
- `src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard/stat-cards.tsx`

## Deploy
Same as previous updates:
```bash
npm install
npx prisma db push     # creates SalaryPayment table + Employee columns
npm run build
```
On Supabase (manual SQL path), only run the **new** parts of the updated
`SETUP.sql` (the `Employee`/`SalaryPayment` block plus their new indexes and
foreign key) if you're on an existing production database — the full script
still drops and recreates everything, so don't re-run it wholesale on live
data.
