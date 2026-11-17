# AGENTS.md — ERP Cloning Playbook & Agent Instructions

## Methodology Name
**Authenticated DOM-First Reverse Engineering & Dependency-Tiered Full-Stack Reconstruction**
*(Short name: **HTML-Contract-Driven ERP Cloning**)*

This repository (`erp_clone`) is a full-stack Next.js 14 (App Router + TypeScript + Prisma + SQLite) clone of `https://erp.ehishabi.com` (e-Hishabi Real Estate & Development ERP).

---

## Core Architecture & Stack
- **Framework**: Next.js 14 (`src/app/`), React 18, TypeScript (`strict: true`)
- **Database**: SQLite (`prisma/dev.db`) via Prisma ORM v5 (`prisma/schema.prisma`)
- **Styling (Modular CSS Architecture)**: Original CSS split into global core + per-module stylesheets for zero bloat:
  1. `/css/bootstrap.min.css` (in `public/css/`)
  2. `/css/style.css` (in `public/css/`)
  3. `/css/erp-global.css` (107 KB extracted core shell/cards/tables/forms/theme, in `public/css/`)
  4. `/css/app-vite.css` (Tailwind v4 `tw:` utility layer + `.erp-sidebar` / `.erp-stat`, in `public/css/`)
  5. Per-module CSS in `src/styles/modules/*.css` (`auth.css`, `organization.css`, `settings-profile.css`, `land.css`, `crm.css`, `hr.css`, `projects.css`, `accounting.css`, `procurement.css`, `sales-inventory.css`, `pos.css`, `contractors-equipment.css`) — imported only inside each module's `layout.tsx`.
- **Brand Assets**: `public/brand/erp-icon.svg`, `public/brand/erp-logo.jpg`
- **Auth**: Cookie-based session (`estate_erp_user`) via `src/lib/auth.ts` (`admin@ehishabi.com` / `password`)
- **Navigation Shell**: `src/components/ErpShell.tsx` + `src/lib/navigation.ts` (all 16 sidebar modules and ~130 routes)

---

## 5-Step Protocol for Cloning Any Module (100% Fidelity)

When cloning a new module or tier from the reference ERP (`https://erp.ehishabi.com`), every AI agent must follow these exact 5 steps:

### Step 1 — Authenticated DOM Harvesting
Authenticate against `https://erp.ehishabi.com/login` (CSRF `_token` + `login` + `password`) and download the rendered HTML of both the **list view**, **create/edit view**, and **detail view** for every route in the target tier. Extract `<main class="erp-main">...</main>` from each downloaded HTML file so you can inspect the exact live markup without token bloat.

### Step 2 — Form-Contract Schema Inference
From each extracted HTML `<main>` file, inspect:
- Every `<form>` input/select/textarea/switch `name="..."`, `type`, `required`, `maxlength`, and validation message.
- Every `<select>` option list and enum value.
- Every `<table>` column header and empty-state block (`.erp-empty`).
- Translate these 1:1 into `prisma/schema.prisma` models and `prisma/seed.ts` records.

### Step 3 — Dependency-Tiered Build Order (`Tier 0 → Tier 5`)
Always build dependencies before dependents so downstream modules read real database records instead of hardcoded arrays:
- **Tier 0 (Zero-Dependency System & Org Masters)** — **DONE**
  - Organization: `/organization/companies`, `/organization/branches`, `/organization/departments`, `/organization/designations`, `/organization/company-tree`, `/organization/fiscal-years`, `/organization/holidays`, `/organization/shifts`
  - Settings & Profile: `/settings/users`, `/settings/roles`, `/settings/code-sequences`, `/documents`, `/settings/invoice-templates`, `/settings/mfs-services`, `/settings/audit`, `/settings/application`, `/profile`, `/profile/preferences`, `/profile/security`
- **Tier 1 (Financial & Catalog Masters)** — *Next*
  - Finance Setup: `/accounting/accounts` (Chart of Accounts), `/accounting/heads`, `/accounting/banks`, `/accounting/lenders`
  - Material Setup: `/pos/units`, `/pos/categories`, `/pos/warehouses`, `/pos/products`
- **Tier 2 (Real Estate Core)**
  - **Tier 2A — Land Acquisition (`/land/*`)** — **DONE** (`parcels`, `owners`, `proposals`, `agreements`, `payments`, `bank`)
  - **Tier 2B — Projects & Buildings** (`/projects/types`, `/projects/categories`, `/projects/projects`, `/buildings`, `/projects/projects/wbs-templates`, `/projects/projects/cbs-templates`, `/projects/projects/estimate-templates`, `/projects/projects/task-templates`, `/projects/projects/parameters`, `/projects/projects/itp-templates`, `/projects/projects/cost-breakdown`, `/projects/inspection-checklists`)
  - **Tier 2C — Unit Inventory** (`/inventory/units`, `/inventory/availability`, `/inventory/land-plots`, `/inventory/price-lists`, `/inventory/unit-blocking`)
