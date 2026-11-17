"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal, ErpEmptyState, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export interface CostBreakdownRow {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  costType: string;
  accountLabel: string | null;
  description: string | null;
  isGroup: boolean;
  isActive: boolean;
}

const COST_TYPE_LABELS: Record<string, { label: string; pill: string }> = {
  direct: { label: "Direct", pill: "is-available" },
  indirect: { label: "Indirect", pill: "is-booked" },
  overhead: { label: "Overhead", pill: "is-hold" },
  contingency: { label: "Contingency", pill: "is-sold" },
  finance: { label: "Finance", pill: "is-neutral" },
};

export function CostBreakdownClient({
  items: initial,
  stats,
}: {
  items: CostBreakdownRow[];
  stats: { total: number; groups: number; postable: number; unmapped: number };
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [costType, setCostType] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CostBreakdownRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CostBreakdownRow | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    parent_id: "",
    code: "",
    name: "",
    cost_type: "direct",
    account_label: "",
    description: "",
    is_group: false,
  });

  const filtered = items.filter((i) => {
    if (costType && i.costType !== costType) return false;
    if (status === "active" && !i.isActive) return false;
    if (status === "inactive" && i.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.code.toLowerCase().includes(q) && !i.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function openAdd(parentId: number | null) {
    setEditing(null);
    setForm({
      parent_id: parentId ? String(parentId) : "",
      code: "",
      name: "",
      cost_type: "direct",
      account_label: "",
      description: "",
      is_group: parentId === null,
    });
    setModalOpen(true);
  }

  function openEdit(item: CostBreakdownRow) {
    setEditing(item);
    setForm({
      parent_id: item.parentId ? String(item.parentId) : "",
      code: item.code,
      name: item.name,
      cost_type: item.costType,
      account_label: item.accountLabel || "",
      description: item.description || "",
      is_group: item.isGroup,
    });
    setModalOpen(true);
  }

  async function toggleActive(item: CostBreakdownRow) {
    const next = !item.isActive;
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, isActive: next } : x)));
    await fetch(`/api/projects/cost-breakdown/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        code: form.code,
        name: form.name,
        cost_type: form.cost_type,
        account_label: form.account_label || null,
        description: form.description || null,
        is_group: form.is_group,
      };
      if (editing) {
        const res = await fetch(`/api/projects/cost-breakdown/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const d = await res.json();
          setItems((prev) => prev.map((x) => (x.id === editing.id ? d.item : x)));
          setModalOpen(false);
          router.refresh();
        }
      } else {
        const res = await fetch("/api/projects/cost-breakdown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const d = await res.json();
          setItems((prev) => [...prev, d.item]);
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
      const res = await fetch(`/api/projects/cost-breakdown/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id && x.parentId !== deleteTarget.id));
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
        icon="fa-solid fa-sitemap"
        title="Cost Breakdown Structure"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Projects", href: "/projects/projects" }, { label: "Cost Breakdown (CBS)" }]}
        actions={
          <button type="button" className="btn btn-erp" onClick={() => openAdd(null)}>
            <i className="fa-solid fa-plus me-2" />Add Cost Item
          </button>
        }
      />

      <div className="erp-sale-strip">
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Cost items</span>
          <strong>{stats.total}</strong>
          <span className="erp-sale-stat-foot">{stats.groups} groups</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Postable</span>
          <strong>{stats.postable}</strong>
          <span className="erp-sale-stat-foot">Active items a cost can be coded to</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Not mapped to a ledger</span>
          <strong>{stats.unmapped}</strong>
          <span className="erp-sale-stat-foot">Set an account so costs post correctly</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Depth limit</span>
          <strong>4</strong>
          <span className="erp-sale-stat-foot">Levels, e.g. 05.01.02</span>
        </div>
      </div>

      <div className="erp-card mt-3">
        <div className="erp-card-head">
          <div>
            <h2>Cost structure</h2>
            <p>The financial classification every project cost is filed under — estimates, BOQs, purchases and actuals all code to these items.</p>
          </div>
        </div>
        <div className="erp-card-body">
          <div className="erp-filterbar mb-3">
            <div className="erp-field mb-0">
              <input type="search" className="form-control" placeholder="Code or name…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="erp-field mb-0">
              <select className="form-select" value={costType} onChange={(e) => setCostType(e.target.value)}>
                <option value="">Any cost type</option>
                <option value="direct">Direct Cost</option>
                <option value="indirect">Indirect Cost</option>
                <option value="overhead">Overhead</option>
                <option value="contingency">Contingency</option>
                <option value="finance">Finance Cost</option>
              </select>
            </div>
            <div className="erp-field mb-0">
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="inactive">Retired</option>
              </select>
            </div>
            <span className="text-muted ms-auto small">{filtered.length} items</span>
          </div>

          {filtered.length === 0 ? (
            <ErpEmptyState icon="fa-solid fa-sitemap" title="No CBS items" description="No cost breakdown items match your filter." />
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table erp-cbs-table">
                <thead>
                  <tr>
                    <th style={{ width: "26%" }}>Code &amp; Name</th>
                    <th style={{ width: "13%" }}>Cost Type</th>
                    <th style={{ width: "22%" }}>Ledger Account</th>
                    <th style={{ width: "9%" }}>Role</th>
                    <th style={{ width: "9%" }}>Status</th>
                    <th>Description</th>
                    <th className="text-end" style={{ width: "12%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const depth = item.code.split(".").length - 1;
                    const ct = COST_TYPE_LABELS[item.costType] ?? COST_TYPE_LABELS.direct;
                    return (
                      <tr key={item.id} className={item.isGroup ? "erp-cbs-group" : ""}>
                        <td>
                          <span className="erp-cbs-node" style={{ paddingLeft: depth * 20 }}>
                            {depth > 0 && <i className="fa-solid fa-turn-up fa-rotate-90 erp-cbs-branch" />}
                            <span className="erp-cbs-code">{item.code}</span>{" "}
                            <span className="erp-cbs-name">{item.name}</span>
                          </span>
                        </td>
                        <td><span className={`erp-pill ${ct.pill}`}>{ct.label}</span></td>
                        <td><span className="erp-cbs-acct">{item.accountLabel || "—"}</span></td>
                        <td>
                          <span className={`erp-pill ${item.isGroup ? "is-neutral" : "is-booked"}`}>
                            {item.isGroup ? "Group" : "Postable"}
                          </span>
                        </td>
                        <td>
                          <div className="form-check form-switch mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              checked={item.isActive}
                              onChange={() => toggleActive(item)}
                              aria-label="Active"
                            />
                          </div>
                        </td>
                        <td className="erp-cbs-desc">{item.description || "—"}</td>
                        <td className="text-end text-nowrap">
                          <button type="button" className="btn btn-erp-ghost btn-sm" title="Add child" onClick={() => openAdd(item.id)}>
                            <i className="fa-solid fa-plus" />
                          </button>
                          <button type="button" className="btn btn-erp-ghost btn-sm" title="Edit" onClick={() => openEdit(item)}>
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button type="button" className="btn btn-erp-ghost btn-sm text-danger" title="Remove" onClick={() => setDeleteTarget(item)}>
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
            <form className="modal-content" onSubmit={handleSave}>
              <div className="modal-header">
                <h5 className="modal-title">{editing ? "Edit Cost Item" : "Add Cost Item"}</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-4 erp-field">
                    <label className="form-label">Code <span className="erp-required">*</span></label>
                    <input className="form-control" required maxLength={30} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                  </div>
                  <div className="col-8 erp-field">
                    <label className="form-label">Name <span className="erp-required">*</span></label>
                    <input className="form-control" required maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Cost Type</label>
                    <select className="form-select" value={form.cost_type} onChange={(e) => setForm({ ...form, cost_type: e.target.value })}>
                      <option value="direct">Direct Cost</option>
                      <option value="indirect">Indirect Cost</option>
                      <option value="overhead">Overhead</option>
                      <option value="contingency">Contingency</option>
                      <option value="finance">Finance Cost</option>
                    </select>
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Ledger Account</label>
                    <input className="form-control" placeholder="e.g. 5151 — Land Acquisition" value={form.account_label} onChange={(e) => setForm({ ...form, account_label: e.target.value })} />
                  </div>
                </div>
                <div className="erp-field">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-check form-switch">
                  <input type="checkbox" className="form-check-input" id="cbs_grp" checked={form.is_group} onChange={(e) => setForm({ ...form, is_group: e.target.checked })} />
                  <label htmlFor="cbs_grp" className="form-check-label">Group node (non-postable)</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Remove cost item?"
        description={<><strong>{deleteTarget ? `${deleteTarget.code} ${deleteTarget.name}` : ""}</strong> will be removed from active use.</>}
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
