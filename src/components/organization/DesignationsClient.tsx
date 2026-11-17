"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DESIGNATION_GRADES, EMPLOYMENT_TYPES, getInitials } from "@/lib/tier0";
import { getLabel } from "@/lib/land";

export interface DesigRow {
  id: number;
  code: string;
  name: string;
  departmentName: string | null;
  employmentType: string;
  grade: string | null;
  description: string | null;
  isManagerial: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
}

export default function DesignationsClient({
  designations,
  departments,
  companyName,
  filters,
}: {
  designations: DesigRow[];
  departments: { id: number; name: string }[];
  companyName: string;
  filters: { search: string; department_id: string; status: string };
}) {
  const router = useRouter();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("ENG | Site Engineer\nACC | Accounts Executive");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DesigRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitBulk(e: FormEvent) {
    e.preventDefault();
    const lines = bulkText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const items = lines
      .map((line) => {
        const [code, ...rest] = line.split(/[|,]/);
        return { code: (code || "").trim(), name: rest.join(" ").trim() };
      })
      .filter((x) => x.code && x.name);

    if (items.length === 0) return;
    setBulkSaving(true);
    try {
      await fetch("/api/organization/designations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      setBulkOpen(false);
      router.refresh();
    } finally {
      setBulkSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await fetch(`/api/organization/designations/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-user-tie"></i>
          </div>
          <div>
            <h1>Designation</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Designation
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() => setBulkOpen(true)}
          >
            <i className="fa-solid fa-layer-group me-2"></i>Bulk Add
          </button>
          <Link href="/organization/designations/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Designation
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/organization/designations"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search title, code…"
                aria-label="Search designations"
              />
            </div>

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

            {(filters.search || filters.department_id || filters.status) && (
              <Link href="/organization/designations" className="btn btn-erp-ghost">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {designations.length} {designations.length === 1 ? "designation" : "designations"}
          </span>
        </div>

        {designations.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-user-tie"></i>
            </div>
            <h3>No designations found</h3>
            <p>Add job titles, seniority grades, and employment types.</p>
            <Link href="/organization/designations/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Designation
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Designation</th>
                    <th>Code</th>
                    <th>Company</th>
                    <th>Department</th>
                    <th>Grade</th>
                    <th>Employment</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {designations.map((ds) => (
                    <tr key={ds.id}>
                      <td>
                        <div className="erp-identity">
                          <span className="erp-initials">{getInitials(ds.name)}</span>
                          <span>
                            <span className="erp-identity-name">
                              {ds.name}
                              {ds.isManagerial && (
                                <span className="erp-pill is-sold ms-1">Managerial</span>
                              )}
                            </span>
                            <span className="erp-identity-meta">
                              {ds.description || "No description"}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="erp-cell-strong">{ds.code}</td>
                      <td>{companyName}</td>
                      <td>{ds.departmentName || "Company-wide"}</td>
                      <td>
                        {ds.grade ? (
                          <span className="erp-pill is-booked">
                            {getLabel(DESIGNATION_GRADES, ds.grade)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{getLabel(EMPLOYMENT_TYPES, ds.employmentType)}</td>
                      <td>
                        <span
                          className={`erp-pill ${
                            ds.isActive ? "is-available" : "is-neutral"
                          }`}
                        >
                          {ds.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <span className="erp-created-by">
                          <span className="erp-cell-strong">{ds.createdBy || "—"}</span>
                          <span className="erp-identity-meta d-block">
                            {ds.createdAt}
                          </span>
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(ds)}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Add Modal */}
      {bulkOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <form onSubmit={submitBulk}>
                  <div className="modal-header">
                    <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>
                      <i className="fa-solid fa-layer-group me-2 text-muted"></i>
                      Bulk Add Designations
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setBulkOpen(false)}
                    />
                  </div>
                  <div className="modal-body">
                    <p className="text-muted small mb-2">
                      Enter one designation per line as <code>CODE | Title</code>.
                    </p>
                    <textarea
                      className="form-control"
                      rows={6}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      onClick={() => setBulkOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-erp" disabled={bulkSaving}>
                      {bulkSaving ? "Saving…" : "Create All"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Modal */}
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
                        Delete designation?
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                        <strong>{deleteTarget.name}</strong> will be removed from active
                        use.
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
                    disabled={busy}
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
