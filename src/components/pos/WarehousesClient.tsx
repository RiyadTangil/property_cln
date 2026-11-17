"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpPageHeader,
  ErpPill,
} from "@/components/ui";

export interface WarehouseRow {
  id: number;
  code: string;
  name: string;
  type: string;
  branchId: number | null;
  branchName: string | null;
  projectId: number | null;
  projectName: string | null;
  managerName: string | null;
  address: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
}

const WAREHOUSE_TYPE_LABELS: Record<string, string> = {
  central: "Central Warehouse",
  regional: "Regional Warehouse",
  project: "Project Store",
  site: "Site Store",
  yard: "Open Yard",
  subcontractor: "Subcontractor Store",
  store: "Retail Store / Outlet",
  van: "Van / Mobile",
};

const PROJECT_TYPES = new Set(["project", "site", "yard", "subcontractor"]);

const WAREHOUSE_TYPE_HINTS: Record<string, string> = {
  central: "Main hub feeding project stores and outlets.",
  regional: "Regional distribution store.",
  project: "Dedicated store for a single construction project.",
  site: "On-site material store at the project location.",
  yard: "Open-air yard for rebar, aggregates, and heavy items.",
  subcontractor: "Materials issued to a subcontractor.",
  store: "Customer-facing retail outlet.",
  van: "Mobile stock carried on a vehicle.",
};

