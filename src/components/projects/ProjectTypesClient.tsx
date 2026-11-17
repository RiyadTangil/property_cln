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

const PILL_CHOICES = [
  { value: "is-booked", label: "Blue" },
  { value: "is-available", label: "Green" },
  { value: "is-hold", label: "Amber" },
  { value: "is-sold", label: "Purple" },
  { value: "is-overdue", label: "Red" },
  { value: "is-neutral", label: "Grey" },
];

export function ProjectTypesClient({ types: initial }: { types: ProjectTypeRow[] }) {
  const router = useRouter();
  const [types, setTypes] = useState(initial);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editItem, setEditItem] = useState<ProjectTypeRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectTypeRow | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = types.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (status === "active" && !t.isActive) return false;
    if (status === "inactive" && t.isActive) return false;
    return true;
  });

  function openCreate() {
    setIsCreating(true);
    setEditItem({
      id: 0,
      name: "",
      description: "",
      icon: "fa-solid fa-city",
      pill: "is-neutral",
      sortOrder: 10,
      isActive: true,
      isBuiltin: false,
      createdBy: null,
      _count: { categories: 0, projects: 0 },
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      const payload = {
        name: editItem.name,
        description: editItem.description || null,
        icon: editItem.icon || "fa-solid fa-city",
        pill: editItem.pill || "is-neutral",
        sort_order: editItem.sortOrder,
        is_active: editItem.isActive,
      };
      if (isCreating) {
        const res = await fetch("/api/projects/types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const d = await res.json();
          setTypes((prev) => [...prev, { ...d.projectType, _count: { categories: 0, projects: 0 } }]);
          setEditItem(null);
          setIsCreating(false);
          router.refresh();
        }
      } else {
        const res = await fetch(`/api/projects/types/${editItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setTypes((prev) => prev.map((x) => (x.id === editItem.id ? editItem : x)));
          setEditItem(null);
          router.refresh();
        }
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
            <button type="button" className="btn btn-erp" onClick={openCreate}>
              <i className="fa-solid fa-plus me-2" />New Type
            </button>
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
                          onClick={() => { setIsCreating(false); setEditItem({ ...t }); }}
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
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <form className="modal-content" style={{ border: "none", borderRadius: 14 }} onSubmit={handleSaveEdit}>
              <div className="modal-header">
                <h5 className="modal-title">{isCreating ? "New Project Type" : `Edit ${editItem.name}`}</h5>
                <button type="button" className="btn-close" onClick={() => { setEditItem(null); setIsCreating(false); }} />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-8 erp-field">
                    <label className="form-label">Name <span className="erp-required">*</span></label>
                    <input className="form-control" required maxLength={80} value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
                  </div>
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Display Order</label>
                    <input type="number" className="form-control" value={editItem.sortOrder} onChange={(e) => setEditItem({ ...editItem, sortOrder: Number(e.target.value) || 10 })} />
                  </div>
                  <div className="col-12 erp-field">
                    <label className="form-label">Description</label>
                    <input className="form-control" maxLength={255} value={editItem.description ?? ""} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} />
                  </div>
                  <div className="col-md-6 erp-field">
                    <label className="form-label">Icon</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className={editItem.icon || "fa-solid fa-city"} /></span>
                      <input className="form-control" maxLength={60} value={editItem.icon} onChange={(e) => setEditItem({ ...editItem, icon: e.target.value })} />
                    </div>
                  </div>
                  <div className="col-md-6 erp-field">
                    <label className="form-label">Colour</label>
                    <div className="erp-pill-choices">
                      {PILL_CHOICES.map((c) => (
                        <label key={c.value} className="erp-pill-choice">
                          <input type="radio" name="pill" value={c.value} checked={editItem.pill === c.value} onChange={() => setEditItem({ ...editItem, pill: c.value })} />
                          <span className={`erp-pill ${c.value}`}>{c.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="erp-switch-row mt-2">
                  <div>
                    <h6>Active</h6>
                    <span className="erp-help">Inactive types stay on existing projects but drop out of the picker.</span>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input type="checkbox" className="form-check-input" checked={editItem.isActive} onChange={(e) => setEditItem({ ...editItem, isActive: e.target.checked })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => { setEditItem(null); setIsCreating(false); }}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={saving}>{saving ? "Saving..." : isCreating ? "Create Type" : "Save Changes"}</button>
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
