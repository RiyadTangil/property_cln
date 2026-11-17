"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRANCH_TYPES, getInitials } from "@/lib/tier0";
import { getLabel } from "@/lib/land";

export interface BranchRow {
  id: number;
  code: string;
  name: string;
  type: string;
  managerName: string | null;
  city: string | null;
  country: string;
  deptsCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function BranchesClient({
  branches,
  companyName,
  filters,
}: {
  branches: BranchRow[];
  companyName: string;
  filters: { search: string; status: string };
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<BranchRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await fetch(`/api/organization/branches/${deleteTarget.id}`, {
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
            <i className="fa-solid fa-code-branch"></i>
          </div>
          <div>
            <h1>Branch</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Branch
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/organization/branches/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Branch
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/organization/branches"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search name, code, city, manager…"
                aria-label="Search branches"
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
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
            {(filters.search || filters.status) && (
              <Link href="/organization/branches" className="btn btn-erp-ghost">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {branches.length} {branches.length === 1 ? "branch" : "branches"}
          </span>
        </div>

        {branches.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-code-branch"></i>
            </div>
            <h3>No branches match your filters</h3>
            <p>Create a branch, sales centre, site office, or warehouse.</p>
            <Link href="/organization/branches/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Branch
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Code</th>
                    <th>Company</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th className="text-end">Depts</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="erp-identity">
                          <span className="erp-initials">{getInitials(b.name)}</span>
                          <span>
                            <span className="erp-identity-name">{b.name}</span>
                            <span className="erp-identity-meta">
                              {b.managerName || "No manager assigned"}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="erp-cell-strong">{b.code}</td>
                      <td>{companyName}</td>
                      <td>
                        <span className="erp-pill is-neutral">
                          {getLabel(BRANCH_TYPES, b.type)}
                        </span>
                      </td>
                      <td>
                        <span className="d-block">{b.city || "—"}</span>
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {b.country}
                        </span>
                      </td>
                      <td className="text-end erp-cell-strong">{b.deptsCount}</td>
                      <td>
                        <span
                          className={`erp-pill ${
                            b.isActive ? "is-available" : "is-neutral"
                          }`}
                        >
                          {b.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <span className="erp-created-by">
                          <span className="erp-cell-strong">—</span>
                          <span className="erp-identity-meta d-block">
                            {b.createdAt}
                          </span>
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(b)}
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
                        Delete branch?
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                        <strong>{deleteTarget.name}</strong> will be removed from active use.
                        The record is retained and can be restored by an administrator.
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
