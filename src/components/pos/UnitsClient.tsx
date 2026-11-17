"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpPageHeader,
  ErpPill,
} from "@/components/ui";

export interface UnitRow {
  id: number;
  code: string;
  name: string;
  isBase: boolean;
  baseUnitId: number | null;
  baseUnitCode: string | null;
  factor: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
}

export default function UnitsClient({
  units,
  baseUnits,
}: {
  units: UnitRow[];
  baseUnits: { id: number; code: string; name: string }[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UnitRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnitRow | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isBase, setIsBase] = useState(true);
  const [baseUnitId, setBaseUnitId] = useState("");
  const [factor, setFactor] = useState("1");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setCode("");
    setName("");
    setIsBase(true);
    setBaseUnitId("");
    setFactor("1");
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(u: UnitRow) {
    setEditing(u);
    setCode(u.code);
    setName(u.name);
    setIsBase(u.isBase);
    setBaseUnitId(u.baseUnitId ? String(u.baseUnitId) : "");
    setFactor(String(u.factor || 1));
    setIsActive(u.isActive);
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
    if (!isBase && !baseUnitId) {
      setFormError("Choose a base unit to convert to.");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/pos/units/${editing.id}` : "/api/pos/units";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          is_base: isBase,
          base_unit_id: isBase ? null : Number(baseUnitId),
          factor: isBase ? 1 : Number(factor) || 1,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save unit.");
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
      const res = await fetch(`/api/pos/units/${deleteTarget.id}`, {
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
    const header = ["Code", "Name", "Conversion", "Status"];
    const rows = units.map((u) => [
      u.code,
      `"${u.name.replace(/"/g, '""')}"`,
      u.isBase ? "Base unit" : `${u.factor} × ${u.baseUnitCode ?? ""}`,
      u.isActive ? "Active" : "Inactive",
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "units-of-measure.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-ruler-combined"
        title="Units of Measure"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Point of Sale" },
          { label: "Units of Measure" },
        ]}
        actions={
          <>
            <button type="button" className="btn btn-erp-ghost" onClick={exportCsv}>
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <button type="button" className="btn btn-erp" onClick={openCreate}>
              <i className="fa-solid fa-plus me-2"></i>New Unit
            </button>
          </>
        }
      />

      <div className="erp-card">
        <div className="erp-card-head">
          <div>
            <h2>Units</h2>
            <p>
              How your products are counted — pieces, boxes, kilograms — and how the bigger ones
              convert to the smaller.
            </p>
          </div>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {units.length} {units.length === 1 ? "unit" : "units"}
          </span>
        </div>

        <div className="erp-card-body is-flush">
          {units.length === 0 ? (
            <ErpEmptyState
              icon="fa-solid fa-ruler-combined"
              title="No units yet"
              description="Define base units and conversion factors."
            />
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Conversion</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => (
                    <tr key={u.id}>
                      <td className="erp-cell-strong">{u.code}</td>
                      <td>{u.name}</td>
                      <td>
                        {u.isBase
                          ? "Base unit"
                          : `${Number(u.factor)} × ${u.baseUnitCode ?? "—"}`}
                      </td>
                      <td>
                        <ErpPill tone={u.isActive ? "available" : "neutral"}>
                          {u.isActive ? "Active" : "Inactive"}
                        </ErpPill>
                      </td>
                      <td>
                        <span className="erp-created-by">
                          <span className="erp-cell-strong">{u.createdBy || "—"}</span>
                          <span className="erp-identity-meta d-block">{u.createdAt}</span>
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm"
                          title="Edit"
                          onClick={() => openEdit(u)}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(u)}
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
      </div>

      {modalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <form
                className="modal-content erp-form"
                style={{ border: "none", borderRadius: 14 }}
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="modal-body p-4">
                  <h5 className="mb-3" style={{ fontSize: 16, fontWeight: 600 }}>
                    {editing ? "Edit unit" : "New unit"}
                  </h5>
                  {formError && (
                    <div
                      className="alert alert-danger py-2"
                      role="alert"
                      style={{ borderRadius: 10, fontSize: "12.5px" }}
                    >
                      <i className="fa-solid fa-circle-exclamation me-1"></i>
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
                          maxLength={20}
                          placeholder="PCS"
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
                          maxLength={80}
                          placeholder="Pieces"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <label className="erp-check">
                    <input
                      type="checkbox"
                      checked={isBase}
                      onChange={(e) => setIsBase(e.target.checked)}
                    />
                    <span>This is a base unit</span>
                  </label>

                  {!isBase && (
                    <div className="row mt-2">
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">
                            Converts To <span className="erp-required">*</span>
                          </label>
                          <select
                            className="form-select"
                            value={baseUnitId}
                            onChange={(e) => setBaseUnitId(e.target.value)}
                          >
                            <option value="">Choose a base unit…</option>
                            {baseUnits.map((b) => (
                              <option key={b.id} value={String(b.id)}>
                                {b.code} — {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">
                            Factor <span className="erp-required">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            min="0.000001"
                            className="form-control"
                            value={factor}
                            onChange={(e) => setFactor(e.target.value)}
                          />
                          <span className="erp-help">
                            How many base units one of these holds. A box of 12 is 12.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <label className="erp-check mt-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>Active</span>
                  </label>
                </div>

                <div className="modal-footer" style={{ borderTop: "1px solid var(--erp-line)" }}>
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
        title="Delete unit?"
        description={
          deleteTarget && (
            <>
              <strong>
                {deleteTarget.code} — {deleteTarget.name}
              </strong>{" "}
              will be deleted permanently.
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
