# Original Job Card PDF WhatsApp Fix — 2026-10-06

- Removed the simplified approval PDF generator.
- Customer approval share now generates the same branded Job Card structure as the Job Card Preview:
  - Capital Motor Works header/logo
  - Job Card number/date/time
  - Customer & Vehicle Details
  - Vehicle Condition / Working Check
  - Accessories / Fuel / Documents
  - Service Requested
  - Parts Issued
  - Signature area
  - Page 2 Terms & Conditions
- Customer main Job Card mobile number is used; 10-digit Indian numbers are normalized with country code 91.
- On browsers/devices supporting Web Share file sharing, the PDF is shared as an actual PDF attachment.
- Desktop WhatsApp Web / wa.me does not permit a website to pre-attach a local PDF for security reasons. In that fallback, the exact original PDF is downloaded automatically and the customer's WhatsApp chat opens with the approval message, ready for the downloaded PDF to be attached.
- Approval remains Pending until the share flow is completed.
