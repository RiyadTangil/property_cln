"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FISCAL_STATUSES } from "@/lib/tier0";

export interface FiscalYearRow {
  id: number;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  periodCadence: string;
  hasAdjustmentPeriod: boolean;
  isCurrent: boolean;
  status: string;
  notes: string | null;
}

const STATUS_PILL: Record<string, string> = {
  draft: "is-booked",
  open: "is-available",
  closed: "is-neutral",
  locked: "is-overdue",
};

export default function FiscalYearsClient({
  fiscalYears,
  filters,
}: {
  fiscalYears: FiscalYearRow[];
  filters: { search: string; status: string };
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<FiscalYearRow | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function updateYear(id: number, patch: Record<string, unknown>) {
    setBusyId(id);
    try {
      await fetch(`/api/organization/fiscal-years/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
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
      await fetch(`/api/organization/fiscal-years/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-calendar-days"></i>
          </div>
          <div>
            <h1>Fiscal Years</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Fiscal Years
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/organization/fiscal-years/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Fiscal Year
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/organization/fiscal-years"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search name or code…"
                aria-label="Search fiscal years"
              />
            </div>
            <select
              name="status"
              className="form-select erp-select"
              aria-label="Status filter"
              defaultValue={filters.status}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">All statuses</option>
              {FISCAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
            {(filters.search || filters.status) && (
              <Link href="/organization/fiscal-years" className="btn btn-erp-ghost">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {fiscalYears.length} {fiscalYears.length === 1 ? "year" : "years"}
          </span>
        </div>

        {fiscalYears.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-calendar-days"></i>
            </div>
            <h3>No fiscal years match your filters</h3>
            <p>Try a different search term or clear the filters.</p>
            {filters.search || filters.status ? (
              <Link href="/organization/fiscal-years" className="btn btn-erp-ghost">
                Clear filters
              </Link>
            ) : (
              <Link href="/organization/fiscal-years/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Fiscal Year
              </Link>
            )}
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Fiscal Year</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Periods</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fiscalYears.map((fy) => (
                    <tr key={fy.id}>
                      <td className="erp-cell-strong">{fy.code}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="erp-cell-strong">{fy.name}</span>
                          {fy.isCurrent && (
                            <span className="erp-pill is-sold">Current</span>
                          )}
                        </div>
                        {fy.notes && (
                          <span className="erp-identity-meta d-block">{fy.notes}</span>
                        )}
                      </td>
                      <td className="text-nowrap">{fy.startDate}</td>
                      <td className="text-nowrap">{fy.endDate}</td>
                      <td>
                        <span className="text-capitalize">{fy.periodCadence}</span>
                        {fy.hasAdjustmentPeriod && (
                          <span className="erp-identity-meta d-block">
                            + Adjustment period
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`erp-pill ${
                            STATUS_PILL[fy.status] ?? "is-neutral"
                          }`}
                        >
                          {FISCAL_STATUSES.find((s) => s.value === fy.status)?.label ??
                            fy.status}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <div className="d-inline-flex gap-1">
                          {!fy.isCurrent && (
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm"
                              disabled={busyId === fy.id}
                              onClick={() => updateYear(fy.id, { isCurrent: true })}
                            >
                              Set Current
                            </button>
                          )}
                          {fy.status !== "closed" ? (
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm"
                              disabled={busyId === fy.id}
                              onClick={() => updateYear(fy.id, { status: "closed" })}
                            >
                              Close
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm"
                              disabled={busyId === fy.id}
                              onClick={() => updateYear(fy.id, { status: "open" })}
                            >
                              Reopen
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            onClick={() => setDeleteTarget(fy)}
                            title="Delete"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <div className="modal-body p-4">
                  <div className="d-flex gap-3">
                    <div className="erp-kpi-icon is-danger">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div>
                      <h5 className="mb-2" style={{ fontSize: 16, fontWeight: 600 }}>
                        Delete fiscal year?
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                        <strong>{deleteTarget.name}</strong> ({deleteTarget.code}) will be
                        removed from active use.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    onClick={() => setDeleteTarget(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-erp"
                    style={{
                      background: "var(--erp-danger)",
                      borderColor: "var(--erp-danger)",
                    }}
                    disabled={busyId === deleteTarget.id}
                    onClick={confirmDelete}
                  >
                    <i className="fa-solid fa-trash-can me-2"></i>Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
