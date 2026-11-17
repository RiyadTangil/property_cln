"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DESIGNATION_GRADES, EMPLOYMENT_TYPES, getInitials } from "@/lib/tier0";
import { getLabel } from "@/lib/land";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpIdentity,
  ErpPageHeader,
  ErpPill,
  ErpTableCard,
} from "@/components/ui";

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

interface BulkDesigRow {
  code: string;
  name: string;
  department_id: string;
  employment_type: string;
  grade: string;
  is_managerial: boolean;
  is_active: boolean;
}

const emptyDesigRow = (): BulkDesigRow => ({
  code: "",
  name: "",
  department_id: "",
  employment_type: "full_time",
  grade: "",
  is_managerial: false,
  is_active: true,
});

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
  const [bulkRows, setBulkRows] = useState<BulkDesigRow[]>([emptyDesigRow(), emptyDesigRow()]);
  const [bulkError, setBulkError] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DesigRow | null>(null);
  const [busy, setBusy] = useState(false);

  function updateBulkRow(idx: number, patch: Partial<BulkDesigRow>) {
    setBulkRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  async function toggleDesignationActive(ds: DesigRow) {
    setBusy(true);
    try {
      await fetch(`/api/organization/designations/${ds.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !ds.isActive }),
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
        department_id: r.department_id ? Number(r.department_id) : null,
        employment_type: r.employment_type || "full_time",
        grade: r.grade || null,
        is_managerial: r.is_managerial,
        is_active: r.is_active,
      }));

    if (items.length === 0) {
      setBulkError("Enter at least one designation row with Code and Title.");
      return;
    }
    setBulkSaving(true);
    try {
      const res = await fetch("/api/organization/designations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBulkError(data.error || "Failed to create designations.");
        return;
      }
      setBulkOpen(false);
      setBulkRows([emptyDesigRow(), emptyDesigRow()]);
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
      <ErpPageHeader
        icon="fa-solid fa-user-tie"
        title="Designation"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Organization" },
          { label: "Designation" },
        ]}
        actions={
          <>
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
          </>
        }
      />

      <ErpTableCard
        toolbar={
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
        }
        countText={`${designations.length} ${designations.length === 1 ? "designation" : "designations"}`}
        isEmpty={designations.length === 0}
        emptyState={
          <ErpEmptyState
            icon="fa-solid fa-user-tie"
            title="No designations found"
            description="Add job titles, seniority grades, and employment types."
            action={
              <Link href="/organization/designations/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Designation
              </Link>
            }
          />
        }
      >
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
                  <ErpIdentity
                    initials={getInitials(ds.name)}
                    title={ds.name}
                    badge={
                      ds.isManagerial && (
                        <ErpPill tone="sold" className="ms-1">
                          Managerial
                        </ErpPill>
                      )
                    }
                    meta={ds.description || "No description"}
                  />
                </td>
                <td className="erp-cell-strong">{ds.code}</td>
                <td>{companyName}</td>
                <td>{ds.departmentName || "Company-wide"}</td>
                <td>
                  {ds.grade ? (
                    <ErpPill tone="booked">{getLabel(DESIGNATION_GRADES, ds.grade)}</ErpPill>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{getLabel(EMPLOYMENT_TYPES, ds.employmentType)}</td>
                <td>
                  <ErpPill tone={ds.isActive ? "available" : "neutral"}>
                    {ds.isActive ? "Active" : "Inactive"}
                  </ErpPill>
                </td>
                <td>
                  <span className="erp-created-by">
                    <span className="erp-cell-strong">{ds.createdBy || "—"}</span>
                    <span className="erp-identity-meta d-block">{ds.createdAt}</span>
                  </span>
                </td>
                <td className="text-end text-nowrap">
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    title="Edit"
                    onClick={() => toggleDesignationActive(ds)}
                    disabled={busy}
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
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
      </ErpTableCard>

      {bulkOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content erp-form" style={{ border: "none", borderRadius: 14 }}>
                <form onSubmit={submitBulk} noValidate>
                  <div className="modal-body p-4">
                    <h5 className="mb-1" style={{ fontSize: 16, fontWeight: 600 }}>
                      Bulk add designations
                    </h5>
                    <p className="text-muted mb-3" style={{ fontSize: 12.5 }}>
                      Add several job titles at once. Blank rows are ignored; codes must be unique
                      within the company.
                    </p>

                    {bulkError && (
                      <div
                        className="alert alert-danger py-2"
                        role="alert"
                        style={{ borderRadius: 10, fontSize: 12.5 }}
                      >
                        <i className="fa-solid fa-circle-exclamation me-1"></i>
                        <span>{bulkError}</span>
                      </div>
                    )}

                    <div className="erp-table-wrap">
                      <table className="table erp-table align-middle mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: "15%" }}>
                              Code <span className="erp-required">*</span>
                            </th>
                            <th style={{ width: "24%" }}>
                              Title <span className="erp-required">*</span>
                            </th>
                            <th style={{ width: "18%" }}>Department</th>
                            <th style={{ width: "16%" }}>
                              Employment <span className="erp-required">*</span>
                            </th>
                            <th style={{ width: "15%" }}>Grade</th>
                            <th className="text-center" style={{ width: "6%" }}>
                              Mgr
                            </th>
                            <th className="text-center" style={{ width: "6%" }}>
                              Active
                            </th>
                            <th style={{ width: 36 }}></th>
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
                                  placeholder="SR-ENG"
                                  value={row.code}
                                  onChange={(e) => updateBulkRow(idx, { code: e.target.value })}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  maxLength={150}
                                  placeholder="Senior Site Engineer"
                                  value={row.name}
                                  onChange={(e) => updateBulkRow(idx, { name: e.target.value })}
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={row.department_id}
                                  onChange={(e) =>
                                    updateBulkRow(idx, { department_id: e.target.value })
                                  }
                                >
                                  <option value="">Company-wide</option>
                                  {departments.map((d) => (
                                    <option key={d.id} value={String(d.id)}>
                                      {d.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={row.employment_type}
                                  onChange={(e) =>
                                    updateBulkRow(idx, { employment_type: e.target.value })
                                  }
                                >
                                  {EMPLOYMENT_TYPES.map((et) => (
                                    <option key={et.value} value={et.value}>
                                      {et.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={row.grade}
                                  onChange={(e) => updateBulkRow(idx, { grade: e.target.value })}
                                >
                                  <option value="">Not graded</option>
                                  {DESIGNATION_GRADES.map((g) => (
                                    <option key={g.value} value={g.value}>
                                      {g.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={row.is_managerial}
                                  onChange={(e) =>
                                    updateBulkRow(idx, { is_managerial: e.target.checked })
                                  }
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={row.is_active}
                                  onChange={(e) =>
                                    updateBulkRow(idx, { is_active: e.target.checked })
                                  }
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
                      onClick={() => setBulkRows((prev) => [...prev, emptyDesigRow()])}
                    >
                      <i className="fa-solid fa-plus me-2"></i>Add row
                    </button>
                  </div>
                  <div className="modal-footer border-0 pt-0 px-4 pb-4">
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      onClick={() => setBulkOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-erp" disabled={bulkSaving}>
                      <i className="fa-solid fa-layer-group me-2"></i>
                      {bulkSaving ? "Saving…" : "Create Designations"}
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
        title="Delete designation?"
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
