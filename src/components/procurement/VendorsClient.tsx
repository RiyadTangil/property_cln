"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

interface VendorRow {
  id: number;
  code: string;
  name: string;
  displayName: string | null;
  vendorType: string;
  category: string | null;
  status: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  openingBalance: number;
}

export function VendorsClient({ vendors }: { vendors: VendorRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [vendorType, setVendorType] = useState("");
  const [category, setCategory] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VendorRow | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = vendors.filter((v) => {
    if (status && v.status !== status) return false;
    if (vendorType && v.vendorType !== vendorType) return false;
    if (category && v.category !== category) return false;
    const q = search.trim().toLowerCase();
    if (
      q &&
      !`${v.code} ${v.name} ${v.contactPerson ?? ""} ${v.phone ?? ""} ${v.email ?? ""}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    return true;
  });

  const activeCount = vendors.filter((v) => v.status === "active").length;
  const holdCount = vendors.filter((v) => v.status === "on_hold").length;
  const blacklistedCount = vendors.filter((v) => v.status === "blacklisted").length;

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await fetch(`/api/procurement/vendors/${deleteTarget.id}`, { method: "DELETE" });
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
            <h1>Vendors</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Procurement</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Vendors
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
                "vendors.csv",
                ["Code", "Name", "Type", "Contact", "Phone", "Status"],
                rows.map((r) => [
                  r.code,
                  r.name,
                  r.vendorType,
                  r.contactPerson ?? "",
                  r.phone ?? "",
                  r.status,
                ])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </button>
          <Link href="/vendors/vendors/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Vendor
          </Link>
        </div>
      </div>

      <div className="erp-coa-summary">
        <div className="erp-coa-stat is-booked">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-truck-field"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{vendors.length}</strong>
            <small>Total vendors</small>
          </span>
        </div>
        <div className="erp-coa-stat is-available">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-circle-check"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{activeCount}</strong>
            <small>Active</small>
          </span>
        </div>
        <div className="erp-coa-stat is-hold">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-circle-pause"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{holdCount}</strong>
            <small>On hold</small>
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
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/vendors/vendors"
            className="erp-filterbar"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-search erp-search-sm">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, code, phone, email…"
                aria-label="Search"
              />
            </div>
            <select
              name="status"
              className="erp-select"
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
            <select
              name="vendor_type"
              className="erp-select"
              aria-label="Type"
              value={vendorType}
              onChange={(e) => setVendorType(e.target.value)}
            >
              <option value="">All types</option>
              <option value="company">Company</option>
              <option value="individual">Individual</option>
              <option value="government">Government</option>
              <option value="partnership">Partnership</option>
            </select>
            <select
              name="category"
              className="erp-select"
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              <option value="contractor">Main Contractor</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="material_supplier">Material Supplier</option>
              <option value="equipment_supplier">Equipment / Plant Supplier</option>
              <option value="consultant">Consultant</option>
              <option value="service_provider">Service Provider</option>
              <option value="transport">Transport &amp; Logistics</option>
              <option value="utility">Utility</option>
              <option value="legal">Legal / Statutory</option>
              <option value="other">Other</option>
            </select>
            <button type="submit" className="btn btn-erp-ghost btn-sm">
              Filter
            </button>
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {rows.length} {rows.length === 1 ? "vendor" : "vendors"}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-truck-field"></i>
            </div>
            <h3>No vendors yet</h3>
            <p>
              Vendors are the parties you buy from and owe money to. Add one to start recording
              bills and payments.
            </p>
            <Link href="/vendors/vendors/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Vendor
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Contact</th>
                    <th>City</th>
                    <th className="text-end">Opening Balance</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((v) => (
                    <tr key={v.id}>
                      <td className="erp-cell-strong">
                        {v.name}
                        <span className="erp-identity-meta d-block">{v.code}</span>
                      </td>
                      <td className="text-capitalize">{v.vendorType}</td>
                      <td>{v.category || "—"}</td>
                      <td>
                        {v.contactPerson || "—"}
                        {v.phone ? ` · ${v.phone}` : ""}
                      </td>
                      <td>{v.city || "—"}</td>
                      <td className="text-end">{v.openingBalance.toFixed(2)}</td>
                      <td>
                        <span
                          className={`erp-pill ${
                            v.status === "active"
                              ? "is-available"
                              : v.status === "blacklisted"
                              ? "is-overdue"
                              : "is-neutral"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          onClick={() => setDeleteTarget(v)}
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
                    Delete vendor?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>{deleteTarget?.name}</strong> will be removed from
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
