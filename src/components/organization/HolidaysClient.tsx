"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HOLIDAY_TYPES } from "@/lib/tier0";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpPageHeader,
  ErpPill,
  ErpTableCard,
} from "@/components/ui";

export interface HolidayRow {
  id: number;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  color: string;
  description: string | null;
  appliesTo: string;
  isRecurring: boolean;
  isPaid: boolean;
  isActive: boolean;
}

const SWATCH_HEX: Record<string, string> = {
  emerald: "#00c292",
  sky: "#03a9f3",
  amber: "#ff9800",
  rose: "#e91e63",
  violet: "#7e57c2",
  slate: "#607d8b",
};

function calcDays(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end || start);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

export default function HolidaysClient({
  holidays,
  branches,
  departments,
  filters,
}: {
  holidays: HolidayRow[];
  branches: { id: number; name: string }[];
  departments: { id: number; name: string }[];
  filters: {
    search: string;
    year: string;
    type: string;
    branch_id: string;
    department_id: string;
    status: string;
  };
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<HolidayRow | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function toggleActive(row: HolidayRow) {
    setBusyId(row.id);
    try {
      await fetch(`/api/organization/holidays/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !row.isActive }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await fetch(`/api/organization/holidays/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const hasFilter =
    filters.search ||
    filters.year ||
    filters.type ||
    filters.branch_id ||
    filters.department_id ||
    filters.status;

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-calendar-day"
        title="Holidays"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Organization" },
          { label: "Holidays" },
        ]}
        actions={
          <>
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() => setCalendarOpen((v) => !v)}
            >
              <i className="fa-solid fa-calendar-days me-2"></i>
              {calendarOpen ? "List View" : "Calendar View"}
            </button>
            <Link href="/organization/holidays/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Holiday
            </Link>
          </>
        }
      />

      <ErpTableCard
        toolbar={
          <form
            method="GET"
            action="/organization/holidays"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search holiday name or notes…"
                aria-label="Search holidays"
              />
            </div>

            <select
              name="year"
              className="form-select erp-select"
              aria-label="Year filter"
              defaultValue={filters.year}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">All years</option>
              {[2023, 2024, 2025, 2026, 2027, 2028, 2029].map((yr) => (
                <option key={yr} value={String(yr)}>
                  {yr}
                </option>
              ))}
            </select>

            <select
              name="type"
              className="form-select erp-select"
              aria-label="Type filter"
              defaultValue={filters.type}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">All types</option>
              {HOLIDAY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              name="branch_id"
              className="form-select erp-select"
              aria-label="Branch filter"
              defaultValue={filters.branch_id}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              name="department_id"
              className="form-select erp-select"
              aria-label="Department filter"
              defaultValue={filters.department_id}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              className="form-select erp-select"
              aria-label="Status filter"
              defaultValue={filters.status}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>

            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>

            {hasFilter && (
              <Link href="/organization/holidays" className="btn btn-erp-ghost">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>
        }
        countText={`${holidays.length} ${holidays.length === 1 ? "holiday" : "holidays"}`}
        isEmpty={holidays.length === 0}
        emptyState={
          <ErpEmptyState
            icon="fa-solid fa-calendar-day"
            title="No holidays yet"
            description="Record public, national, or company holidays so attendance and payroll treat them properly."
            action={
              <Link href="/organization/holidays/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Holiday
              </Link>
            }
          />
        }
      >
        {calendarOpen ? (
          <div className="p-3">
            <div className="row g-3">
              {holidays.map((h) => {
                const dotColor = SWATCH_HEX[h.color] ?? h.color ?? "#00c292";
                const days = calcDays(h.startDate, h.endDate);
                return (
                  <div key={h.id} className="col-md-4 col-sm-6">
                    <div
                      className="p-3 h-100"
                      style={{
                        border: "1px solid var(--erp-line)",
                        borderLeft: `4px solid ${dotColor}`,
                        borderRadius: 10,
                        background: "#fff",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <strong style={{ fontSize: 13.5 }}>{h.name}</strong>
                        <ErpPill tone={h.isActive ? "available" : "neutral"}>
                          {days} {days === 1 ? "day" : "days"}
                        </ErpPill>
                      </div>
                      <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                        <i className="fa-regular fa-calendar me-1"></i>
                        {h.startDate}
                        {h.endDate && h.endDate !== h.startDate ? ` → ${h.endDate}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <table className="table erp-table">
          <thead>
            <tr>
              <th>Holiday</th>
              <th>Type</th>
              <th>Dates</th>
              <th>Scope</th>
              <th>Treatment</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((h) => {
              const dotColor = SWATCH_HEX[h.color] ?? h.color ?? "#00c292";
              const days = calcDays(h.startDate, h.endDate);
              return (
                <tr key={h.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: dotColor,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <span className="erp-cell-strong">{h.name}</span>
                        {h.description && (
                          <span className="erp-identity-meta d-block">{h.description}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <ErpPill tone="neutral">
                      {HOLIDAY_TYPES.find((t) => t.value === h.type)?.label ?? h.type}
                    </ErpPill>
                  </td>
                  <td>
                    <div>
                      {h.startDate}
                      {h.endDate && h.endDate !== h.startDate ? ` → ${h.endDate}` : ""}
                    </div>
                    <span className="erp-identity-meta">
                      {days} {days === 1 ? "day" : "days"}
                    </span>
                  </td>
                  <td>
                    <span className="erp-scope-tag">
                      <i className="fa-solid fa-building-columns"></i>
                      {h.appliesTo === "all" || h.appliesTo === "company"
                        ? "Whole company"
                        : h.appliesTo}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      {h.isPaid && <ErpPill tone="available">Paid</ErpPill>}
                      {h.isRecurring && <ErpPill tone="booked">Yearly</ErpPill>}
                    </div>
                  </td>
                  <td>
                    <ErpPill tone={h.isActive ? "available" : "neutral"}>
                      {h.isActive ? "Active" : "Inactive"}
                    </ErpPill>
                  </td>
                  <td className="text-end text-nowrap">
                    <div className="d-inline-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        disabled={busyId === h.id}
                        onClick={() => toggleActive(h)}
                      >
                        {h.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm text-danger"
                        onClick={() => setDeleteTarget(h)}
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </ErpTableCard>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete holiday?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> will be removed from active use.
            </>
          )
        }
        busy={busyId === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
