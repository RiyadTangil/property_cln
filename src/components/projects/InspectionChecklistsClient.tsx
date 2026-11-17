"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal, ErpEmptyState, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export interface ChecklistRow {
  id: number;
  name: string;
  inspectionType: string | null;
  description: string | null;
  itemsJson: string;
  isActive: boolean;
}

export function InspectionChecklistsClient({ checklists: initial }: { checklists: ChecklistRow[] }) {
  const router = useRouter();
  const [checklists, setChecklists] = useState(initial);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChecklistRow | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [inspectionType, setInspectionType] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<string[]>([""]);

  const filtered = checklists.filter((c) => {
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/projects/inspection-checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          inspection_type: inspectionType || null,
          description: description || null,
          is_active: isActive,
          items: items.map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setChecklists((prev) => [d.checklist, ...prev]);
        setName("");
        setInspectionType("");
        setDescription("");
        setItems([""]);
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
      const res = await fetch(`/api/projects/inspection-checklists/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setChecklists((prev) => prev.filter((x) => x.id !== deleteTarget.id));
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
        icon="fa-solid fa-clipboard-check"
        title="Inspection Checklists"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Projects", href: "/projects/projects" }, { label: "Inspection Checklists" }]}
        actions={
          <button type="button" className="btn btn-erp" onClick={() => setModalOpen(true)}>
            <i className="fa-solid fa-plus me-2" />New Checklist
          </button>
        }
      />

      <div className="erp-card">
        <div className="erp-toolbar">
          <div className="erp-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search checklists..." />
          </div>
          <span className="text-muted small">{filtered.length} checklists</span>
        </div>

        <div className="erp-card-body is-flush">
          {filtered.length === 0 ? (
            <ErpEmptyState
              icon="fa-solid fa-clipboard-check"
              title="No inspection checklists yet"
              description="Create reusable QA/QC inspection checklists for site engineers."
              action={
                <button type="button" className="btn btn-erp" onClick={() => setModalOpen(true)}>
                  <i className="fa-solid fa-plus me-2" />New Checklist
                </button>
              }
            />
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table mb-0">
                <thead>
                  <tr>
                    <th>Checklist</th>
                    <th>Type</th>
                    <th className="text-end">Items</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    let count = 0;
                    try {
                      count = (JSON.parse(c.itemsJson) as unknown[]).length;
                    } catch {
                      count = 0;
                    }
                    return (
                      <tr key={c.id}>
                        <td>
                          <span className="erp-identity-name">{c.name}</span>
                          {c.description && <span className="erp-identity-meta d-block">{c.description}</span>}
                        </td>
                        <td>{c.inspectionType || "—"}</td>
                        <td className="text-end">{count}</td>
                        <td>
                          <span className={`erp-pill ${c.isActive ? "is-available" : "is-neutral"}`}>
                            {c.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-end">
                          <button type="button" className="btn btn-erp-ghost btn-sm text-danger" onClick={() => setDeleteTarget(c)}>
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleCreate}>
              <div className="modal-header">
                <h5 className="modal-title">New Checklist</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
              </div>
              <div className="modal-body">
                <div className="erp-field">
                  <label className="form-label">Name <span className="erp-required">*</span></label>
                  <input className="form-control" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="erp-field">
                  <label className="form-label">Inspection Type</label>
                  <input className="form-control" maxLength={60} placeholder="e.g. Structural, MEP, Finishing" value={inspectionType} onChange={(e) => setInspectionType(e.target.value)} />
                </div>
                <div className="erp-field">
                  <label className="form-label">Description</label>
                  <input className="form-control" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="erp-field">
                  <label className="form-label d-flex justify-content-between">
                    <span>Checklist Items</span>
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setItems([...items, ""])}>+ Add item</button>
                  </label>
                  {items.map((it, idx) => (
                    <div key={idx} className="input-group mb-2">
                      <input
                        className="form-control"
                        maxLength={190}
                        placeholder={`Check #${idx + 1}`}
                        value={it}
                        onChange={(e) => setItems(items.map((v, i) => (i === idx ? e.target.value : v)))}
                      />
                      {items.length > 1 && (
                        <button type="button" className="btn btn-outline-danger" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                          <i className="fa-solid fa-xmark" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="form-check form-switch">
                  <input type="checkbox" className="form-check-input" id="chk_act" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  <label htmlFor="chk_act" className="form-check-label">Active</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Create Checklist</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete checklist?"
        description={<><strong>{deleteTarget?.name ?? ""}</strong> will be removed from active use.</>}
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
