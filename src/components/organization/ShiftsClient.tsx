"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface ShiftRow {
  id: number;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  graceInMinutes: number;
  graceOutMinutes: number;
  workingDays: string;
  appliesTo: string;
  isDefault: boolean;
  isActive: boolean;
}

const DAY_LABEL: Record<string, string> = {
  "1": "Mon",
  "2": "Tue",
  "3": "Wed",
  "4": "Thu",
  "5": "Fri",
  "6": "Sat",
  "7": "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export default function ShiftsClient({
  shifts,
  branches,
  departments,
  filters,
}: {
  shifts: ShiftRow[];
  branches: { id: number; name: string }[];
  departments: { id: number; name: string }[];
  filters: { search: string; branch_id: string; department_id: string; status: string };
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<ShiftRow | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function patchShift(id: number, body: Record<string, unknown>) {
    setBusyId(id);
    try {
      await fetch(`/api/organization/shifts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      await fetch(`/api/organization/shifts/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const hasFilter =
    filters.search || filters.branch_id || filters.department_id || filters.status;

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div>
            <h1>Shifts</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Shifts
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/organization/shifts/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Shift
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/organization/shifts"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search shift name or code…"
                aria-label="Search shifts"
              />
            </div>

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
              <Link href="/organization/shifts" className="btn btn-erp-ghost">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {shifts.length} {shifts.length === 1 ? "shift" : "shifts"}
          </span>
        </div>

        {shifts.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-clock"></i>
            </div>
            <h3>No shifts yet</h3>
            <p>
              Define the working hours, grace periods, and weekly off days for your roster.
            </p>
            <Link href="/organization/shifts/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Shift
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Shift</th>
                    <th>Code</th>
                    <th>Timing</th>
                    <th>Grace</th>
                    <th>Working Days</th>
                    <th>Scope</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s) => {
                    const days = s.workingDays
                      .split(",")
                      .map((d) => DAY_LABEL[d.trim().toLowerCase()] ?? d.trim())
                      .filter(Boolean);
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="erp-cell-strong">{s.name}</span>
                            {s.isDefault && (
                              <span className="erp-pill is-sold">Default</span>
                            )}
                          </div>
                        </td>
                        <td className="erp-cell-strong">{s.code}</td>
                        <td>
                          <div>
                            {s.startTime} – {s.endTime}
                          </div>
                          <span className="erp-identity-meta">
                            Break: {s.breakMinutes} min
                          </span>
                        </td>
                        <td>
                          <span className="erp-identity-meta">
                            In +{s.graceInMinutes}m · Out -{s.graceOutMinutes}m
                          </span>
                        </td>
                        <td>{days.join(", ")}</td>
                        <td>
                          <span className="erp-scope-tag">
                            <i className="fa-solid fa-building-columns"></i>
                            {s.appliesTo === "all" || s.appliesTo === "company"
                              ? "Whole company"
                              : s.appliesTo}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`erp-pill ${
                              s.isActive ? "is-available" : "is-neutral"
                            }`}
                          >
                            {s.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <div className="d-inline-flex gap-1">
                            {!s.isDefault && (
                              <button
                                type="button"
                                className="btn btn-erp-ghost btn-sm"
                                disabled={busyId === s.id}
                                onClick={() => patchShift(s.id, { is_default: true })}
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm"
                              disabled={busyId === s.id}
                              onClick={() => patchShift(s.id, { is_active: !s.isActive })}
                            >
                              {s.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-danger"
                              onClick={() => setDeleteTarget(s)}
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
                        Delete shift?
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
