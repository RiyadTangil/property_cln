"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpContextBanner, ErpDeleteModal, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export interface ProjectParamRow {
  id: number;
  key: string;
  label: string;
  helpText: string | null;
  group: string;
  unit: string | null;
  dataType: string;
  minValue: number | null;
  maxValue: number | null;
  defaultValue: number | null;
  appliesTo: string | null;
  isRequired: boolean;
  isActive: boolean;
  usedByCount: number;
}

const PARAM_GROUPS = [
  "LAND & PLANNING",
  "BUILDING",
  "RESIDENTIAL",
  "STRUCTURAL",
  "MEP",
  "ARCHITECTURAL / FINISHES",
  "COMMERCIAL",
  "INDUSTRIAL",
  "HOTEL",
  "EDUCATIONAL / INSTITUTIONAL",
  "LAND DEVELOPMENT",
  "INFRASTRUCTURE",
  "RENOVATION",
  "FINANCIAL",
];

export function ProjectParametersClient({
  parameters: initial,
  types,
  categories,
}: {
  parameters: ProjectParamRow[];
  types: { id: number; name: string }[];
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [params, setParams] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectParamRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectParamRow | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    key: "",
    label: "",
    help_text: "",
    group: "LAND & PLANNING",
    unit: "",
    data_type: "decimal",
    min_value: "",
    max_value: "",
    default_value: "",
    project_type_id: "",
    project_category_id: "",
    is_required: false,
    is_active: true,
  });

  // Group parameters preserving order
  const groups: { name: string; items: ProjectParamRow[] }[] = [];
  const groupMap = new Map<string, ProjectParamRow[]>();
  for (const p of params) {
    const g = p.group || "GENERAL";
    if (!groupMap.has(g)) {
      const arr: ProjectParamRow[] = [];
      groupMap.set(g, arr);
      groups.push({ name: g, items: arr });
    }
    groupMap.get(g)!.push(p);
  }

  function openNew() {
    setEditing(null);
    setForm({
      key: "",
      label: "",
      help_text: "",
      group: "LAND & PLANNING",
      unit: "",
      data_type: "decimal",
      min_value: "",
      max_value: "",
      default_value: "",
      project_type_id: "",
      project_category_id: "",
      is_required: false,
      is_active: true,
    });
    setModalOpen(true);
  }

  function openEdit(p: ProjectParamRow) {
    setEditing(p);
    setForm({
      key: p.key,
      label: p.label,
      help_text: p.helpText || "",
      group: p.group,
      unit: p.unit || "",
      data_type: p.dataType,
      min_value: p.minValue !== null ? String(p.minValue) : "",
      max_value: p.maxValue !== null ? String(p.maxValue) : "",
      default_value: p.defaultValue !== null ? String(p.defaultValue) : "",
      project_type_id: "",
      project_category_id: "",
      is_required: p.isRequired,
      is_active: p.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        min_value: form.min_value ? Number(form.min_value) : null,
        max_value: form.max_value ? Number(form.max_value) : null,
        default_value: form.default_value ? Number(form.default_value) : null,
        project_type_id: form.project_type_id ? Number(form.project_type_id) : null,
        project_category_id: form.project_category_id ? Number(form.project_category_id) : null,
      };
      if (editing) {
        const res = await fetch(`/api/projects/parameters/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const d = await res.json();
          setParams((prev) => prev.map((x) => (x.id === editing.id ? d.parameter : x)));
          setModalOpen(false);
          router.refresh();
        }
      } else {
        const res = await fetch("/api/projects/parameters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const d = await res.json();
          setParams((prev) => [...prev, d.parameter]);
          setModalOpen(false);
          router.refresh();
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/parameters/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setParams((prev) => prev.filter((x) => x.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon="fa-solid fa-ruler-combined"
        title="Project Parameters"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Projects", href: "/projects/projects" }, { label: "Project Parameters" }]}
        actions={
          <button type="button" className="btn btn-erp" onClick={openNew}>
            <i className="fa-solid fa-plus me-2" />New Parameter
          </button>
        }
      />

      <ErpContextBanner
        icon="fa-solid fa-square-root-variable"
        companyName="These are the numbers estimate formulas are written against"
        description="A project answers them once during setup, then a template line like built_up_area * 0.12 works out its own quantity."
      />

      <div className="erp-card mt-3">
        <div className="erp-card-head">
          <div>
            <h2>Parameters</h2>
            <p>Asked of every project whose type or category they apply to.</p>
          </div>
          <span className="erp-pill is-neutral">{params.length}</span>
        </div>

        <div className="table-responsive">
          <table className="table erp-table mb-0">
            <thead>
              <tr>
                <th>Name in formulas</th>
                <th>Label</th>
                <th>Unit</th>
                <th>Type</th>
                <th>Range</th>
                <th>Applies to</th>
                <th className="text-center">Required</th>
                <th className="text-end">Used by</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((grp) => (
                <>
                  <tr key={`grp-${grp.name}`} className="erp-param-group">
                    <td colSpan={9}>
                      {grp.name} <span className="erp-param-group-count">{grp.items.length}</span>
                    </td>
                  </tr>
                  {grp.items.map((p) => (
                    <tr key={p.id}>
                      <td><code>{p.key}</code></td>
                      <td>
                        {p.label}
                        {p.helpText && <span className="erp-identity-meta d-block">{p.helpText}</span>}
                      </td>
                      <td>{p.unit || "—"}</td>
                      <td>{p.dataType === "integer" ? "Whole number" : "Decimal"}</td>
                      <td className="small">
                        {p.minValue !== null && p.maxValue !== null ? `Between ${p.minValue} and ${p.maxValue}` : "—"}
                      </td>
                      <td>{p.appliesTo || "All project types"}</td>
                      <td className="text-center">
                        {p.isRequired ? <i className="fa-solid fa-circle-check" style={{ color: "var(--erp-primary)" }} /> : "—"}
                      </td>
                      <td className="text-end">{p.usedByCount} projects</td>
                      <td className="text-end text-nowrap">
                        <button type="button" className="btn btn-sm btn-erp-ghost" onClick={() => openEdit(p)}>
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button type="button" className="btn btn-sm btn-erp-ghost text-danger" onClick={() => setDeleteTarget(p)}>
                          <i className="fa-solid fa-trash-can" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <form className="modal-content" onSubmit={handleSave}>
              <div className="modal-header">
                <h5 className="modal-title">{editing ? "Edit Parameter" : "New Parameter"}</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Formula Key <span className="erp-required">*</span></label>
                    <input className="form-control" required maxLength={40} value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
                  </div>
                  <div className="col-md-8 erp-field">
                    <label className="form-label">Label <span className="erp-required">*</span></label>
                    <input className="form-control" required maxLength={120} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                  </div>
                  <div className="col-12 erp-field">
                    <label className="form-label">Help Text</label>
                    <input className="form-control" maxLength={255} value={form.help_text} onChange={(e) => setForm({ ...form, help_text: e.target.value })} />
                  </div>
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Group</label>
                    <select className="form-select" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
                      {PARAM_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Unit</label>
                    <input className="form-control" maxLength={20} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                  </div>
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Data Type <span className="erp-required">*</span></label>
                    <select className="form-select" required value={form.data_type} onChange={(e) => setForm({ ...form, data_type: e.target.value })}>
                      <option value="integer">Whole number</option>
                      <option value="decimal">Decimal</option>
                    </select>
                  </div>
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Min Value</label>
                    <input type="number" step="0.01" className="form-control" value={form.min_value} onChange={(e) => setForm({ ...form, min_value: e.target.value })} />
                  </div>
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Max Value</label>
                    <input type="number" step="0.01" className="form-control" value={form.max_value} onChange={(e) => setForm({ ...form, max_value: e.target.value })} />
                  </div>
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Default Value</label>
                    <input type="number" step="0.01" className="form-control" value={form.default_value} onChange={(e) => setForm({ ...form, default_value: e.target.value })} />
                  </div>
                  <div className="col-md-6 erp-field">
                    <label className="form-label">Project Type</label>
                    <select className="form-select" value={form.project_type_id} onChange={(e) => setForm({ ...form, project_type_id: e.target.value })}>
                      <option value="">Every type</option>
                      {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6 erp-field">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.project_category_id} onChange={(e) => setForm({ ...form, project_category_id: e.target.value })}>
                      <option value="">Every category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="d-flex gap-4">
                  <div className="form-check form-switch">
                    <input type="checkbox" className="form-check-input" id="prm_req" checked={form.is_required} onChange={(e) => setForm({ ...form, is_required: e.target.checked })} />
                    <label htmlFor="prm_req" className="form-check-label">Required</label>
                  </div>
                  <div className="form-check form-switch">
                    <input type="checkbox" className="form-check-input" id="prm_act" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                    <label htmlFor="prm_act" className="form-check-label">Active</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Save Parameter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete parameter?"
        description={<><strong>{deleteTarget?.label ?? ""}</strong> will be removed from active use.</>}
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
