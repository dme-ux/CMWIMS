# CMW ERP — Final Update (06 Oct 2026)

## Implemented

### 1. Job Card terms
- Pickup/delivery risk clause added to the default Job Card Terms.
- Existing installations with older saved Terms are protected: the print/PDF view automatically appends the pickup/delivery risk clause if it is missing.

### 2. Job Card approval gate
- New approval states: PENDING, APPROVED, REJECTED, REVISION_REQUIRED.
- Job Card Print / Save PDF remains locked until approval is APPROVED and the logged-in user has `workshop.print`.
- Approval request, approval, rejection/correction and remarks are audit-logged.
- Approval metadata stores request time/requester, approver, approval time and remarks.
- Settings now include Job Card Approver Name (default: Arjun Kapur) and Approver WhatsApp number.

### 3. WhatsApp approval with PDF
- "Send approval request on WhatsApp" generates a two-page PDF approval copy containing customer/vehicle/service/checklist/parts/terms data.
- On devices supporting Web Share with files, the PDF is attached directly to the share sheet so WhatsApp can be selected with the PDF attached.
- Fallback: PDF downloads locally and WhatsApp opens with a pre-filled approval message.
- If Approver WhatsApp number is configured, fallback opens that number directly.

### 4. Per-user Access Control
- New `customPermissions` on users.
- Role Default or exact Custom Permissions can be selected per user.
- Permissions are re-read from DB on every request, so changes take effect immediately.
- Sidebar is filtered by exact user permission.
- Backend APIs/pages now use the same effective per-user permissions.
- Job Cards are split into View / Create / Edit / Status / Parts / Approve / Print.
- Expenses are split into View / Create / Edit / Delete / Export / Dashboard.
- Other existing modules retain view/manage permissions.
- A Job Card Create-only user can be limited to Dashboard + Job Cards; Customers/Vehicles/Estimates/QC/Gate Pass are not shown unless relevant workshop edit/status permissions are granted.

### 5. Expenses
- Existing expense totals retained/fixed.
- Summary cards now show Today, This Month, Last Month, Financial Year and Filtered Total.
- Existing category pie and 8-week trend remain.
- Table total always reflects current filters.
- Create/Edit/Delete/Export are independently permission-controlled.
- Expense query capacity increased to 1000 recent rows and includes payment-mode search.

### 6. Demo users
- Prisma seed now creates only the main admin account; generic demo users are no longer recreated.
- `PRODUCTION_UPDATE_2026_10_06.sql` deactivates the old standard demo usernames if they still exist.

## Deployment steps
1. Back up the production database.
2. Run `PRODUCTION_UPDATE_2026_10_06.sql` in the PostgreSQL/Supabase SQL editor OR run `npx prisma db push` for schema changes (the SQL file additionally deactivates old demo users).
3. Set Arjun Kapur's WhatsApp number in Settings > Document Terms & Conditions.
4. In Users & Access, give the person who records Arjun Kapur's WhatsApp approval `workshop.approve` and appropriate Job Card permissions.
5. Deploy the updated code.

## Validation note
A full Next.js production build could not be executed in the sandbox because dependency installation timed out. TypeScript parser checks on the changed TS/TSX files reported no syntax diagnostics. Run `npm ci && npm run build` in CI/Vercel before production promotion.
