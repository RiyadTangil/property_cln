"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpContextBanner, ErpDeleteModal, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export interface BreakdownTemplateRow {
  id: number;
  name: string;
  description: string | null;
  projectTypeId: number | null;
  projectCategoryId: number | null;
  projectType: { id: number; name: string } | null;
  projectCategory: { id: number; name: string } | null;
  isDefault: boolean;
  status: string;
  version: number;
  itemCount: number;
}

const CONFIG = {
  wbs: {
    title: "Work Breakdown Templates",
    crumb: "WBS Templates",
    icon: "fa-solid fa-layer-group",
    btnLabel: "New Breakdown",
    countCol: "Rows",
    apiPath: "/api/projects/wbs-templates",
    bannerTitle: "How a project picks one",
    bannerBody:
      "Its category first, then its type, then the company-wide set — the most specific published match wins.",
  },
  cbs: {
    title: "Cost Breakdown Templates",
    crumb: "CBS Templates",
    icon: "fa-solid fa-sitemap",
    btnLabel: "New Cost Breakdown",
    countCol: "Codes",
    apiPath: "/api/projects/cbs-templates",
    bannerTitle: "How a project picks one",
    bannerBody:
      "Its category first, then its type, then the company-wide set — the most specific published match wins.",
  },
  itp: {
    title: "Inspection Plans (ITP)",
    crumb: "Inspection Plans (ITP)",
    icon: "fa-solid fa-clipboard-check",
    btnLabel: "New Inspection Plan",
    countCol: "Points",
    apiPath: "/api/projects/itp-templates",
    bannerTitle: "How a project picks one",
    bannerBody:
      "Its category first, then its type, then the company-wide set — inspection hold and witness points inherit automatically.",
  },
} as const;

export function BreakdownTemplatesClient({
  kind,
  templates: initial,
  types,
  categories,
}: {
  kind: "wbs" | "cbs" | "itp";
  templates: BreakdownTemplateRow[];
  types: { id: number; name: string }[];
  categories: { id: number; name: string; projectTypeId: number | null }[];
}) {
  const cfg = CONFIG[kind];
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BreakdownTemplateRow | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [projectCategoryId, setProjectCategoryId] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const byCategory = templates.filter((t) => t.projectCategoryId !== null);
  const byType = templates.filter((t) => t.projectCategoryId === null && t.projectTypeId !== null);
  const companyWide = templates.filter((t) => t.projectCategoryId === null && t.projectTypeId === null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(cfg.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          project_type_id: projectTypeId ? Number(projectTypeId) : null,
          project_category_id: projectCategoryId ? Number(projectCategoryId) : null,
          is_default: isDefault,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setTemplates((prev) => [...prev, { ...d.template, projectType: null, projectCategory: null }]);
        setName("");
        setDescription("");
        setModalOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`${cfg.apiPath}/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((x) => x.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  function renderSection(title: string, desc: string, list: BreakdownTemplateRow[]) {
    return (
      <div className="erp-card mt-3">
        <div className="erp-card-head">
          <div>
            <h2>{title}</h2>
            <p>{desc}</p>
          </div>
          <span className="erp-pill is-neutral">{list.length}</span>
        </div>
        {list.length === 0 ? (
          <div className="erp-card-body">
            <p className="erp-cv-empty mb-0">Nothing here yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table erp-table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Applies to</th>
                  <th className="text-end">{cfg.countCol}</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="erp-identity-name">{t.name}</span>
                      {t.isDefault && <span className="erp-pill is-success ms-2">In use</span>}
                      {t.description && <span className="erp-identity-meta d-block">{t.description}</span>}
                    </td>
                    <td>
                      {t.projectCategory
                        ? `Category: ${t.projectCategory.name}`
                        : t.projectType
                        ? `Type: ${t.projectType.name}`
                        : "All projects"}
                    </td>
                    <td className="text-end">{t.itemCount}</td>
                    <td><span className="erp-pill is-success text-capitalize">{t.status}</span></td>
                    <td>v{t.version}</td>
                    <td className="text-end">
                      <button type="button" className="btn btn-erp-ghost btn-sm text-danger" onClick={() => setDeleteTarget(t)}>
                        <i className="fa-solid fa-trash-can" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon={cfg.icon}
        title={cfg.title}
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Projects", href: "/projects/projects" }, { label: cfg.crumb }]}
        actions={
          <button type="button" className="btn btn-erp" onClick={() => setModalOpen(true)}>
            <i className="fa-solid fa-plus me-2" />{cfg.btnLabel}
          </button>
        }
      />

      <ErpContextBanner icon={cfg.icon} companyName={cfg.bannerTitle} description={cfg.bannerBody} />

      {renderSection("By category", "Used by projects in one category — the narrowest match, and the first one tried.", byCategory)}
      {renderSection("By project type", "Used by any project of that type with no category set of its own.", byType)}
      {renderSection("Company-wide", "Fallback used when no category or type template matches.", companyWide)}

      {modalOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleCreate}>
              <div className="modal-header">
                <h5 className="modal-title">{cfg.btnLabel}</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
              </div>
              <div className="modal-body">
                <div className="erp-field">
                  <label className="form-label">Name <span className="erp-required">*</span></label>
                  <input className="form-control" required maxLength={150} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="erp-field">
                  <label className="form-label">Description</label>
                  <input className="form-control" maxLength={255} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="row">
                  <div className="col-6 erp-field">
                    <label className="form-label">Project Type</label>
                    <select className="form-select" value={projectTypeId} onChange={(e) => setProjectTypeId(e.target.value)}>
                      <option value="">All types</option>
                      {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={projectCategoryId} onChange={(e) => setProjectCategoryId(e.target.value)}>
                      <option value="">All categories</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-check form-switch">
                  <input type="checkbox" className="form-check-input" id="is_default_tpl" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                  <label htmlFor="is_default_tpl" className="form-check-label">Set as default</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete template?"
        description={<><strong>{deleteTarget?.name ?? ""}</strong> will be removed from active use.</>}
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
