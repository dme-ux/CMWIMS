# CMWIMS Final Customer Approval Update — 06 Oct 2026

## Job Card approval
- Approval is now taken from the **customer**, not Arjun Kapur.
- Approval WhatsApp opens using the **main mobile number saved on the Job Card / customer record**.
- The shared file is the normal Job Card PDF (`<job-number>.pdf`), not a separate approval-copy PDF.
- The customer receives a short professional message asking them to reply APPROVED or send corrections.
- Until approval is recorded, Job Card Print / Save PDF remains locked.
- Service Advisor / authorised editor can manually record a customer's approval after receiving the customer's reply/confirmation.
- Manual approval records advisor name, time, remarks, approval source and customer phone in the audit data.
- Customer correction can be recorded and status becomes `REVISION_REQUIRED`.
- Arjun Kapur-specific approver fields were removed from Settings UI.

## Job Card list usability
- Job Cards are paginated at **10 records per page**.
- Previous / Next controls show current page and displayed record range.
- Search/status/service filters reset pagination to page 1.
- Filter area is sticky to reduce repeated scrolling.

## Terms
- Pickup / delivery risk clause remains in Job Card Terms & Conditions.

## Database update
Run `PRODUCTION_UPDATE_2026_10_06.sql` on production before deploying this code. The latest block adds:
- `WorkshopJob.approvalSource`
- `WorkshopJob.approvalCustomerPhone`

## Validation
Targeted TypeScript parsing was run on the changed TS/TSX files; no TS syntax errors were found. A full Next production build still requires normal project dependencies (`npm ci` / `npm install`) in the deployment environment.
