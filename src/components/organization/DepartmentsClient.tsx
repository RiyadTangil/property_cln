"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/tier0";

export interface DeptRow {
  id: number;
  code: string;
  name: string;
  branchName: string | null;
  parentName: string | null;
  headName: string | null;
  subCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function DepartmentsClient({
  departments,
  branches,
  companyName,
  filters,
}: {
  departments: DeptRow[];
  branches: { id: number; name: string }[];
  companyName: string;
  filters: { search: string; branch_id: string; status: string };
}) {
  const router = useRouter();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("FIN | Finance & Accounts\nHR | Human Resources");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeptRow | null>(null);
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
      await fetch("/api/organization/departments", {
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
      await fetch(`/api/organization/departments/${deleteTarget.id}`, {
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
            <i className="fa-solid fa-diagram-project"></i>
          </div>
          <div>
            <h1>Department</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Department
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
            <i className="fa-solid fa-layer-group me-2"></i>Add Several
          </button>
          <Link href="/organization/departments/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Department
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/organization/departments"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search name, code, head…"
                aria-label="Search departments"
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

            {(filters.search || filters.branch_id || filters.status) && (
              <Link href="/organization/departments" className="btn btn-erp-ghost">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {departments.length} {departments.length === 1 ? "department" : "departments"}
          </span>
        </div>

        {departments.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-diagram-project"></i>
            </div>
            <h3>No departments found</h3>
            <p>Organize teams into departments and sub-departments.</p>
            <Link href="/organization/departments/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Department
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Code</th>
                    <th>Company</th>
                    <th>Branch</th>
                    <th>Parent</th>
                    <th className="text-end">Sub</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div className="erp-identity">
                          <span className="erp-initials">{getInitials(d.name)}</span>
                          <span>
                            <span className="erp-identity-name">{d.name}</span>
                            <span className="erp-identity-meta">
                              {d.headName || "No head assigned"}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="erp-cell-strong">{d.code}</td>
                      <td>{companyName}</td>
                      <td>{d.branchName || "—"}</td>
                      <td>{d.parentName || "—"}</td>
                      <td className="text-end erp-cell-strong">{d.subCount}</td>
                      <td>
                        <span
                          className={`erp-pill ${
                            d.isActive ? "is-available" : "is-neutral"
                          }`}
                        >
                          {d.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <span className="erp-created-by">
                          <span className="erp-cell-strong">—</span>
                          <span className="erp-identity-meta d-block">
                            {d.createdAt}
                          </span>
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(d)}
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

      {/* Add Several Bulk Modal */}
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
                      Add Several Departments
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setBulkOpen(false)}
                    />
                  </div>
                  <div className="modal-body">
                    <p className="text-muted small mb-2">
                      Enter one department per line as <code>CODE | Name</code>. Duplicate
                      codes are skipped automatically.
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
                        Delete department?
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
