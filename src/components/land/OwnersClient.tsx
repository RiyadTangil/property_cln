"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OWNER_KINDS, getLabel } from "@/lib/land";

export interface OwnerRow {
  id: number;
  code: string;
  kind: string;
  name: string;
  nid: string | null;
  fatherName: string | null;
  phone: string | null;
  district: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  mfsProvider: string | null;
  mfsNumber: string | null;
  isMinor: boolean;
  isDeceased: boolean;
  guardianName: string | null;
  successionCertificateNo: string | null;
  isActive: boolean;
}

export default function OwnersClient({
  owners,
  filters,
}: {
  owners: OwnerRow[];
  filters: {
    search: string;
    kind: string;
    district: string;
    status: string;
    flag: string;
  };
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);

  async function toggleStatus(owner: OwnerRow) {
    setBusyId(owner.id);
    try {
      await fetch(`/api/land/owners/${owner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !owner.isActive }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(owner: OwnerRow) {
    if (!confirm(`Delete landowner ${owner.name} (${owner.code})?`)) return;
    setBusyId(owner.id);
    try {
      await fetch(`/api/land/owners/${owner.id}`, { method: "DELETE" });
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
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <h1>Landowners</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Land</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Landowners
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <a href="/api/land/owners/export" className="btn btn-erp-ghost">
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </a>
          <Link href="/land/owners/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Landowner
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-card-head">
          <form method="GET" action="/land/owners" className="erp-filterbar">
            <div className="erp-search erp-search-sm">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Name, NID, phone…"
                aria-label="Search"
              />
            </div>
            <select
              name="kind"
              className="erp-select"
              defaultValue={filters.kind}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Party type"
            >
              <option value="">Any type</option>
              {OWNER_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="district"
              defaultValue={filters.district}
              className="erp-select"
              placeholder="District"
              aria-label="District"
              style={{ maxWidth: 150 }}
            />
            <select
              name="status"
              className="erp-select"
              defaultValue={filters.status}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Status"
            >
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              name="flag"
              className="erp-select"
              defaultValue={filters.flag}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Attention"
            >
              <option value="">All owners</option>
              <option value="blocked">Cannot sign yet</option>
              <option value="no_payout">No payout details</option>
            </select>
            {(filters.search ||
              filters.kind ||
              filters.district ||
              filters.status ||
              filters.flag) && (
              <Link href="/land/owners" className="btn btn-erp-ghost btn-sm">
                Reset
              </Link>
            )}
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {owners.length} {owners.length === 1 ? "owner" : "owners"}
          </span>
        </div>

        {owners.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-users"></i>
            </div>
            <h3>No landowners yet</h3>
            <p>
              Sellers are kept apart from CRM customers — a seller carries parentage,
              NID and payout details a customer never needs.
            </p>
            <Link href="/land/owners/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Landowner
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Owner ID</th>
                    <th>Name &amp; Parentage</th>
                    <th>Party Type</th>
                    <th>NID &amp; Phone</th>
                    <th>Payout Account</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((o) => {
                    const hasPayout = Boolean(o.bankAccountNo || o.mfsNumber);
                    const blocked =
                      (o.isMinor && !o.guardianName) ||
                      (o.isDeceased && !o.successionCertificateNo);
                    return (
                      <tr key={o.id}>
                        <td className="erp-cell-strong">{o.code}</td>
                        <td>
                          <span className="erp-cell-strong d-block">{o.name}</span>
                          {o.fatherName && (
                            <span className="text-muted" style={{ fontSize: 12 }}>
                              S/O {o.fatherName}
                            </span>
                          )}
                        </td>
                        <td>{getLabel(OWNER_KINDS, o.kind)}</td>
                        <td>
                          <span className="d-block">{o.nid || "No NID"}</span>
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {o.phone || "—"} {o.district ? `· ${o.district}` : ""}
                          </span>
                        </td>
                        <td>
                          {hasPayout ? (
                            <span style={{ fontSize: 12.5 }}>
                              {o.bankName
                                ? `${o.bankName} (${o.bankAccountNo})`
                                : `${o.mfsProvider || "MFS"} (${o.mfsNumber})`}
                            </span>
                          ) : (
                            <span className="erp-pill is-hold">No payout</span>
                          )}
                        </td>
                        <td>
                          {blocked ? (
                            <span className="erp-pill is-overdue">Cannot sign yet</span>
                          ) : o.isMinor ? (
                            <span className="erp-pill is-hold">
                              Minor (Guardian: {o.guardianName})
                            </span>
                          ) : o.isDeceased ? (
                            <span className="erp-pill is-hold">
                              Deceased (Succession: {o.successionCertificateNo})
                            </span>
                          ) : (
                            <span className="erp-pill is-available">Eligible</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`erp-pill border-0 ${
                              o.isActive ? "is-available" : "is-neutral"
                            }`}
                            disabled={busyId === o.id}
                            onClick={() => toggleStatus(o)}
                          >
                            {o.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            disabled={busyId === o.id}
                            onClick={() => handleDelete(o)}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
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
    </div>
  );
}
