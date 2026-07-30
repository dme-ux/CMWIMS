# CMW ERP — Smart Inventory & Workshop Management System

Production ERP for **Capital Motor Works** (luxury car service, repair & spare-parts).
Built with Next.js 15, TypeScript, Prisma, PostgreSQL, Tailwind, Framer Motion.

> **Founder:** Sunil Tiwari · Connect@systemmaster.in · +91 90279 65956
> **Powered by SystemMaster** · www.systemmaster.in

---

## What's in this build (Phase 1 — Foundation)

- Complete **Prisma schema** — masters, inventory, stock movement (audit trail),
  purchase (PR/PO/GRN/invoice/payment), vendor ledger, workshop, settings, notifications, sheet-sync logs.
- **JWT authentication** + **role-based access control** (9 roles).
- **3D glassmorphism login** with your logo, animated background, remember-me, forgot-password.
- **Dashboard** with live KPIs, animated stat cards, interactive purchase/issue chart.
- **RBAC-gated sidebar** navigation across every module.
- **Dark / light mode**, responsive, reduced-motion friendly.
- **Google Sheets live sync** — Apps Script + server-side sync client.
- Seed data with one login per role.

Module screens (inventory tables, PO forms, reports, etc.) are scaffolded as
navigation targets and land in Phases 2–4 (see Roadmap).

---

## Quick start

```bash
# 1. install
npm install

# 2. configure
cp .env.example .env         # then edit DATABASE_URL + JWT_SECRET

# 3. database
npm run db:push              # create tables
npm run db:seed              # sample data + logins

# 4. run
npm run dev                  # http://localhost:3000
```

### Default logins (password for all: `Cmw@2025`)

| Username | Role |
|----------|------|
| `admin` | Administrator (full access) |
| `manager` | Manager |
| `store` | Store Manager |
| `purchase` | Purchase |
| `accounts` | Accounts |
| `workshop` | Workshop |
| `advisor` | Service Advisor |
| `tech` | Technician |
| `viewer` | Viewer (read-only) |

> Change these immediately in production.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Create a PostgreSQL database (Neon / Supabase / Railway) and copy its URL.
3. In Vercel → **New Project** → import the repo.
4. Add environment variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`.
5. Deploy. After the first deploy, run migrations from your machine:
   ```bash
   DATABASE_URL="<prod-url>" npm run db:push
   DATABASE_URL="<prod-url>" npm run db:seed
   ```
6. Open the deployment URL and sign in.

---

## Google Sheets Live Sync

1. Open your Google Sheet → **Extensions → Apps Script**.
2. Paste `google-apps-script/Code.gs`, set `API_KEY`.
3. **Deploy → New deployment → Web app** (Execute as *Me*, access *Anyone*).
4. Copy the Web App URL into **Settings → Google Sheets** in the ERP, along with the same API key.
5. Every create/update/delete now mirrors into the sheet. Logs live in `SheetSyncLog`.

---

## Tech stack

Next.js 15 · React 18 · TypeScript · Tailwind CSS · Framer Motion · Recharts ·
Lucide · Prisma ORM · PostgreSQL · JWT (jose) · bcryptjs.

## Project structure

```
src/
  app/
    (auth)/login            3D glassmorphism login
    (auth)/forgot-password
    (dashboard)/            protected shell (sidebar + topbar)
      dashboard/            executive dashboard
    api/auth/               login / logout / me
  components/
    layout/                 sidebar, topbar
    dashboard/              stat cards, charts
    ui/                     button, card
  lib/
    auth/                   rbac, session (JWT), password
    prisma.ts, utils.ts, sheet-sync.ts
prisma/
  schema.prisma            full data model
  seed.ts                  sample data + role logins
google-apps-script/Code.gs Sheets sync web app
```

## Roadmap

- **Phase 2** — Inventory module (smart search, add/edit/delete, barcode/QR, location map).
- **Phase 3** — Purchase (PR→PO→GRN→Invoice→Payment), vendor ledger, accounting.
- **Phase 4** — Reports (Excel/PDF/CSV export), stock analysis (ABC/XYZ, dead stock, ageing), notifications, workshop job cards.

---

© Capital Motor Works. Powered by SystemMaster.
