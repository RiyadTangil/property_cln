"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal, ErpEmptyState, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export interface ProjectTypeRow {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  pill: string;
  sortOrder: number;
  isActive: boolean;
  isBuiltin: boolean;
  createdBy: string | null;
  _count: { categories: number; projects: number };
}

export function ProjectTypesClient({ types: initial }: { types: ProjectTypeRow[] }) {
  const router = useRouter();
  const [types, setTypes] = useState(initial);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editItem, setEditItem] = useState<ProjectTypeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectTypeRow | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = types.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (status === "active" && !t.isActive) return false;
    if (status === "inactive" && t.isActive) return false;
    return true;
  });

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/types/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editItem.name,
          description: editItem.description,
          icon: editItem.icon,
          pill: editItem.pill,
          sort_order: editItem.sortOrder,
          is_active: editItem.isActive,
        }),
      });
      if (res.ok) {
        setTypes((prev) => prev.map((x) => (x.id === editItem.id ? editItem : x)));
        setEditItem(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/types/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setTypes((prev) => prev.filter((x) => x.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon="fa-solid fa-city"
        title="Project Types"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Projects", href: "/projects/projects" }, { label: "Types" }]}
        actions={
          <>
            <Link href="/projects/categories" className="btn btn-erp-ghost">
              <i className="fa-solid fa-tags me-2" />Categories
            </Link>
            <Link href="/projects/types/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2" />New Type
            </Link>
          </>
        }
      />

      <div className="erp-card">
        <div className="erp-toolbar">
          <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search project types..."
                aria-label="Search project types"
              />
            </div>
            <select className="form-select erp-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>{filtered.length} types</span>
        </div>

        <div className="erp-card-body is-flush">
          {filtered.length === 0 ? (
            <ErpEmptyState icon="fa-solid fa-shapes" title="No project types" description="No project types match your filter." />
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Preview</th>
                    <th className="text-end">Order</th>
                    <th className="text-end">Categories</th>
                    <th className="text-end">Projects</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="erp-identity">
                          <span className="erp-initials"><i className={t.icon} /></span>
                          <span>
                            <span className="erp-identity-name">
                              {t.name}
                              {t.isBuiltin && <span className="erp-pill is-neutral ms-1">Built in</span>}
                            </span>
                            {t.description && <span className="erp-identity-meta">{t.description}</span>}
                          </span>
                        </div>
                      </td>
                      <td><span className={`erp-pill ${t.pill}`}>{t.name}</span></td>
                      <td className="text-end erp-cell-strong">{t.sortOrder}</td>
                      <td className="text-end erp-cell-strong">{t._count.categories}</td>
                      <td className="text-end erp-cell-strong">{t._count.projects}</td>
                      <td>
                        <span className={`erp-pill ${t.isActive ? "is-available" : "is-neutral"}`}>
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <span className="erp-created-by">
                          <span className="erp-cell-strong">{t.createdBy || "—"}</span>
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm"
                          title="Edit"
                          onClick={() => setEditItem({ ...t })}
                        >
                          <i className="fa-solid fa-pen" />
                        </button>
                        {t.isBuiltin ? (
                          <span className="text-muted ms-2" style={{ fontSize: 12 }} title="Built-in types cannot be deleted">
                            Locked
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(t)}
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editItem && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleSaveEdit}>
              <div className="modal-header">
                <h5 className="modal-title">Edit {editItem.name}</h5>
                <button type="button" className="btn-close" onClick={() => setEditItem(null)} />
              </div>
              <div className="modal-body">
                <div className="erp-field">
                  <label className="form-label">Name <span className="erp-required">*</span></label>
                  <input
                    className="form-control"
                    required
                    maxLength={80}
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  />
                </div>
                <div className="erp-field">
                  <label className="form-label">Description</label>
                  <input
                    className="form-control"
                    maxLength={255}
                    value={editItem.description ?? ""}
                    onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  />
                </div>
                <div className="row">
                  <div className="col-6 erp-field">
                    <label className="form-label">Icon</label>
                    <input
                      className="form-control"
                      maxLength={60}
                      value={editItem.icon}
                      onChange={(e) => setEditItem({ ...editItem, icon: e.target.value })}
                    />
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Display Order</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editItem.sortOrder}
                      onChange={(e) => setEditItem({ ...editItem, sortOrder: Number(e.target.value) || 10 })}
                    />
                  </div>
                </div>
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={editItem.isActive}
                    onChange={(e) => setEditItem({ ...editItem, isActive: e.target.checked })}
                  />
                  <label className="form-check-label">Active</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setEditItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete project type?"
        description={<><strong>{deleteTarget?.name ?? ""}</strong> will be removed from active use.</>}
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
