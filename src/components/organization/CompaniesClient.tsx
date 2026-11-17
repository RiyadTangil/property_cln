"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/tier0";

export interface CompanyRow {
  id: number;
  code: string;
  name: string;
  registrationNumber: string | null;
  tin: string | null;
  email: string | null;
  currency: string;
  fiscalYear: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function CompaniesClient({
  companies,
  filters,
}: {
  companies: CompanyRow[];
  filters: { search: string; status: string };
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<CompanyRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await fetch(`/api/organization/companies/${deleteTarget.id}`, {
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
            <i className="fa-solid fa-building-columns"></i>
          </div>
          <div>
            <h1>Company</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Company
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/organization/companies/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Company
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/organization/companies"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search name, code, email, TIN…"
                aria-label="Search companies"
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
              <Link href="/organization/companies" className="btn btn-erp-ghost">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {companies.length} {companies.length === 1 ? "company" : "companies"}
          </span>
        </div>

        {companies.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-building-columns"></i>
            </div>
            <h3>No companies found</h3>
            <p>Add a legal entity to manage branches, fiscal years, and ledgers.</p>
            <Link href="/organization/companies/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Company
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Code</th>
                    <th>Registration / TIN</th>
                    <th>Currency</th>
                    <th>Financial Year</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="erp-identity">
                          <span className="erp-logo-thumb d-flex align-items-center justify-content-center fw-bold">
                            {c.isDefault ? (
                              <img src="/brand/erp-logo.jpg" alt={c.name} />
                            ) : (
                              getInitials(c.name)
                            )}
                          </span>
                          <span>
                            <span className="erp-identity-name">
                              {c.name}
                              {c.isDefault && (
                                <span className="erp-pill is-sold ms-1">Default</span>
                              )}
                            </span>
                            <span className="erp-identity-meta">
                              {c.email || "No email"}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="erp-cell-strong">{c.code}</td>
                      <td>
                        <span className="d-block">{c.registrationNumber || "—"}</span>
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {c.tin ? `TIN: ${c.tin}` : "No TIN"}
                        </span>
                      </td>
                      <td className="erp-cell-strong text-nowrap">
                        {c.currency} <span className="text-muted fw-normal">৳</span>
                      </td>
                      <td className="text-nowrap">{c.fiscalYear}</td>
                      <td>
                        <span
                          className={`erp-pill ${
                            c.isActive ? "is-available" : "is-neutral"
                          }`}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <span className="erp-created-by">
                          <span className="erp-cell-strong">—</span>
                          <span className="erp-identity-meta d-block">
                            {c.createdAt}
                          </span>
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        {!c.isDefault && (
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(c)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
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
                        Delete company?
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                        <strong>{deleteTarget.name}</strong> will be removed from active use.
                        Related records are retained and can be restored by an administrator.
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
