"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/tier0";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpIdentity,
  ErpPageHeader,
  ErpPill,
  ErpTableCard,
} from "@/components/ui";

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

interface BulkDeptRow {
  code: string;
  name: string;
  head_name: string;
  branch_id: string;
  parent_id: string;
  email: string;
}

const emptyDeptRow = (): BulkDeptRow => ({
  code: "",
  name: "",
  head_name: "",
  branch_id: "",
  parent_id: "",
  email: "",
});

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
  const [bulkRows, setBulkRows] = useState<BulkDeptRow[]>([emptyDeptRow(), emptyDeptRow()]);
  const [bulkError, setBulkError] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeptRow | null>(null);
  const [busy, setBusy] = useState(false);

  const validBulkCount = bulkRows.filter((r) => r.code.trim() && r.name.trim()).length;

  function updateBulkRow(idx: number, patch: Partial<BulkDeptRow>) {
    setBulkRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  async function toggleDepartmentActive(d: DeptRow) {
    setBusy(true);
    try {
      await fetch(`/api/organization/departments/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !d.isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitBulk(e: FormEvent) {
    e.preventDefault();
    setBulkError("");
    const items = bulkRows
      .filter((r) => r.code.trim() && r.name.trim())
      .map((r) => ({
        code: r.code.trim().toUpperCase(),
        name: r.name.trim(),
        head_name: r.head_name.trim() || null,
        branch_id: r.branch_id ? Number(r.branch_id) : null,
        parent_id: r.parent_id ? Number(r.parent_id) : null,
        email: r.email.trim() || null,
      }));

    if (items.length === 0) {
      setBulkError("Enter at least one department row with both Code and Name.");
      return;
    }
    setBulkSaving(true);
    try {
      const res = await fetch("/api/organization/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBulkError(data.error || "Failed to save departments.");
        return;
      }
      setBulkOpen(false);
      setBulkRows([emptyDeptRow(), emptyDeptRow()]);
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
      <ErpPageHeader
        icon="fa-solid fa-diagram-project"
        title="Department"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Organization" },
          { label: "Department" },
        ]}
        actions={
          <>
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
          </>
        }
      />

      <ErpTableCard
        toolbar={
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
        }
        countText={`${departments.length} ${departments.length === 1 ? "department" : "departments"}`}
        isEmpty={departments.length === 0}
        emptyState={
          <ErpEmptyState
            icon="fa-solid fa-diagram-project"
            title="No departments found"
            description="Organize teams into departments and sub-departments."
            action={
              <Link href="/organization/departments/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Department
              </Link>
            }
          />
        }
      >
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
                  <ErpIdentity
                    initials={getInitials(d.name)}
                    title={d.name}
                    meta={d.headName || "No head assigned"}
                  />
                </td>
                <td className="erp-cell-strong">{d.code}</td>
                <td>{companyName}</td>
                <td>{d.branchName || "—"}</td>
                <td>{d.parentName || "—"}</td>
                <td className="text-end erp-cell-strong">{d.subCount}</td>
                <td>
                  <ErpPill tone={d.isActive ? "available" : "neutral"}>
                    {d.isActive ? "Active" : "Inactive"}
                  </ErpPill>
                </td>
                <td>
                  <span className="erp-created-by">
                    <span className="erp-cell-strong">—</span>
                    <span className="erp-identity-meta d-block">{d.createdAt}</span>
                  </span>
                </td>
                <td className="text-end text-nowrap">
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    title="Edit"
                    onClick={() => toggleDepartmentActive(d)}
                    disabled={busy}
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
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
      </ErpTableCard>

      {bulkOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <form onSubmit={submitBulk} noValidate>
                  <div className="modal-header border-0 px-4 pt-4 pb-0">
                    <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>
                      <i className="fa-solid fa-sitemap me-2 text-muted"></i>
                      Add several departments
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      onClick={() => setBulkOpen(false)}
                    />
                  </div>
                  <div className="modal-body p-4">
                    <p className="erp-note mb-3">
                      <i className="fa-solid fa-circle-info"></i>
                      <span>
                        All of them are saved together or none of them are — a half-written
                        structure is worse than none, because you would have to work out which rows
                        landed before retrying.
                      </span>
                    </p>

                    <div className="erp-table-wrap">
                      <table className="table erp-table erp-dept-bulk mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: 120 }}>
                              Code <span className="erp-required">*</span>
                            </th>
                            <th style={{ minWidth: 180 }}>
                              Name <span className="erp-required">*</span>
                            </th>
                            <th style={{ minWidth: 150 }}>Head</th>
                            <th style={{ minWidth: 150 }}>Branch</th>
                            <th style={{ minWidth: 150 }}>Reports to</th>
                            <th style={{ minWidth: 170 }}>Email</th>
                            <th style={{ width: 44 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkRows.map((row, idx) => (
                            <tr key={idx}>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm text-uppercase"
                                  maxLength={20}
                                  placeholder="SALES"
                                  value={row.code}
                                  onChange={(e) => updateBulkRow(idx, { code: e.target.value })}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  maxLength={150}
                                  placeholder="Sales"
                                  value={row.name}
                                  onChange={(e) => updateBulkRow(idx, { name: e.target.value })}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  maxLength={150}
                                  value={row.head_name}
                                  onChange={(e) =>
                                    updateBulkRow(idx, { head_name: e.target.value })
                                  }
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={row.branch_id}
                                  onChange={(e) =>
                                    updateBulkRow(idx, { branch_id: e.target.value })
                                  }
                                >
                                  <option value="">—</option>
                                  {branches.map((b) => (
                                    <option key={b.id} value={String(b.id)}>
                                      {b.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={row.parent_id}
                                  onChange={(e) =>
                                    updateBulkRow(idx, { parent_id: e.target.value })
                                  }
                                >
                                  <option value="">—</option>
                                  {departments.map((d) => (
                                    <option key={d.id} value={String(d.id)}>
                                      {d.code} — {d.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="email"
                                  className="form-control form-control-sm"
                                  maxLength={150}
                                  value={row.email}
                                  onChange={(e) => updateBulkRow(idx, { email: e.target.value })}
                                />
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-erp-ghost btn-sm text-danger"
                                  title="Remove row"
                                  disabled={bulkRows.length <= 1}
                                  onClick={() =>
                                    setBulkRows((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm mt-3"
                      onClick={() => setBulkRows((prev) => [...prev, emptyDeptRow()])}
                    >
                      <i className="fa-solid fa-plus me-1"></i>Add row
                    </button>

                    {bulkError && (
                      <div
                        className="alert alert-danger mt-3"
                        style={{ borderRadius: 10, fontSize: 13 }}
                      >
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        <span>{bulkError}</span>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer border-0 px-4 pb-4 pt-0">
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      onClick={() => setBulkOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-erp" disabled={bulkSaving}>
                      <i className="fa-solid fa-floppy-disk me-2"></i>
                      {bulkSaving ? "Saving…" : `Save ${validBulkCount} departments`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete department?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> will be removed from active use.
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