- **Tier 3 (Construction, Contractors, Equipment & Procurement)**
  - `/boqs`, `/boq-scopes`, `/resource-analyses/workbench`, `/resources`
  - `/suppliers/suppliers`, `/vendors/vendors`, `/procurement/*`, `/requisitions`, `/rfqs`, `/purchases/*`, `/material-issues`, `/inventory/stock-transfers`, `/material-consumptions`
  - `/contractors/*`, `/equipment/*`
- **Tier 4 (Revenue, CRM, Sales & HR)**
  - `/crm/*` (Pipelines, Follow-up Types, Lost Reasons → Leads, Customers, Follow-ups, Site Visits)
  - `/clients`, `/owners`, `/agreements`, `/sales/*`, `/payments/*`
  - `/hr/*` (Salary Structures, Deduction Heads → Employees, Attendance, Leave, Payroll)
- **Tier 5 (Ledgers, Dashboards & Reports)**
  - `/accounting/daily`, `/accounting/journals`, `/accounting/contra`, `/accounting/income-expenses`, `/accounting/loans`, `/accounting/ledger`, `/accounting/trial-balance`, `/accounting/balance-sheet`, `/accounting/cash-flow`
  - `/reports/*`, `/dashboard/procurement`

### Step 4 — 1:1 CSS Class & Markup Preservation
- Never invent custom Bootstrap/Tailwind wrapper layouts when the target CSS already defines `.erp-*`, `.cf-*`, `.ctree-*`, or `.nk-*`.
- Reuse the exact page header (`.erp-pagehead`), toolbar/filter bar (`.erp-toolbar` / `.erp-filterbar`), empty state (`.erp-empty`), table (`.erp-table`), card sections (`.erp-card` + `.erp-section-head`), and sticky form bar (`.erp-form-bar`).
- Implement interactive dropdowns, modals, tabs, and switches in React state (avoid relying on external jQuery/Bootstrap JS CDN scripts inside Next.js App Router).
- Keep `src/app/(erp)/[...slug]/page.tsx` only as a fallback for unbuilt routes; creating an explicit route under `src/app/(erp)/...` overrides the catch-all automatically.

### Step 5 — Build & Self-Terminating Headless Verification
1. Run `npx prisma db push && npx prisma generate && npx tsx prisma/seed.ts`.
2. Run `npm run build` and ensure 0 TypeScript or route compilation errors.
3. Run a Node `fetch` probe script against `next start` on an isolated test port verifying HTTP 200 on every new page and CRUD API round-trip (`POST` → `GET` → `PATCH` → `DELETE`), ending the script cleanly with `process.exit(0)`.

---

## Copy-Paste Prompt for Any AI Agent (to Clone Next Tiers)

Use this prompt whenever starting a new session or switching AI models:

```text
Read c:\job\erp_clone\AGENTS.md and c:\job\erp_clone\prisma\schema.prisma first.
We are building a 100% faithful full-stack Next.js 14 + TypeScript + Prisma (SQLite) clone of https://erp.ehishabi.com using the "Authenticated DOM-First Reverse Engineering & Dependency-Tiered Full-Stack Reconstruction" methodology.

Login credentials for the live reference site:
URL: https://erp.ehishabi.com
Login: admin@ehishabi.com
Password: password

Task: Clone [INSERT TIER/MODULE HERE, e.g., "Tier 1: Finance Masters (/accounting/accounts, /accounting/heads, /accounting/banks, /accounting/lenders) & Material Masters (/pos/units, /pos/categories, /pos/warehouses, /pos/products)"] using the 5-step protocol in AGENTS.md:
1. Log into erp.ehishabi.com, download the live HTML for all list + create + detail pages in this tier, and extract `<main class="erp-main">`.
2. Add/update Prisma models in prisma/schema.prisma and seed real records in prisma/seed.ts matching all form fields, selects, and table columns 1:1.
3. Implement Next.js API routes (/api/...) and App Router pages under src/app/(erp)/... preserving exact `.erp-*` CSS classes and UI copy.
4. Wire any downstream modules (such as Land Payments or Projects) to consume the new master records dynamically.
5. Verify with `npx prisma db push`, `npx tsx prisma/seed.ts`, `npm run build`, and a self-terminating Node smoke test (calling process.exit(0) after killing the test server) confirming HTTP 200 and CRUD persistence across all new routes.
```
