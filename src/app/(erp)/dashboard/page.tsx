import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  AgeingBarChart,
  HorizontalBarsChart,
  SalesCollectionChart,
  SvgPieChart,
} from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [projects, parcelCount, ownedParcelCount] = await Promise.all([
    prisma.project.findMany({ orderBy: { id: "asc" } }),
    prisma.landParcel.count(),
    prisma.landParcel.count({ where: { stage: "owned" } }),
  ]);

  const activeProjectsList = projects.filter((p) => p.code !== "PRJ-2026-001");

  const revenueSlices = [
    { label: "Harmony Heights", value: 118.4, color: "#6c63ff" },
    { label: "Green Meadow Plots", value: 96.2, color: "#00a87e" },
    { label: "Bay View Terrace", value: 84.7, color: "#d9730d" },
    { label: "Riverfront Res.", value: 71.5, color: "#d81b60" },
    { label: "Skyline Tower", value: 41.8, color: "#9c27b0" },
  ];

  const expenseSlices = [
    { label: "Construction", value: 164.8, color: "#6c63ff" },
    { label: "Land Buy", value: 96.4, color: "#00a87e" },
    { label: "Salaries", value: 38.2, color: "#d9730d" },
    { label: "Marketing", value: 21.6, color: "#d81b60" },
    { label: "Other", value: 30.3, color: "#7a8699" },
  ];

  const inventorySlices = [
    { label: "Sold", value: 1286, color: "#6c63ff" },
    { label: "Booked", value: 214, color: "#00a87e" },
    { label: "On Hold", value: 96, color: "#d9730d" },
    { label: "Available", value: 344, color: "#d81b60" },
  ];

  const procurementSlices = [
    { label: "Awaiting Approval", value: 8, color: "#d9730d" },
    { label: "Approved", value: 14, color: "#6c63ff" },
    { label: "Part Received", value: 11, color: "#9c27b0" },
    { label: "Fully Received", value: 9, color: "#00a87e" },
  ];

  return (
    <div className="container erp-dashboard">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-gauge-high"></i>
          </div>
          <div>
            <h1>Executive Dashboard</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Executive Overview
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="erp-pagehead-actions">
          <select className="form-select erp-select" aria-label="Reporting period" defaultValue="This Fiscal Year">
            <option>This Fiscal Year</option>
            <option>This Quarter</option>
            <option>This Month</option>
            <option>Last 12 Months</option>
          </select>
          <select className="form-select erp-select d-none d-md-block" aria-label="Project filter" defaultValue="All Projects">
            <option>All Projects</option>
            {projects.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </select>
          <Link href="/api/land/parcels/export" className="btn btn-erp-ghost">
            <i className="fa-solid fa-file-arrow-down me-2"></i>Export
          </Link>
          <Link href="/dashboard" className="btn btn-erp">
            <i className="fa-solid fa-arrows-rotate me-2"></i>Refresh
          </Link>
        </div>
      </div>

      {/* Health Summary */}
      <div className="erp-summary">
        <div className="erp-summary-lead">
          <span className="erp-summary-health is-up">
            <i className="fa-solid fa-heart-pulse"></i>Healthy
          </span>
          <p>
            Business is tracking ahead of plan &mdash; collections are at 82% of the
            monthly target with ৳ 21.7 Cr ageing beyond 90 days that needs attention.
          </p>
        </div>
        <div className="erp-summary-flags">
          <span className="erp-pill is-hold">
            <i className="fa-solid fa-clipboard-check me-1"></i>7 approvals pending
          </span>
          <span className="erp-pill is-overdue">
            <i className="fa-solid fa-file-invoice-dollar me-1"></i>37 invoices overdue
          </span>
          <span className="erp-pill is-booked">
            <i className="fa-solid fa-stamp me-1"></i>
            {parcelCount > 0 ? `${parcelCount} land files active` : "6 parcels in mutation"}
          </span>
          <span className="erp-pill is-hold">
            <i className="fa-solid fa-helmet-safety me-1"></i>1 project delayed
          </span>
          <span className="erp-pill is-available">
            <i className="fa-solid fa-vault me-1"></i>Cash runway 14 mo
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="row">
        <div className="col-xxl col-xl-4 col-md-6 col-12">
          <div className="erp-kpi is-primary">
            <div className="erp-kpi-top">
              <div>
                <p className="erp-kpi-label">Sales Value (YTD)</p>
                <p className="erp-kpi-value">
                  ৳ 412.6 <small>Cr</small>
                </p>
              </div>
              <div className="erp-kpi-icon is-primary">
                <i className="fa-solid fa-file-signature"></i>
              </div>
            </div>
            <div className="erp-kpi-foot">
              <span className="erp-delta is-up">
                <i className="fa-solid fa-arrow-trend-up"></i> 12.4%
              </span>
              <span>vs ৳ 367.1 Cr last year</span>
            </div>
          </div>
        </div>

        <div className="col-xxl col-xl-4 col-md-6 col-12">
          <div className="erp-kpi is-info">
            <div className="erp-kpi-top">
              <div>
                <p className="erp-kpi-label">Collections (MTD)</p>
                <p className="erp-kpi-value">
                  ৳ 38.9 <small>Cr</small>
                </p>
              </div>
              <div className="erp-kpi-icon is-info">
                <i className="fa-solid fa-hand-holding-dollar"></i>
              </div>
            </div>
            <div className="erp-kpi-foot">
              <span className="erp-delta is-up">
                <i className="fa-solid fa-arrow-trend-up"></i> 6.1%
              </span>
              <span>82% of monthly target</span>
            </div>
          </div>
        </div>

        <div className="col-xxl col-xl-4 col-md-6 col-12">
          <div className="erp-kpi is-danger">
            <div className="erp-kpi-top">
              <div>
                <p className="erp-kpi-label">Outstanding Receivables</p>
                <p className="erp-kpi-value">
                  ৳ 96.4 <small>Cr</small>
                </p>
              </div>
              <div className="erp-kpi-icon is-danger">
                <i className="fa-solid fa-file-invoice-dollar"></i>
              </div>
            </div>
            <div className="erp-kpi-foot">
              <span className="erp-delta is-down">
                <i className="fa-solid fa-arrow-trend-down"></i> 3.8%
              </span>
              <span>৳ 21.7 Cr overdue beyond 90 days</span>
            </div>
          </div>
        </div>

        <div className="col-xxl col-xl-4 col-md-6 col-12">
          <div className="erp-kpi is-purple">
            <div className="erp-kpi-top">
              <div>
                <p className="erp-kpi-label">Units Sold</p>
                <p className="erp-kpi-value">
                  1,286 <small>/ 1,940</small>
                </p>
              </div>
              <div className="erp-kpi-icon is-purple">
                <i className="fa-solid fa-building"></i>
              </div>
            </div>
            <div className="erp-kpi-foot">
              <span className="erp-delta is-up">
                <i className="fa-solid fa-arrow-trend-up"></i> 66.3%
              </span>
              <span>654 units still available</span>
            </div>
          </div>
        </div>

        <div className="col-xxl col-xl-4 col-md-6 col-12">
          <div className="erp-kpi is-warning">
            <div className="erp-kpi-top">
              <div>
                <p className="erp-kpi-label">Active Leads</p>
                <p className="erp-kpi-value">742</p>
              </div>
              <div className="erp-kpi-icon is-warning">
                <i className="fa-solid fa-users"></i>
              </div>
            </div>
            <div className="erp-kpi-foot">
              <span className="erp-delta is-flat">
                <i className="fa-solid fa-arrow-right-left"></i> 1.2%
              </span>
              <span>18.6% booking conversion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Snapshot */}
      <div className="erp-section-label">
        <h3>
          <i className="fa-solid fa-layer-group me-2"></i>Module Snapshot
        </h3>
        <span className="text-muted">Live counters across the ERP</span>
      </div>
      <div className="row">
        <div className="col-xl-3 col-md-6 col-12">
          <Link href="/crm/leads" className="text-decoration-none">
            <div className="erp-snap is-info">
              <div className="erp-snap-icon is-info">
                <i className="fa-solid fa-user-group"></i>
              </div>
              <div className="erp-snap-body">
                <p className="erp-snap-label">CRM Leads</p>
                <p className="erp-snap-value">742</p>
                <div className="erp-snap-foot">
                  <span className="erp-delta is-up">+38 today</span>
                  <span className="erp-snap-caption">68 site visits scheduled</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <Link href="/land/parcels" className="text-decoration-none">
            <div className="erp-snap is-primary">
              <div className="erp-snap-icon is-primary">
                <i className="fa-solid fa-map-location-dot"></i>
              </div>
              <div className="erp-snap-body">
                <p className="erp-snap-label">Land Bank</p>
                <p className="erp-snap-value">
                  {parcelCount > 0 ? parcelCount : 128}
                  <small>parcels</small>
                </p>
                <div className="erp-snap-foot">
                  <span className="erp-delta is-flat">
                    {parcelCount > 0 ? `${ownedParcelCount} owned` : "6 in mutation"}
                  </span>
                  <span className="erp-snap-caption">৳ 96 Cr acquired to date</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <Link href="/projects/projects" className="text-decoration-none">
            <div className="erp-snap is-purple">
              <div className="erp-snap-icon is-purple">
                <i className="fa-solid fa-city"></i>
              </div>
              <div className="erp-snap-body">
                <p className="erp-snap-label">Live Projects</p>
                <p className="erp-snap-value">{projects.length}</p>
                <div className="erp-snap-foot">
                  <span className="erp-delta is-up">4 on track</span>
                  <span className="erp-snap-caption">1 behind schedule</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <Link href="/inventory/units" className="text-decoration-none">
            <div className="erp-snap is-info">
              <div className="erp-snap-icon is-info">
                <i className="fa-solid fa-warehouse"></i>
              </div>
              <div className="erp-snap-body">
                <p className="erp-snap-label">Inventory Units</p>
                <p className="erp-snap-value">1,940</p>
                <div className="erp-snap-foot">
                  <span className="erp-delta is-flat">344 available</span>
                  <span className="erp-snap-caption">66% absorbed</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <Link href="/purchases" className="text-decoration-none">
            <div className="erp-snap is-warning">
              <div className="erp-snap-icon is-warning">
                <i className="fa-solid fa-truck-ramp-box"></i>
              </div>
              <div className="erp-snap-body">
                <p className="erp-snap-label">Procurement</p>
                <p className="erp-snap-value">
                  42<small>POs</small>
                </p>
                <div className="erp-snap-foot">
                  <span className="erp-delta is-flat">8 pending</span>
                  <span className="erp-snap-caption">৳ 4.8 Cr open commitments</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <Link href="/hr/employees" className="text-decoration-none">
            <div className="erp-snap is-primary">
              <div className="erp-snap-icon is-primary">
                <i className="fa-solid fa-helmet-safety"></i>
              </div>
              <div className="erp-snap-body">
                <p className="erp-snap-label">Workforce</p>
                <p className="erp-snap-value">486</p>
                <div className="erp-snap-foot">
                  <span className="erp-delta is-up">94% present</span>
                  <span className="erp-snap-caption">12 on leave today</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <Link href="/accounting/daily" className="text-decoration-none">
            <div className="erp-snap is-danger">
              <div className="erp-snap-icon is-danger">
                <i className="fa-solid fa-file-invoice"></i>
              </div>
              <div className="erp-snap-body">
                <p className="erp-snap-label">Open Invoices</p>
                <p className="erp-snap-value">213</p>
                <div className="erp-snap-foot">
                  <span className="erp-delta is-down">37 overdue</span>
                  <span className="erp-snap-caption">৳ 21.7 Cr receivable</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <Link href="/accounting/banks" className="text-decoration-none">
            <div className="erp-snap is-primary">
              <div className="erp-snap-icon is-primary">
                <i className="fa-solid fa-vault"></i>
              </div>
              <div className="erp-snap-body">
                <p className="erp-snap-label">Cash &amp; Bank</p>
                <p className="erp-snap-value">
                  ৳ 58.4<small>Cr</small>
                </p>
                <div className="erp-snap-foot">
                  <span className="erp-delta is-up">Healthy</span>
                  <span className="erp-snap-caption">across 6 accounts</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="erp-section-label">
        <h3>
          <i className="fa-solid fa-chart-column me-2"></i>Financial Summary
        </h3>
        <span className="text-muted">Sales, revenue, spend and receivables</span>
      </div>
      <div className="row g-3">
        <div className="col-xl-3 col-md-6 col-12">
          <div className="erp-card h-100">
            <div className="erp-card-head is-tight">
              <div>
                <h2>Sales vs Collection</h2>
                <p>Last 6 months, in crore (৳)</p>
              </div>
            </div>
            <div className="erp-card-body">
              <ul className="erp-legend is-tight">
                <li>
                  <i style={{ background: "#6c63ff" }}></i>Booked
                </li>
                <li>
                  <i style={{ background: "#00a87e" }}></i>Collected
                </li>
              </ul>
              <div className="erp-chart erp-chart-xs">
                <SalesCollectionChart />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <div className="erp-card h-100">
            <div className="erp-card-head is-tight">
              <div>
                <h2>Revenue by Project</h2>
                <p>Booked value share</p>
              </div>
            </div>
            <div className="erp-card-body">
              <div className="erp-chart erp-chart-xs">
                <SvgPieChart slices={revenueSlices} />
              </div>
              <ul className="erp-chart-values">
                {revenueSlices.map((s) => (
                  <li key={s.label}>
                    <span className="erp-chart-values-key">
                      <i style={{ background: s.color }}></i>
                      {s.label}
                    </span>
                    <strong>৳ {s.value} Cr</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <div className="erp-card h-100">
            <div className="erp-card-head is-tight">
              <div>
                <h2>Expense Breakdown</h2>
                <p>Spend by head, YTD</p>
              </div>
            </div>
            <div className="erp-card-body">
              <div className="erp-chart erp-chart-xs erp-donut-wrap">
                <SvgPieChart slices={expenseSlices} innerRadius={40} />
                <div className="erp-donut-center is-sm">
                  <strong>৳ 351</strong>
                  <span>Total Cr</span>
                </div>
              </div>
              <ul className="erp-chart-values">
                {expenseSlices.map((s) => (
                  <li key={s.label}>
                    <span className="erp-chart-values-key">
                      <i style={{ background: s.color }}></i>
                      {s.label}
                    </span>
                    <strong>৳ {s.value} Cr</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <div className="erp-card h-100">
            <div className="erp-card-head is-tight">
              <div>
                <h2>Receivables Ageing</h2>
                <p>Outstanding by bucket (৳ Cr)</p>
              </div>
            </div>
            <div className="erp-card-body">
              <div className="erp-chart erp-chart-xs">
                <AgeingBarChart />
              </div>
              <ul className="erp-chart-values">
                <li>
                  <span className="erp-chart-values-key">
                    <i style={{ background: "#f0a04b" }}></i>0–30 days
                  </span>
                  <strong>৳ 38.6 Cr</strong>
                </li>
                <li>
                  <span className="erp-chart-values-key">
                    <i style={{ background: "#e07b1e" }}></i>31–60 days
                  </span>
                  <strong>৳ 22.4 Cr</strong>
                </li>
                <li>
                  <span className="erp-chart-values-key">
                    <i style={{ background: "#c25f10" }}></i>61–90 days
                  </span>
                  <strong>৳ 13.7 Cr</strong>
                </li>
                <li>
                  <span className="erp-chart-values-key">
                    <i style={{ background: "#8f4208" }}></i>90+ days
                  </span>
                  <strong>৳ 21.7 Cr</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Summary */}
      <div className="erp-section-label">
        <h3>
          <i className="fa-solid fa-diagram-project me-2"></i>Operational Summary
        </h3>
        <span className="text-muted">Inventory, pipeline, delivery and procurement</span>
      </div>
      <div className="row g-3">
        <div className="col-xl-3 col-md-6 col-12">
          <div className="erp-card h-100">
            <div className="erp-card-head is-tight">
              <div>
                <h2>Inventory Status</h2>
                <p>1,940 units across all projects</p>
              </div>
            </div>
            <div className="erp-card-body">
              <div className="erp-chart erp-chart-xs erp-donut-wrap">
                <SvgPieChart slices={inventorySlices} innerRadius={40} />
                <div className="erp-donut-center is-sm">
                  <strong>1,940</strong>
                  <span>Total Units</span>
                </div>
              </div>
              <ul className="erp-chart-values">
                <li>
                  <span className="erp-chart-values-key">
                    <i style={{ background: "#6c63ff" }}></i>Sold
                  </span>
                  <strong>1,286 &middot; 66.3%</strong>
                </li>
                <li>
                  <span className="erp-chart-values-key">
                    <i style={{ background: "#00a87e" }}></i>Booked
                  </span>
                  <strong>214 &middot; 11%</strong>
                </li>
                <li>
                  <span className="erp-chart-values-key">
                    <i style={{ background: "#d9730d" }}></i>On Hold
                  </span>
                  <strong>96 &middot; 4.9%</strong>
                </li>
                <li>
                  <span className="erp-chart-values-key">
                    <i style={{ background: "#d81b60" }}></i>Available
                  </span>
                  <strong>344 &middot; 17.7%</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <div className="erp-card h-100">
            <div className="erp-card-head is-tight">
              <div>
                <h2>Lead Pipeline</h2>
                <p>Enquiry to booking, this quarter</p>
              </div>
            </div>
            <div className="erp-card-body">
              <HorizontalBarsChart
                max={742}
                color="#6c63ff"
                rows={[
                  { label: "New Enquiries", value: 742, display: "742" },
                  { label: "Qualified", value: 486, display: "486" },
                  { label: "Site Visit", value: 291, display: "291" },
                  { label: "Negotiation", value: 164, display: "164" },
                  { label: "Booked", value: 138, display: "138" },
                ]}
              />
            </div>
            <div className="erp-card-foot">
              <span className="text-muted" style={{ fontSize: "12.5px" }}>
                Conversion
              </span>
              <span className="erp-delta is-up ms-2">
                <i className="fa-solid fa-arrow-trend-up"></i> 18.6%
              </span>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <div className="erp-card h-100">
            <div className="erp-card-head is-tight">
              <div>
                <h2>Project Completion</h2>
                <p>Construction progress, behind first</p>
              </div>
            </div>
            <div className="erp-card-body">
              <HorizontalBarsChart
                max={100}
                color="#00a87e"
                rows={[
                  { label: "Skyline Commercial", value: 31, display: "31%" },
                  { label: "Riverfront Residency", value: 54, display: "54%" },
                  { label: "Bay View Terrace", value: 66, display: "66%" },
                  { label: "Harmony Heights", value: 78, display: "78%" },
                  { label: "Green Meadow Plots", value: 92, display: "92%" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 col-12">
          <div className="erp-card h-100">
            <div className="erp-card-head is-tight">
              <div>
                <h2>Procurement Status</h2>
                <p>42 open purchase orders</p>
              </div>
            </div>
            <div className="erp-card-body">
              <div className="erp-chart erp-chart-xs">
                <SvgPieChart slices={procurementSlices} />
              </div>
              <ul className="erp-chart-values">
                {procurementSlices.map((s) => (
                  <li key={s.label}>
                    <span className="erp-chart-values-key">
                      <i style={{ background: s.color }}></i>
                      {s.label}
                    </span>
                    <strong>{s.value} POs</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Project Progress + Recent Bookings */}
      <div className="row">
        <div className="col-xxl-4 col-lg-5 col-12">
          <div className="erp-card">
            <div className="erp-card-head">
              <div>
                <h2>Project Progress</h2>
                <p>Construction status &amp; sales absorption</p>
              </div>
              <Link href="/projects/projects" className="btn btn-erp-ghost btn-sm">
                All Projects
              </Link>
            </div>
            <div className="erp-card-body is-flush">
              <ul className="erp-list">
                {activeProjectsList.map((p) => (
                  <li key={p.id}>
                    <div className="erp-progress-head">
                      <strong>{p.name}</strong>
                      <span>{p.completionPct}%</span>
                    </div>
                    <div className="progress" role="progressbar" aria-valuenow={p.completionPct} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${p.completionPct}%`,
                          background:
                            p.status === "Delayed"
                              ? "var(--erp-warning)"
                              : p.completionPct >= 80
                              ? "var(--erp-purple)"
                              : "var(--erp-primary)",
                        }}
                      />
                    </div>
                    <div className="erp-meta-row">
                      <span>
                        <i className="fa-solid fa-location-dot"></i>
                        {p.location}
                      </span>
                      <span>
                        <i className="fa-solid fa-helmet-safety"></i>
                        {p.phase}
                      </span>
                      <span>
                        <i className="fa-solid fa-building"></i>
                        {p.soldUnits}/{p.totalUnits} sold
                      </span>
                      <span>
                        <i className="fa-solid fa-key"></i>
                        {p.handoverDate}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-xxl-8 col-lg-7 col-12">
          <div className="erp-card">
            <div className="erp-card-head">
              <div>
                <h2>Recent Bookings</h2>
                <p>Latest sales entries awaiting agreement or registration</p>
              </div>
              <Link href="/sales" className="btn btn-erp-ghost btn-sm">
                Open Sales Register
              </Link>
            </div>
            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Client</th>
                      <th>Project / Unit</th>
                      <th className="text-end">Value</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ref: "BKG-2026-1184", init: "RI", name: "Rafiqul Islam", phone: "+880 1711-204488", proj: "Harmony Heights", unit: "B-1204 · 2,150 sft", val: "৳ 2,68,75,000", date: "26 Jul 2026", status: "Booked", cls: "is-booked" },
                      { ref: "BKG-2026-1183", init: "SR", name: "Sadia Rahman", phone: "+880 1819-663120", proj: "Green Meadow Plots", unit: "Plot G-42 · 5 katha", val: "৳ 4,10,00,000", date: "25 Jul 2026", status: "Sold", cls: "is-sold" },
                      { ref: "BKG-2026-1182", init: "TA", name: "Tanvir Ahmed", phone: "+880 1521-778901", proj: "Riverfront Residency", unit: "A-0705 · 1,780 sft", val: "৳ 1,96,00,000", date: "25 Jul 2026", status: "On hold", cls: "is-hold" },
                      { ref: "BKG-2026-1181", init: "NC", name: "Nabila Chowdhury", phone: "+880 1913-556677", proj: "Bay View Terrace", unit: "C-0902 · 2,400 sft", val: "৳ 3,12,00,000", date: "24 Jul 2026", status: "Sold", cls: "is-sold" },
                      { ref: "BKG-2026-1180", init: "IH", name: "Imran Hossain", phone: "+880 1745-330099", proj: "Skyline Commercial Tower", unit: "Retail R-08 · 980 sft", val: "৳ 2,45,00,000", date: "23 Jul 2026", status: "Booked", cls: "is-booked" },
                      { ref: "BKG-2026-1179", init: "FA", name: "Farhana Akter", phone: "+880 1677-442211", proj: "Harmony Heights", unit: "D-0311 · 1,620 sft", val: "৳ 1,78,20,000", date: "22 Jul 2026", status: "Sold", cls: "is-sold" },
                    ].map((b) => (
                      <tr key={b.ref}>
                        <td className="erp-cell-strong">{b.ref}</td>
                        <td>
                          <div className="erp-identity">
                            <span className="erp-initials">{b.init}</span>
                            <span>
                              <span className="erp-identity-name">{b.name}</span>
                              <span className="erp-identity-meta">{b.phone}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="erp-cell-strong d-block">{b.proj}</span>
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {b.unit}
                          </span>
                        </td>
                        <td className="text-end erp-cell-strong">{b.val}</td>
                        <td className="text-nowrap">{b.date}</td>
                        <td>
                          <span className={`erp-pill ${b.cls}`}>{b.status}</span>
                        </td>
                        <td className="text-end">
                          <Link
                            href="/sales"
                            className="btn btn-erp-ghost btn-sm"
                            aria-label="Open booking"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="erp-card-foot d-flex justify-content-between align-items-center">
              <span className="text-muted" style={{ fontSize: "12.5px" }}>
                Showing 6 of 1,286 bookings
              </span>
              <Link
                href="/sales"
                style={{ fontSize: "12.5px", color: "var(--erp-primary)", textDecoration: "none" }}
              >
                View all &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Demands + Recent Activity */}
      <div className="row">
        <div className="col-xxl-6 col-lg-6 col-12">
          <div className="erp-card">
            <div className="erp-card-head">
              <div>
                <h2>Upcoming Demands</h2>
                <p>Instalments due in the next 30 days</p>
              </div>
            </div>
            <div className="erp-card-body is-flush">
              <ul className="erp-list">
                {[
                  { title: "Instalment 5 — Roof casting", proj: "Harmony Heights", amt: "৳ 6.40 Cr", pill: "Due in 3 days", cls: "is-hold", units: "42 units" },
                  { title: "Instalment 3 — Brickwork", proj: "Riverfront Residency", amt: "৳ 4.15 Cr", pill: "Due in 9 days", cls: "is-booked", units: "31 units" },
                  { title: "Registration & handover fees", proj: "Green Meadow Plots", amt: "৳ 2.86 Cr", pill: "Due in 14 days", cls: "is-booked", units: "57 plots" },
                  { title: "Instalment 2 — Piling complete", proj: "Skyline Commercial Tower", amt: "৳ 8.90 Cr", pill: "Due in 21 days", cls: "is-booked", units: "24 units" },
                ].map((d) => (
                  <li key={d.title}>
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div className="min-w-0">
                        <strong className="d-block" style={{ fontSize: "13.5px", color: "var(--erp-ink)" }}>
                          {d.title}
                        </strong>
                        <span className="text-muted" style={{ fontSize: "12.5px" }}>
                          {d.proj}
                        </span>
                      </div>
                      <span className="erp-cell-strong text-nowrap">{d.amt}</span>
                    </div>
                    <div className="erp-meta-row">
                      <span className={`erp-pill ${d.cls}`}>{d.pill}</span>
                      <span>
                        <i className="fa-solid fa-building"></i>
                        {d.units}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="erp-card-foot">
              <Link
                href="/payments"
                style={{ fontSize: "12.5px", color: "var(--erp-primary)", textDecoration: "none" }}
              >
                Generate demand letters &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="col-xxl-6 col-lg-6 col-12">
          <div className="erp-card">
            <div className="erp-card-head">
              <div>
                <h2>Recent Activity</h2>
                <p>Cross-module audit feed</p>
              </div>
            </div>
            <div className="erp-card-body is-flush pt-3">
              <ul className="erp-timeline">
                <li className="is-primary">
                  <h6>Receipt RCT-8841 posted</h6>
                  <p>৳ 25,00,000 from Nabila Chowdhury against C-0902.</p>
                  <time>Today, 10:42</time>
                </li>
                <li className="is-info">
                  <h6>Unit B-1204 moved to Booked</h6>
                  <p>Blocked by Nusrat Jahan pending 7% discount approval.</p>
                  <time>Today, 09:15</time>
                </li>
                <li className="is-warning">
                  <h6>PO-2291 raised for rebar</h6>
                  <p>Meghna Steel &middot; ৳ 38,50,000 &middot; awaiting director sign-off.</p>
                  <time>Yesterday, 17:30</time>
                </li>
                <li className="is-danger">
                  <h6>Booking A-0705 cancellation filed</h6>
                  <p>Refund of ৳ 12,00,000 routed to finance for review.</p>
                  <time>Yesterday, 14:06</time>
                </li>
                <li className="is-primary">
                  <h6>Milestone completed</h6>
                  <p>Harmony Heights &mdash; 12th floor casting signed off by site engineer.</p>
                  <time>24 Jul, 11:20</time>
                </li>
              </ul>
            </div>
            <div className="erp-card-foot">
              <Link
                href="/settings/audit"
                style={{ fontSize: "12.5px", color: "var(--erp-primary)", textDecoration: "none" }}
              >
                Open audit trail &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Receivables + Top Sales Performers */}
      <div className="row">
        <div className="col-xxl-7 col-lg-7 col-12">
          <div className="erp-card">
            <div className="erp-card-head">
              <div>
                <h2>Overdue Receivables</h2>
                <p>Highest ageing first &mdash; follow-up required</p>
              </div>
              <span className="erp-pill is-overdue">৳ 21.7 Cr beyond 90 days</span>
            </div>
            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Project</th>
                      <th>Unit</th>
                      <th className="text-end">Outstanding</th>
                      <th className="text-end">Ageing</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Mahbub Alam", proj: "Riverfront Residency", unit: "A-1102", amt: "৳ 48,60,000", days: "148 days", cls: "is-overdue" },
                      { name: "Shirin Sultana", proj: "Harmony Heights", unit: "C-0806", amt: "৳ 32,40,000", days: "121 days", cls: "is-overdue" },
                      { name: "Kamrul Hasan", proj: "Bay View Terrace", unit: "B-0409", amt: "৳ 27,15,000", days: "96 days", cls: "is-overdue" },
                      { name: "Rezaul Karim", proj: "Green Meadow Plots", unit: "Plot G-19", amt: "৳ 19,80,000", days: "74 days", cls: "is-hold" },
                      { name: "Anika Tabassum", proj: "Harmony Heights", unit: "A-0512", amt: "৳ 14,25,000", days: "52 days", cls: "is-hold" },
                    ].map((r) => (
                      <tr key={r.name}>
                        <td className="erp-cell-strong">{r.name}</td>
                        <td>{r.proj}</td>
                        <td>{r.unit}</td>
                        <td className="text-end erp-cell-strong">{r.amt}</td>
                        <td className="text-end">
                          <span className={`erp-pill ${r.cls}`}>{r.days}</span>
                        </td>
                        <td className="text-end">
                          <Link href="/reports/dues" className="btn btn-erp-ghost btn-sm">
                            <i className="fa-solid fa-bell me-1"></i>Remind
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-5 col-lg-5 col-12">
          <div className="erp-card">
            <div className="erp-card-head">
              <div>
                <h2>Top Sales Performers</h2>
                <p>Quarter to date, against quota</p>
              </div>
            </div>
            <div className="erp-card-body is-flush">
              <ul className="erp-list">
                {[
                  { init: "NJ", name: "Nusrat Jahan", amt: "৳ 41.2 Cr", pct: 100, role: "Senior Consultant", deals: "24 deals", quota: "118% of quota", color: "var(--erp-primary)" },
                  { init: "AM", name: "Arif Mahmud", amt: "৳ 36.8 Cr", pct: 100, role: "Sales Manager", deals: "21 deals", quota: "104% of quota", color: "var(--erp-primary)" },
                  { init: "SR", name: "Sabbir Rahman", amt: "৳ 28.4 Cr", pct: 89, role: "Consultant", deals: "17 deals", quota: "89% of quota", color: "var(--erp-info)" },
                  { init: "TF", name: "Tasnim Ferdous", amt: "৳ 24.1 Cr", pct: 76, role: "Consultant", deals: "15 deals", quota: "76% of quota", color: "var(--erp-info)" },
                  { init: "HM", name: "Hasan Mirza", amt: "৳ 19.6 Cr", pct: 61, role: "Channel Partner", deals: "12 deals", quota: "61% of quota", color: "var(--erp-info)" },
                ].map((s) => (
                  <li key={s.name}>
                    <div className="d-flex align-items-center gap-3">
                      <span className="erp-avatar">{s.init}</span>
                      <div className="flex-grow-1 min-w-0">
                        <div className="erp-progress-head mb-1">
                          <strong>{s.name}</strong>
                          <span className="erp-cell-strong">{s.amt}</span>
                        </div>
                        <div className="progress" role="progressbar" aria-valuenow={s.pct} aria-valuemin={0} aria-valuemax={100}>
                          <div className="progress-bar" style={{ width: `${s.pct}%`, background: s.color }} />
                        </div>
                        <div className="erp-meta-row">
                          <span>{s.role}</span>
                          <span>
                            <i className="fa-solid fa-file-signature"></i>
                            {s.deals}
                          </span>
                          <span>
                            <i className="fa-solid fa-bullseye"></i>
                            {s.quota}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
