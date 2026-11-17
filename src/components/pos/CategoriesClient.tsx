"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpPageHeader,
  ErpPill,
} from "@/components/ui";

export interface CategoryRow {
  id: number;
  code: string;
  name: string;
  parentId: number | null;
  parentName: string | null;
  productsCount: number;
  description: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
}

export default function CategoriesClient({
  categories,
}: {
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setCode("");
    setName("");
    setParentId("");
    setDescription("");
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(c: CategoryRow) {
    setEditing(c);
    setCode(c.code);
    setName(c.name);
    setParentId(c.parentId ? String(c.parentId) : "");
    setDescription(c.description ?? "");
    setIsActive(c.isActive);
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
        ? `/api/pos/categories/${editing.id}`
        : "/api/pos/categories";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          parent_id: parentId ? Number(parentId) : null,
          description: description.trim() || null,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save category.");
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
      const res = await fetch(`/api/pos/categories/${deleteTarget.id}`, {
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
    const header = ["Code", "Name", "Parent", "Products", "Status"];
    const rows = categories.map((c) => [
      c.code,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.parentName || "").replace(/"/g, '""')}"`,
      String(c.productsCount),
      c.isActive ? "Active" : "Inactive",
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product-categories.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-sitemap"
        title="Product Categories"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Point of Sale" },
          { label: "Categories" },
        ]}
        actions={
          <>
            <button type="button" className="btn btn-erp-ghost" onClick={exportCsv}>
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <button type="button" className="btn btn-erp" onClick={openCreate}>
              <i className="fa-solid fa-plus me-2"></i>New Category
            </button>
          </>
        }
      />

      <div className="erp-card">
        {categories.length === 0 ? (
          <ErpEmptyState
            icon="fa-solid fa-sitemap"
            title="No categories yet"
            description="Group products and construction materials into categories."
          />
        ) : (
          <div className="erp-table-wrap">
            <table className="table erp-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Parent</th>
                  <th className="text-end">Products</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td className="erp-cell-strong">{c.code}</td>
                    <td>{c.name}</td>
                    <td>{c.parentName || "—"}</td>
                    <td className="text-end">{c.productsCount}</td>
                    <td>
                      <ErpPill tone={c.isActive ? "available" : "neutral"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </ErpPill>
                    </td>
                    <td>
                      <span className="erp-created-by">
                        <span className="erp-cell-strong">{c.createdBy || "—"}</span>
                        <span className="erp-identity-meta d-block">{c.createdAt}</span>
                      </span>
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        title="Edit"
                        onClick={() => openEdit(c)}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm text-danger"
                        title="Delete"
                        onClick={() => setDeleteTarget(c)}
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
            <div className="modal-dialog modal-dialog-centered">
              <form
                className="modal-content erp-form"
                style={{ border: "none", borderRadius: 14 }}
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="modal-body p-4">
                  <h5 className="mb-3" style={{ fontSize: 16, fontWeight: 600 }}>
                    {editing ? "Edit category" : "New category"}
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
                          placeholder="BEV"
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
                          placeholder="Beverages"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="erp-field">
                        <label className="form-label">Parent Category</label>
                        <select
                          className="form-select"
                          value={parentId}
                          onChange={(e) => setParentId(e.target.value)}
                        >
                          <option value="">— Top level —</option>
                          {categories
                            .filter((cat) => !editing || cat.id !== editing.id)
                            .map((cat) => (
                              <option key={cat.id} value={String(cat.id)}>
                                {cat.parentName ? `${cat.parentName} › ${cat.name}` : cat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="erp-field">
                        <label className="form-label">Description</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={1000}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <label className="erp-check mt-1">
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
        title="Delete category?"
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
