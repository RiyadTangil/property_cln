"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpContextBanner, ErpDeleteModal, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export interface EstimateTemplateRow {
  id: number;
  name: string;
  estimateStage: string;
  currency: string;
  rateDate: string | null;
  isDefault: boolean;
  status: string;
  version: number;
  itemCount: number;
  projectType: { id: number; name: string } | null;
  projectCategory: { id: number; name: string } | null;
  cbsTemplate: { id: number; name: string } | null;
  wbsTemplate: { id: number; name: string } | null;
}

export function EstimateTemplatesClient({
  templates: initial,
  cbsTemplates,
  wbsTemplates,
  types,
  categories,
}: {
  templates: EstimateTemplateRow[];
  cbsTemplates: { id: number; name: string }[];
  wbsTemplates: { id: number; name: string }[];
  types: { id: number; name: string }[];
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EstimateTemplateRow | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [estimateStage, setEstimateStage] = useState("control_budget");
  const [cbsTemplateId, setCbsTemplateId] = useState("");
  const [wbsTemplateId, setWbsTemplateId] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [rateDate, setRateDate] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [projectCategoryId, setProjectCategoryId] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/projects/estimate-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          estimate_stage: estimateStage,
          cbs_template_id: cbsTemplateId ? Number(cbsTemplateId) : null,
          wbs_template_id: wbsTemplateId ? Number(wbsTemplateId) : null,
          currency,
          rate_date: rateDate || null,
          project_type_id: projectTypeId ? Number(projectTypeId) : null,
          project_category_id: projectCategoryId ? Number(projectCategoryId) : null,
          is_default: isDefault,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setTemplates((prev) => [...prev, { ...d.template, projectType: null, projectCategory: null, cbsTemplate: null, wbsTemplate: null }]);
        setName("");
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
      const res = await fetch(`/api/projects/estimate-templates/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((x) => x.id !== deleteTarget.id));
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
        icon="fa-solid fa-calculator"
        title="Estimate Templates"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Projects", href: "/projects/projects" }, { label: "Estimate Templates" }]}
        actions={
          <button type="button" className="btn btn-erp" onClick={() => setModalOpen(true)}>
            <i className="fa-solid fa-plus me-2" />New Estimate Template
          </button>
        }
      />

      <ErpContextBanner
        icon="fa-solid fa-calculator"
        companyName="Parametric project estimates"
        description="Estimate templates combine CBS cost codes, WBS stages, and project parameter formulas to compute baseline budgets."
      />

      <div className="erp-card mt-3">
        <div className="erp-card-head">
          <div>
            <h2>Templates</h2>
            <p>All configured estimate templates across project types.</p>
          </div>
          <span className="erp-pill is-neutral">{templates.length}</span>
        </div>
        <div className="table-responsive">
          <table className="table erp-table mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Applies to</th>
                <th className="text-end">Lines</th>
                <th>Status</th>
                <th>Version</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/projects/projects/estimate-templates/${t.id}`} className="erp-identity-name">{t.name}</Link>
                    {t.isDefault && <span className="erp-pill is-success ms-2">In use</span>}
                  </td>
                  <td>{t.projectCategory?.name || t.projectType?.name || "All projects"}</td>
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
      </div>

      {modalOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <form className="modal-content" style={{ border: "none", borderRadius: 14 }} onSubmit={handleCreate}>
              <div className="modal-header">
                <h5 className="modal-title">New Estimate Template</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
              </div>
              <div className="modal-body">
                <div className="erp-field">
                  <label className="form-label">Name <span className="erp-required">*</span></label>
                  <input className="form-control" required maxLength={150} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="row">
                  <div className="col-6 erp-field">
                    <label className="form-label">Estimate Stage <span className="erp-required">*</span></label>
                    <select className="form-select" required value={estimateStage} onChange={(e) => setEstimateStage(e.target.value)}>
                      <option value="conceptual">Concept Estimate</option>
                      <option value="feasibility">Feasibility Estimate</option>
                      <option value="schematic">Schematic Estimate</option>
                      <option value="design_development">Design Development Estimate</option>
                      <option value="tender">Tender Estimate</option>
                      <option value="control_budget">Control Budget</option>
                    </select>
                  </div>
                  <div className="col-3 erp-field">
                    <label className="form-label">Currency</label>
                    <input className="form-control" maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
                  </div>
                  <div className="col-3 erp-field">
                    <label className="form-label">Rate Date</label>
                    <input type="date" className="form-control" value={rateDate} onChange={(e) => setRateDate(e.target.value)} />
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">CBS Template</label>
                    <select className="form-select" value={cbsTemplateId} onChange={(e) => setCbsTemplateId(e.target.value)}>
                      <option value="">Select CBS...</option>
                      {cbsTemplates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">WBS Template</label>
                    <select className="form-select" value={wbsTemplateId} onChange={(e) => setWbsTemplateId(e.target.value)}>
                      <option value="">Select WBS...</option>
                      {wbsTemplates.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
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
                <div className="erp-switch-row mt-2">
                  <div>
                    <h6>Use this one</h6>
                    <span className="erp-help">Makes this the estimate template projects at this scope receive by default.</span>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input type="checkbox" className="form-check-input" id="est_def" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}><i className="fa-solid fa-floppy-disk me-2" />Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete estimate template?"
        description={<><strong>{deleteTarget?.name ?? ""}</strong> will be removed from active use.</>}
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
