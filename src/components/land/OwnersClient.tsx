"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OWNER_KINDS, getLabel } from "@/lib/land";
import { ErpDeleteModal, ErpEmptyState, ErpPageHeader, ErpPill, ErpTableCard } from "@/components/ui";

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
  const [deleteTarget, setDeleteTarget] = useState<OwnerRow | null>(null);

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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await fetch(`/api/land/owners/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-users"
        title="Landowners"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Land" },
          { label: "Landowners" },
        ]}
        actions={
          <>
            <a href="/api/land/owners/export" className="btn btn-erp-ghost">
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </a>
            <Link href="/land/owners/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Landowner
            </Link>
          </>
        }
      />

      <ErpTableCard
        headerClass="erp-card-head"
        toolbar={
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
        }
        countText={`${owners.length} ${owners.length === 1 ? "owner" : "owners"}`}
        isEmpty={owners.length === 0}
        emptyState={
          <ErpEmptyState
            icon="fa-solid fa-users"
            title="No landowners yet"
            description="Sellers are kept apart from CRM customers — a seller carries parentage, NID and payout details a customer never needs."
            action={
              <Link href="/land/owners/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Landowner
              </Link>
            }
          />
        }
      >
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
                            <ErpPill tone="hold">No payout</ErpPill>
                          )}
                        </td>
                        <td>
                          {blocked ? (
                            <ErpPill tone="overdue">Cannot sign yet</ErpPill>
                          ) : o.isMinor ? (
                            <ErpPill tone="hold">
                              Minor (Guardian: {o.guardianName})
                            </ErpPill>
                          ) : o.isDeceased ? (
                            <ErpPill tone="hold">
                              Deceased (Succession: {o.successionCertificateNo})
                            </ErpPill>
                          ) : (
                            <ErpPill tone="available">Eligible</ErpPill>
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
                            onClick={() => setDeleteTarget(o)}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
        </table>
      </ErpTableCard>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete landowner?"
        description={
          deleteTarget && (
            <>
              Delete landowner <strong>{deleteTarget.name}</strong> ({deleteTarget.code})?
            </>
          )
        }
        busy={Boolean(deleteTarget && busyId === deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
