"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal, ErpEmptyState, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export interface ProjectCategoryRow {
  id: number;
  name: string;
  projectTypeId: number | null;
  projectType: { id: number; name: string } | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  isBuiltin: boolean;
  createdBy: string | null;
  _count: { projects: number };
}

export function ProjectCategoriesClient({
  categories: initial,
  types,
}: {
  categories: ProjectCategoryRow[];
  types: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editItem, setEditItem] = useState<ProjectCategoryRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectCategoryRow | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = categories.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && String(c.projectTypeId ?? "") !== typeFilter) return false;
    if (statusFilter === "active" && !c.isActive) return false;
    if (statusFilter === "inactive" && c.isActive) return false;
    return true;
  });

  function openCreate() {
    setIsCreating(true);
    setEditItem({
      id: 0,
      name: "",
      projectTypeId: null,
      projectType: null,
      description: "",
      sortOrder: 10,
      isActive: true,
      isBuiltin: false,
      createdBy: null,
      _count: { projects: 0 },
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      const payload = {
        name: editItem.name,
        project_type_id: editItem.projectTypeId,
        description: editItem.description || null,
        sort_order: editItem.sortOrder,
        is_active: editItem.isActive,
      };
      const matchedType = types.find((t) => t.id === editItem.projectTypeId) ?? null;
      if (isCreating) {
        const res = await fetch("/api/projects/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const d = await res.json();
          setCategories((prev) => [...prev, { ...d.category, projectType: matchedType, _count: { projects: 0 } }]);
          setEditItem(null);
          setIsCreating(false);
          router.refresh();
        }
      } else {
        const res = await fetch(`/api/projects/categories/${editItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setCategories((prev) =>
            prev.map((x) => (x.id === editItem.id ? { ...editItem, projectType: matchedType } : x))
          );
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
      const res = await fetch(`/api/projects/categories/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((x) => x.id !== deleteTarget.id));
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
        icon="fa-solid fa-tags"
        title="Project Categories"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Projects", href: "/projects/projects" }, { label: "Categories" }]}
        actions={
          <>
            <Link href="/projects/types" className="btn btn-erp-ghost">
              <i className="fa-solid fa-shapes me-2" />Types
            </Link>
            <button type="button" className="btn btn-erp" onClick={openCreate}>
              <i className="fa-solid fa-plus me-2" />New Category
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
                placeholder="Search categories..."
                aria-label="Search categories"
              />
            </div>
            <select className="form-select erp-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select className="form-select erp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>{filtered.length} categories</span>
        </div>

        <div className="erp-card-body is-flush">
          {filtered.length === 0 ? (
            <ErpEmptyState icon="fa-solid fa-tags" title="No project categories" description="No categories match your filter." />
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Type</th>
                    <th className="text-end">Order</th>
                    <th className="text-end">Projects</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="erp-identity">
                          <span className="erp-initials"><i className="fa-solid fa-tag" /></span>
                          <span>
                            <span className="erp-identity-name">
                              {c.name}
                              {c.isBuiltin && <span className="erp-pill is-neutral ms-1">Built in</span>}
                            </span>
                            {c.description && <span className="erp-identity-meta">{c.description}</span>}
                          </span>
                        </div>
                      </td>
                      <td>{c.projectType?.name || "Any"}</td>
                      <td className="text-end erp-cell-strong">{c.sortOrder}</td>
                      <td className="text-end erp-cell-strong">{c._count.projects}</td>
                      <td>
                        <span className={`erp-pill ${c.isActive ? "is-available" : "is-neutral"}`}>
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td><span className="erp-cell-strong">{c.createdBy || "—"}</span></td>
                      <td className="text-end text-nowrap">
                        <button type="button" className="btn btn-erp-ghost btn-sm" title="Edit" onClick={() => { setIsCreating(false); setEditItem({ ...c }); }}>
                          <i className="fa-solid fa-pen" />
                        </button>
                        {c.isBuiltin ? (
                          <span className="text-muted ms-2" style={{ fontSize: 12 }}>Locked</span>
                        ) : (
                          <button type="button" className="btn btn-erp-ghost btn-sm text-danger" title="Delete" onClick={() => setDeleteTarget(c)}>
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
            <form className="modal-content" style={{ border: "none", borderRadius: 14 }} onSubmit={handleSaveEdit}>
              <div className="modal-header">
                <h5 className="modal-title">{isCreating ? "New Category" : `Edit ${editItem.name}`}</h5>
                <button type="button" className="btn-close" onClick={() => { setEditItem(null); setIsCreating(false); }} />
              </div>
              <div className="modal-body">
                <div className="erp-field">
                  <label className="form-label">Name <span className="erp-required">*</span></label>
                  <input className="form-control" required maxLength={80} value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
                </div>
                <div className="erp-field">
                  <label className="form-label">Project Type</label>
                  <select
                    className="form-select"
                    value={editItem.projectTypeId ?? ""}
                    onChange={(e) => setEditItem({ ...editItem, projectTypeId: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">Any type</option>
                    {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="erp-field">
                  <label className="form-label">Description</label>
                  <input className="form-control" maxLength={255} value={editItem.description ?? ""} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} />
                </div>
                <div className="erp-field">
                  <label className="form-label">Display Order</label>
                  <input type="number" className="form-control" value={editItem.sortOrder} onChange={(e) => setEditItem({ ...editItem, sortOrder: Number(e.target.value) || 10 })} />
                </div>
                <div className="erp-switch-row mt-2">
                  <div>
                    <h6>Active</h6>
                    <span className="erp-help">Inactive categories stay on existing projects but drop out of the picker.</span>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input type="checkbox" className="form-check-input" checked={editItem.isActive} onChange={(e) => setEditItem({ ...editItem, isActive: e.target.checked })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => { setEditItem(null); setIsCreating(false); }}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={saving}>{saving ? "Saving..." : isCreating ? "Create Category" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete project category?"
        description={<><strong>{deleteTarget?.name ?? ""}</strong> will be removed from active use.</>}
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
