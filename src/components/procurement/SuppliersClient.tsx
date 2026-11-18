"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

interface SupplierRow {
  id: number;
  code: string;
  supplierType: string;
  companyName: string;
  displayName: string | null;
  status: string;
  openingBalance: number;
  creditLimit: number;
  creditDays: number;
  businessCategory: string | null;
  defaultPaymentMethod: string;
  leadTimeDays: number;
}

export function SuppliersClient({ suppliers }: { suppliers: SupplierRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [supplierType, setSupplierType] = useState("");
  const [status, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SupplierRow | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = suppliers.filter((s) => {
    if (supplierType && s.supplierType !== supplierType) return false;
    if (status && s.status !== status) return false;
    const q = search.trim().toLowerCase();
    if (
      q &&
      !`${s.code} ${s.companyName} ${s.displayName ?? ""} ${s.businessCategory ?? ""}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    return true;
  });

  const activeCount = suppliers.filter((s) => s.status === "active").length;
  const inactiveCount = suppliers.filter((s) => s.status === "inactive").length;
  const blacklistedCount = suppliers.filter((s) => s.status === "blacklisted").length;

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await fetch(`/api/procurement/suppliers/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-truck-field"></i>
          </div>
          <div>
            <h1>Suppliers</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Procurement</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Suppliers
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() =>
              downloadCsv(
                "suppliers.csv",
                ["Code", "Company", "Type", "Credit Limit", "Opening Balance", "Status"],
                rows.map((r) => [
                  r.code,
                  r.companyName,
                  r.supplierType,
                  r.creditLimit,
                  r.openingBalance,
                  r.status,
                ])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </button>
          <Link href="/suppliers/suppliers/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Supplier
          </Link>
        </div>
      </div>

      <div className="erp-coa-summary">
        <div className="erp-coa-stat is-available">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-circle-check"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{activeCount}</strong>
            <small>Active</small>
          </span>
        </div>
        <div className="erp-coa-stat is-neutral">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-circle-pause"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{inactiveCount}</strong>
            <small>Inactive</small>
          </span>
        </div>
        <div className="erp-coa-stat is-overdue">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-ban"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{blacklistedCount}</strong>
            <small>Blacklisted</small>
          </span>
        </div>
        <div className="erp-coa-stat is-neutral">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-truck-field"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{suppliers.length}</strong>
            <small>Total suppliers</small>
          </span>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/suppliers/suppliers"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or code…"
                aria-label="Search suppliers"
              />
            </div>
            <select
              name="supplier_type"
              className="form-select erp-select"
              value={supplierType}
              onChange={(e) => setSupplierType(e.target.value)}
              aria-label="Type"
            >
              <option value="">All types</option>
              <option value="individual">Individual</option>
              <option value="company">Company</option>
              <option value="government">Government</option>
              <option value="ngo">NGO</option>
            </select>
            <select
              name="status"
              className="form-select erp-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {rows.length} {rows.length === 1 ? "supplier" : "suppliers"}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-truck-field"></i>
            </div>
            <h3>No suppliers yet</h3>
            <p>Suppliers are the vendors you buy materials, services and equipment from.</p>
            <Link href="/suppliers/suppliers/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>Add Supplier
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Terms</th>
                    <th className="text-end">Opening Balance</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td className="erp-cell-strong">
                        {s.companyName}
                        <span className="erp-identity-meta d-block">
                          {s.code}
                          {s.displayName ? ` · ${s.displayName}` : ""}
                        </span>
                      </td>
                      <td className="text-capitalize">{s.supplierType}</td>
                      <td>{s.businessCategory || "—"}</td>
                      <td>
                        {s.creditDays} days · Lead {s.leadTimeDays}d
                      </td>
                      <td className="text-end">{s.openingBalance.toFixed(2)}</td>
                      <td>
                        <span
                          className={`erp-pill ${
                            s.status === "active"
                              ? "is-available"
                              : s.status === "blacklisted"
                              ? "is-overdue"
                              : "is-neutral"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          onClick={() => setDeleteTarget(s)}
                          title="Delete"
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

      <div
        className={`modal fade ${deleteTarget ? "show d-block" : ""}`}
        id="deleteRecordModal"
        tabIndex={-1}
        aria-hidden={!deleteTarget}
        style={deleteTarget ? { background: "rgba(15,23,42,0.5)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ border: "none", borderRadius: "14px" }}>
            <div className="modal-body p-4">
              <div className="d-flex gap-3">
                <div className="erp-kpi-icon is-danger">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                    Delete supplier?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>{deleteTarget?.companyName}</strong> will be removed from
                    active use. The record is retained and can be restored by an administrator.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <form method="POST" data-delete-form onSubmit={handleDelete}>
                <input type="hidden" name="_method" value="DELETE" />
                <button
                  type="submit"
                  className="btn btn-erp"
                  disabled={busy}
                  style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
                >
                  <i className="fa-solid fa-trash-can me-2"></i>Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
