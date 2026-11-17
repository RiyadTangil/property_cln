"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRANCH_TYPES, getInitials } from "@/lib/tier0";
import { getLabel } from "@/lib/land";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpIdentity,
  ErpPageHeader,
  ErpPill,
  ErpTableCard,
} from "@/components/ui";

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
      <ErpPageHeader
        icon="fa-solid fa-code-branch"
        title="Branch"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Organization" },
          { label: "Branch" },
        ]}
        actions={
          <Link href="/organization/branches/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Branch
          </Link>
        }
      />

      <ErpTableCard
        toolbar={
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
        }
        countText={`${branches.length} ${branches.length === 1 ? "branch" : "branches"}`}
        isEmpty={branches.length === 0}
        emptyState={
          <ErpEmptyState
            icon="fa-solid fa-code-branch"
            title="No branches match your filters"
            description="Create a branch, sales centre, site office, or warehouse."
            action={
              <Link href="/organization/branches/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Branch
              </Link>
            }
          />
        }
      >
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
                  <ErpIdentity
                    initials={getInitials(b.name)}
                    title={b.name}
                    meta={b.managerName || "No manager assigned"}
                  />
                </td>
                <td className="erp-cell-strong">{b.code}</td>
                <td>{companyName}</td>
                <td>
                  <ErpPill tone="neutral">{getLabel(BRANCH_TYPES, b.type)}</ErpPill>
                </td>
                <td>
                  <span className="d-block">{b.city || "—"}</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {b.country}
                  </span>
                </td>
                <td className="text-end erp-cell-strong">{b.deptsCount}</td>
                <td>
                  <ErpPill tone={b.isActive ? "available" : "neutral"}>
                    {b.isActive ? "Active" : "Inactive"}
                  </ErpPill>
                </td>
                <td>
                  <span className="erp-created-by">
                    <span className="erp-cell-strong">—</span>
                    <span className="erp-identity-meta d-block">{b.createdAt}</span>
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
      </ErpTableCard>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete branch?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> will be removed from active use. The record
              is retained and can be restored by an administrator.
            </>
          )
        }
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
