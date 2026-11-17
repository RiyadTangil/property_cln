# e-Hishabi ERP Clone (Full-Stack Next.js + Prisma)

Full-stack TypeScript clone of `https://erp.ehishabi.com` built using **Authenticated DOM-First Reverse Engineering & Dependency-Tiered Full-Stack Reconstruction** (see [AGENTS.md](./AGENTS.md)).

## Quick Start

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Open `http://localhost:3000` and sign in:
- **Email / Username**: `admin@ehishabi.com` (or `admin`)
- **Password**: `password`

## Implemented Modules

- **Core Shell & Auth**: Sign-in, account recovery, Light/Dark/System themes, Sidebar/Top-bar layout switcher, 9-colour sidebar palette, `Ctrl+K` route search, 16 sidebar module groups (~130 routes).
- **Executive Dashboard (`/dashboard`, `/dashboard/executive`)**: Health banner, KPI cards, Module Snapshot with live DB counters, Financial & Operational SVG charts, Project Progress, Recent Bookings, Audit Feed, Receivables Ageing.
- **Tier 0A — Organization (`/organization/*`)**: Companies, Branches, Departments (26 seeded + parent/child tree + bulk add), Designations (grades 1–9 + bulk add), Interactive Company Tree (`.ctree`), Fiscal Years, Holidays, Shifts.
- **Tier 0B — Settings, Documents & Profile (`/settings/*`, `/documents`, `/profile/*`)**: Users, Roles & Permissions Workbench, Code Generators (22 sequences wired to Land/Owner codes), Documents Repository, Drag/Click Invoice Template Designer with live preview, MFS Services, Audit Trail, Application Settings, Profile / Preferences / Security.
- **Tier 2A — Land Acquisition (`/land/*`)**: Land Parcels (10-stage pipeline rail + unit conversions + detail dossier), Landowners (5 party types, NID uniqueness, minor/deceased deed-capacity guard), Proposals, Agreements & MOU, Land Payment Vouchers (AIT/deduction net-payable + book value sync), Land Bank (project allocation), CSV exports.

## Scripts
- `npm run dev` — Run local dev server on port 3000
- `npm run build` — Type-check & build production bundle
- `npm run db:push` — Push Prisma schema to SQLite (`prisma/dev.db`)
- `npm run db:seed` — Seed initial admin user, Tier 0 masters, and projects
