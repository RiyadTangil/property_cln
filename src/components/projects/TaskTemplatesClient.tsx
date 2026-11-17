"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal, ErpPageHeader } from "@/components/ui";
import { downloadCsv } from "@/lib/csv-client";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export interface TaskTemplateRow {
  id: number;
  parentId: number | null;
  name: string;
  category: string | null;
  estimatedCost: number;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export function TaskTemplatesClient({ rows: initial }: { rows: TaskTemplateRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskTemplateRow | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("0");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TaskTemplateRow | null>(null);
  const [busy, setBusy] = useState(false);

  const stages = rows.filter((r) => r.parentId === null);
  const childrenOf = (sid: number) => rows.filter((r) => r.parentId === sid);

  function openAdd(pid: number | null) {
    setEditing(null);
    setParentId(pid);
    setName("");
    setCategory("");
    setEstimatedCost("0");
    setDescription("");
    setIsDefault(false);
    setIsActive(true);
    setModalOpen(true);
  }

  function openEdit(r: TaskTemplateRow) {
    setEditing(r);
    setParentId(r.parentId);
    setName(r.name);
    setCategory(r.category || "");
    setEstimatedCost(String(r.estimatedCost));
    setDescription(r.description || "");
    setIsDefault(r.isDefault);
    setIsActive(r.isActive);
    setModalOpen(true);
  }

  async function toggleDefault(r: TaskTemplateRow) {
    const next = !r.isDefault;
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, isDefault: next } : x)));
    await fetch(`/api/projects/task-templates/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: next }),
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        parent_id: parentId,
        name,
        category: category || null,
        estimated_cost: Number(estimatedCost) || 0,
        description: description || null,
        is_default: isDefault,
        is_active: isActive,
      };
      if (editing) {
        const res = await fetch(`/api/projects/task-templates/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const d = await res.json();
          setRows((prev) => prev.map((x) => (x.id === editing.id ? d.taskTemplate : x)));
          setModalOpen(false);
          router.refresh();
        }
      } else {
        const res = await fetch("/api/projects/task-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const d = await res.json();
          setRows((prev) => [...prev, d.taskTemplate]);
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
      const res = await fetch(`/api/projects/task-templates/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((x) => x.id !== deleteTarget.id && x.parentId !== deleteTarget.id));
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
        icon="fa-solid fa-list-check"
        title="Task & Cost Setup"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Projects", href: "/projects/projects" }, { label: "Task & Cost Setup" }]}
        actions={
          <>
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() =>
                downloadCsv(
                  "task-templates.csv",
                  ["Name", "Category", "Estimated Cost", "Default", "Active"],
                  rows.map((r) => [r.name, r.category, r.estimatedCost, r.isDefault, r.isActive])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2" />Export
            </button>
            <button type="button" className="btn btn-erp" onClick={() => openAdd(null)}>
              <i className="fa-solid fa-plus me-2" />Add Stage
            </button>
          </>
        }
      />

      <div className="erp-card">
        <div className="erp-card-head">
          <div>
            <h2>Standard work breakdown</h2>
            <p>
              Every row marked <strong>use as default</strong> is added to a new project&apos;s task board as{" "}
              <strong>New</strong> the moment the project is created.
            </p>
          </div>
          <span className="erp-pill is-neutral">{rows.length} rows</span>
        </div>

        <div className="erp-card-body is-flush">
          <div className="table-responsive">
            <table className="table erp-table erp-tpl-table mb-0">
              <thead>
                <tr>
                  <th>Stage / activity</th>
                  <th style={{ width: 160 }}>Category</th>
                  <th className="text-end" style={{ width: 130 }}>Est. cost</th>
                  <th className="text-center" style={{ width: 120 }}>Use as default</th>
                  <th className="text-center" style={{ width: 80 }}>Active</th>
                  <th className="text-end" style={{ width: 120 }} />
                </tr>
              </thead>
              <tbody>
                {stages.map((st) => {
                  const acts = childrenOf(st.id);
                  return (
                    <>
                      <tr key={`st-${st.id}`} className="erp-tpl-stage">
                        <td className="erp-cell-strong">
                          <i className="fa-solid fa-layer-group me-2 text-muted" />
                          {st.name}
                          <span className="erp-tpl-count">{acts.length}</span>
                        </td>
                        <td>{st.category || "—"}</td>
                        <td className="text-end">{st.estimatedCost.toFixed(2)}</td>
                        <td className="text-center">
                          <label className="erp-tpl-toggle">
                            <input type="checkbox" checked={st.isDefault} onChange={() => toggleDefault(st)} />
                            <span />
                          </label>
                        </td>
                        <td className="text-center">
                          <span className={`erp-pill ${st.isActive ? "is-available" : "is-neutral"}`}>
                            {st.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <button type="button" className="btn btn-erp-ghost btn-sm" title="Add activity" onClick={() => openAdd(st.id)}>
                            <i className="fa-solid fa-plus" />
                          </button>
                          <button type="button" className="btn btn-erp-ghost btn-sm" title="Edit" onClick={() => openEdit(st)}>
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button type="button" className="btn btn-erp-ghost btn-sm text-danger" title="Remove" onClick={() => setDeleteTarget(st)}>
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </td>
                      </tr>
                      {acts.map((act) => (
                        <tr key={`act-${act.id}`} className="erp-tpl-activity">
                          <td><span className="erp-tpl-branch" />{act.name}</td>
                          <td>{act.category || "—"}</td>
                          <td className="text-end">{act.estimatedCost.toFixed(2)}</td>
                          <td className="text-center">
                            <label className="erp-tpl-toggle">
                              <input type="checkbox" checked={act.isDefault} onChange={() => toggleDefault(act)} />
                              <span />
                            </label>
                          </td>
                          <td className="text-center">
                            <span className={`erp-pill ${act.isActive ? "is-available" : "is-neutral"}`}>
                              {act.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-end text-nowrap">
                            <button type="button" className="btn btn-erp-ghost btn-sm" title="Edit" onClick={() => openEdit(act)}>
                              <i className="fa-solid fa-pen" />
                            </button>
                            <button type="button" className="btn btn-erp-ghost btn-sm text-danger" title="Remove" onClick={() => setDeleteTarget(act)}>
                              <i className="fa-solid fa-trash-can" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" style={{ border: "none", borderRadius: 14 }} onSubmit={handleSave}>
              <div className="modal-header">
                <h5 className="modal-title">{editing ? "Edit Stage / Activity" : parentId ? "Add Activity" : "Add Stage"}</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
              </div>
              <div className="modal-body">
                <div className="erp-field">
                  <label className="form-label">Name <span className="erp-required">*</span></label>
                  <input className="form-control" required maxLength={190} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="row">
                  <div className="col-6 erp-field">
                    <label className="form-label">Category</label>
                    <input className="form-control" maxLength={60} value={category} onChange={(e) => setCategory(e.target.value)} />
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Estimated Cost</label>
                    <input type="number" step="0.01" className="form-control" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
                  </div>
                </div>
                <div className="erp-field">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="erp-switch-row mt-2">
                  <div>
                    <h6>Use as default</h6>
                    <span className="erp-help">Added automatically to every new project&apos;s task board.</span>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input type="checkbox" className="form-check-input" id="tpl_def" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                  </div>
                </div>
                <div className="erp-switch-row">
                  <div>
                    <h6>Active</h6>
                    <span className="erp-help">Inactive rows stay out of new project boards.</span>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input type="checkbox" className="form-check-input" id="tpl_act" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
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
        title="Remove stage / activity?"
        description={<><strong>{deleteTarget?.name ?? ""}</strong> will be removed from active use.</>}
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