export default function WarehousesClient({
  warehouses,
  branches,
  projects,
}: {
  warehouses: WarehouseRow[];
  branches: { id: number; name: string }[];
  projects: { id: number; code: string; name: string }[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WarehouseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseRow | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("central");
  const [branchId, setBranchId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [managerName, setManagerName] = useState("");
  const [address, setAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setCode("");
    setName("");
    setType("central");
    setBranchId("");
    setProjectId("");
    setManagerName("");
    setAddress("");
    setIsDefault(warehouses.length === 0);
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(w: WarehouseRow) {
    setEditing(w);
    setCode(w.code);
    setName(w.name);
    setType(w.type);
    setBranchId(w.branchId ? String(w.branchId) : "");
    setProjectId(w.projectId ? String(w.projectId) : "");
    setManagerName(w.managerName ?? "");
    setAddress(w.address ?? "");
    setIsDefault(w.isDefault);
    setIsActive(w.isActive);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!code.trim() || !name.trim()) {
      setFormError("Code and Name are required.");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/pos/warehouses/${editing.id}`
        : "/api/pos/warehouses";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          type,
          branch_id: branchId ? Number(branchId) : null,
          project_id: PROJECT_TYPES.has(type) && projectId ? Number(projectId) : null,
          manager_name: managerName.trim() || null,
          address: address.trim() || null,
          is_default: isDefault,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save warehouse.");
        return;
      }
      setModalOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pos/warehouses/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const header = ["Code", "Name", "Type", "Branch", "Project", "Manager", "Default", "Status"];
    const rows = warehouses.map((w) => [
      w.code,
      `"${w.name.replace(/"/g, '""')}"`,
      WAREHOUSE_TYPE_LABELS[w.type] ?? w.type,
      `"${(w.branchName || "").replace(/"/g, '""')}"`,
      `"${(w.projectName || "").replace(/"/g, '""')}"`,
      `"${(w.managerName || "").replace(/"/g, '""')}"`,
      w.isDefault ? "Yes" : "No",
      w.isActive ? "Active" : "Inactive",
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "warehouses.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-warehouse"
        title="Warehouses"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Point of Sale" },
          { label: "Warehouses" },
        ]}
        actions={
          <>
            <button type="button" className="btn btn-erp-ghost" onClick={exportCsv}>
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <button type="button" className="btn btn-erp" onClick={openCreate}>
              <i className="fa-solid fa-plus me-2"></i>New Warehouse
            </button>
          </>
        }
      />

      <div className="erp-card mt-3">
        <div className="erp-card-head">
          <div>
            <h2>What each warehouse is holding</h2>
            <p>Item-wise available quantity, one store at a time.</p>
          </div>
        </div>
        <div className="erp-card-body">
          {warehouses.length === 0 ? (
            <ErpEmptyState
              icon="fa-solid fa-warehouse"
              title="No warehouses yet"
              description="Add a warehouse and receive stock into it, and its composition appears here."
            />
          ) : (
            <div className="d-flex flex-wrap gap-3">
              {warehouses.map((w) => (
                <div
                  key={w.id}
                  className="p-3"
                  style={{
                    border: "1px solid var(--erp-line)",
                    borderRadius: 10,
                    minWidth: 220,
                    background: "#fff",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong style={{ fontSize: 13.5 }}>{w.name}</strong>
                    <ErpPill tone="neutral">{w.code}</ErpPill>
                  </div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {WAREHOUSE_TYPE_LABELS[w.type] ?? w.type}
                    {w.projectName ? ` · ${w.projectName}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="erp-card">
        {warehouses.length === 0 ? (
          <ErpEmptyState
            icon="fa-solid fa-warehouse"
            title="No warehouses yet"
            description="Add the locations that hold stock — a central store, a project store, a site yard. The first one becomes the default."
          />
        ) : (
          <div className="erp-table-wrap">
            <table className="table erp-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Warehouse</th>
                  <th>Type</th>
                  <th>Branch / Project</th>
                  <th>Store Manager</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w) => (
                  <tr key={w.id}>
                    <td className="erp-cell-strong">{w.code}</td>
                    <td>
                      <span className="erp-cell-strong">{w.name}</span>
                      {w.isDefault && (
                        <ErpPill tone="sold" className="ms-1">
                          Default
                        </ErpPill>
                      )}
                      {w.address && (
                        <span className="erp-identity-meta d-block">{w.address}</span>
                      )}
                    </td>
                    <td>
                      <ErpPill tone="booked">
                        {WAREHOUSE_TYPE_LABELS[w.type] ?? w.type}
                      </ErpPill>
                    </td>
                    <td>
                      {[w.branchName, w.projectName].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td>{w.managerName || "—"}</td>
                    <td>
                      <ErpPill tone={w.isActive ? "available" : "neutral"}>
                        {w.isActive ? "Active" : "Inactive"}
                      </ErpPill>
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        title="Edit"
                        onClick={() => openEdit(w)}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm text-danger"
                        title="Delete"
                        onClick={() => setDeleteTarget(w)}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <form
                className="modal-content erp-form"
                style={{ border: "none", borderRadius: 14 }}
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="modal-body p-4">
                  <h5 className="mb-3" style={{ fontSize: 16, fontWeight: 600 }}>
                    {editing ? "Edit warehouse" : "New warehouse"}
                  </h5>
                  {formError && (
                    <div
                      className="alert alert-danger py-2 px-3 mb-3"
                      role="alert"
                      style={{ borderRadius: 9, fontSize: "12.5px" }}
                    >
                      {formError}
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label className="form-label">
                          Code <span className="erp-required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control text-uppercase"
                          maxLength={30}
                          placeholder="WH-MAIN"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div className="erp-field">
                        <label className="form-label">
                          Name <span className="erp-required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={150}
                          placeholder="Main Warehouse"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">
                          Type <span className="erp-required">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          required
                        >
                          <optgroup label="Company">
                            <option value="central">Central Warehouse</option>
                            <option value="regional">Regional Warehouse</option>
                          </optgroup>
                          <optgroup label="Project">
                            <option value="project">Project Store</option>
                            <option value="site">Site Store</option>
                            <option value="yard">Open Yard</option>
                            <option value="subcontractor">Subcontractor Store</option>
                          </optgroup>
                          <optgroup label="Retail">
                            <option value="store">Retail Store / Outlet</option>
                            <option value="van">Van / Mobile</option>
                          </optgroup>
                        </select>
                        <span className="erp-help">
                          {WAREHOUSE_TYPE_HINTS[type] ?? ""}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Branch</label>
                        <select
                          className="form-select"
                          value={branchId}
                          onChange={(e) => setBranchId(e.target.value)}
                        >
                          <option value="">— None —</option>
                          {branches.map((b) => (
                            <option key={b.id} value={String(b.id)}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {PROJECT_TYPES.has(type) && (
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">
                            Project <span className="erp-required">*</span>
                          </label>
                          <select
                            className="form-select"
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                          >
                            <option value="">— None —</option>
                            {projects.map((p) => (
                              <option key={p.id} value={String(p.id)}>
                                {p.name} ({p.code})
                              </option>
                            ))}
                          </select>
                          <span className="erp-help">
                            Stock here is costed against this project.
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Store Manager</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={150}
                          placeholder="e.g. Arif Mahmud"
                          value={managerName}
                          onChange={(e) => setManagerName(e.target.value)}
                        />
                        <span className="erp-help">Accountable for what is in this store.</span>
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="erp-field">
                        <label className="form-label">Address</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={255}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <label className="erp-check mt-1">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                    />
                    <span>Default warehouse (stock lands here unless told otherwise)</span>
                  </label>
                  <label className="erp-check">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>Active</span>
                  </label>
                </div>

                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" disabled={saving}>
                    <i className="fa-solid fa-floppy-disk me-2"></i>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete warehouse?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> will be deleted permanently.
            </>
          )
        }
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
