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
  const [bulkText, setBulkText] = useState("ENG | Site Engineer\nACC | Accounts Executive");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DesigRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitBulk(e: FormEvent) {
    e.preventDefault();
    const items = bulkText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [code, ...rest] = line.split(/[|,]/);
        return { code: (code || "").trim(), name: rest.join(" ").trim() };
      })
      .filter((x) => x.code && x.name);

    if (items.length === 0) return;
    setBulkSaving(true);
    try {
      await fetch("/api/organization/designations", {
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
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <form onSubmit={submitBulk}>
                  <div className="modal-header">
                    <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>
                      <i className="fa-solid fa-layer-group me-2 text-muted"></i>
                      Bulk Add Designations
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setBulkOpen(false)}
                    />
                  </div>
                  <div className="modal-body">
                    <p className="text-muted small mb-2">
                      Enter one designation per line as <code>CODE | Title</code>.
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
