"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

export interface PipelineStageItem {
  id: number;
  name: string;
  kind: "open" | "won" | "lost" | string;
  probability: number;
  color: string;
  order?: number;
  is_active?: boolean;
}

export interface PipelineRow {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  stagesJson: string;
  createdAt?: string | Date;
}

const DEFAULT_STAGES: PipelineStageItem[] = [
  { id: 1, name: "New", kind: "open", probability: 10, color: "#64748b", order: 10, is_active: true },
  { id: 2, name: "Contacted", kind: "open", probability: 25, color: "#0ea5e9", order: 20, is_active: true },
  { id: 3, name: "Qualified", kind: "open", probability: 50, color: "#6366f1", order: 30, is_active: true },
  { id: 4, name: "Proposal", kind: "open", probability: 75, color: "#f59e0b", order: 40, is_active: true },
  { id: 5, name: "Won", kind: "won", probability: 100, color: "#10b981", order: 50, is_active: true },
  { id: 6, name: "Lost", kind: "lost", probability: 0, color: "#ef4444", order: 60, is_active: true },
];

export function parseStages(stagesJson: string | undefined | null): PipelineStageItem[] {
  if (!stagesJson) return DEFAULT_STAGES;
  try {
    const parsed = JSON.parse(stagesJson);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore
  }
  return DEFAULT_STAGES;
}

export function CrmPipelinesList({ initialItems }: { initialItems: PipelineRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<PipelineRow[]>(initialItems);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PipelineRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    const desc = item.description || "The default process a lead moves through.";
    if (q && !item.name.toLowerCase().includes(q) && !desc.toLowerCase().includes(q)) {
      return false;
    }
    if (statusFilter === "active" && !item.isActive) return false;
    if (statusFilter === "inactive" && item.isActive) return false;
    return true;
  });

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/pipelines/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-diagram-project"></i>
          </div>
          <div>
            <h1>Pipelines</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Pipelines
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() => downloadCsv("crm-pipelines.csv", ["Name", "Order", "Default", "Active"], filtered.map((r) => [r.name, r.sortOrder, r.isDefault, r.isActive]))}
          >
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </button>
          <Link href="/crm/settings/pipelines/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Pipeline
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/crm/settings/pipelines"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or description…"
                aria-label="Search pipelines"
              />
            </div>

            <select
              name="status"
              className="form-select erp-select"
              aria-label="Status filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>

            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {filtered.length} {filtered.length === 1 ? "pipeline" : "pipelines"}
          </span>
        </div>

        <div className="erp-card-body is-flush">
          <div className="erp-table-wrap">
            <table className="table erp-table">
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Stages</th>
                  <th className="text-end">Order</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const stages = parseStages(item.stagesJson);
                  const displayOrder = item.sortOrder === 1 && item.id === 1 ? 10 : item.sortOrder;
                  const displayDesc =
                    item.id === 1 &&
                    item.description === "Default real estate apartment & plot sales pipeline"
                      ? "The default process a lead moves through."
                      : item.description || "The default process a lead moves through.";

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="erp-identity">
                          <span className="erp-initials">
                            <i className="fa-solid fa-diagram-project"></i>
                          </span>
                          <span>
                            <span className="erp-identity-name">
                              {item.name}
                              {item.isDefault && <span className="erp-pill is-sold ms-1">Default</span>}
                            </span>
                            <span className="erp-identity-meta">{displayDesc}</span>
                          </span>
                        </div>
                      </td>
                      <td className="text-nowrap">
                        <span className="erp-cell-strong">{stages.length}</span>{" "}
                        <span className="text-muted" style={{ fontSize: "12px" }}>
                          stages
                        </span>
                      </td>
                      <td className="text-end erp-cell-strong">{displayOrder}</td>
                      <td>
                        <span className={`erp-pill ${item.isActive ? "is-available" : "is-neutral"}`}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <span className="erp-created-by">
                          <span className="erp-cell-strong">—</span>
                          <span className="erp-identity-meta d-block">30 Oct 2026</span>
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <Link
                          href={`/crm/settings/pipelines/${item.id}/edit`}
                          className="btn btn-erp-ghost btn-sm"
                          title="Edit stages & settings"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </Link>{" "}
                        {item.isDefault ? (
                          <span
                            className="text-muted"
                            style={{ fontSize: "12px" }}
                            title="The default pipeline cannot be deleted"
                          >
                            Locked
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        className={`modal fade ${deleteTarget ? "show" : ""}`}
        id="deleteRecordModal"
        tabIndex={-1}
        aria-hidden={!deleteTarget}
        style={deleteTarget ? { display: "block", backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ border: "none", borderRadius: "14px" }}>
            <div className="modal-body p-4">
              <div className="d-flex gap-3">
                <div className="erp-kpi-icon is-danger">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                    Delete pipeline?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>{deleteTarget?.name}</strong> will be removed from active use. The record
                    is retained and can be restored by an administrator.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <form method="POST" data-delete-form onSubmit={handleDelete}>
                <input type="hidden" name="_method" value="DELETE" />
                <button
                  type="submit"
                  className="btn btn-erp"
                  disabled={deleting}
                  style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
                >
                  <i className="fa-solid fa-trash-can me-2"></i>Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CrmPipelineForm({
  mode,
  initialData,
}: {
  mode: "create" | "edit";
  initialData?: PipelineRow;
}) {
  const router = useRouter();
  const initialDesc =
    initialData?.id === 1 && initialData.description === "Default real estate apartment & plot sales pipeline"
      ? "The default process a lead moves through."
      : initialData?.description || "";
  const initialSort =
    initialData ? String(initialData.sortOrder === 1 && initialData.id === 1 ? 10 : initialData.sortOrder) : "";

  const [name, setName] = useState(initialData?.name || "");
  const [sortOrder, setSortOrder] = useState(initialSort);
  const [description, setDescription] = useState(initialDesc);
  const [isDefault, setIsDefault] = useState(initialData ? initialData.isDefault : false);
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);
  const [stages, setStages] = useState<PipelineStageItem[]>(() =>
    initialData ? parseStages(initialData.stagesJson) : DEFAULT_STAGES
  );
  const [submitting, setSubmitting] = useState(false);

  // Stage modal state
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState<number | null>(null);
  const [stageName, setStageName] = useState("");
  const [stageKind, setStageKind] = useState("open");
  const [stageProb, setStageProb] = useState("0");
  const [stageColor, setStageColor] = useState("#64748b");
  const [stageActive, setStageActive] = useState(true);

  function openNewStageModal() {
    setEditingStageId(null);
    setStageName("");
    setStageKind("open");
    setStageProb("0");
    setStageColor("#64748b");
    setStageActive(true);
    setStageModalOpen(true);
  }

  function openEditStageModal(st: PipelineStageItem) {
    setEditingStageId(st.id);
    setStageName(st.name);
    setStageKind(st.kind || "open");
    setStageProb(String(st.probability ?? 0));
    setStageColor(st.color || "#64748b");
    setStageActive(st.is_active !== false);
    setStageModalOpen(true);
  }

  async function persistStages(nextStages: PipelineStageItem[]) {
    setStages(nextStages);
    if (mode === "edit" && initialData) {
      await fetch(`/api/crm/pipelines/${initialData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stages: nextStages }),
      });
      router.refresh();
    }
  }

  async function handleStageSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stageName.trim()) return;
    let nextStages: PipelineStageItem[];
    if (editingStageId !== null) {
      nextStages = stages.map((s) =>
        s.id === editingStageId
          ? {
              ...s,
              name: stageName.trim(),
              kind: stageKind,
              probability: Number(stageProb) || 0,
              color: stageColor,
              is_active: stageActive,
            }
          : s
      );
    } else {
      const nextId = stages.reduce((m, s) => Math.max(m, s.id), 0) + 1;
      nextStages = [
        ...stages,
        {
          id: nextId,
          name: stageName.trim(),
          kind: stageKind,
          probability: Number(stageProb) || 0,
          color: stageColor,
          order: (stages.length + 1) * 10,
          is_active: stageActive,
        },
      ];
    }
    setStageModalOpen(false);
    await persistStages(nextStages);
  }

  async function handleDeleteStage(stageId: number) {
    const nextStages = stages.filter((s) => s.id !== stageId);
    await persistStages(nextStages);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        sort_order: sortOrder ? Number(sortOrder) : 10,
        description: description.trim() || null,
        is_default: isDefault,
        is_active: isActive,
        stages,
      };
      const url = mode === "edit" && initialData ? `/api/crm/pipelines/${initialData.id}` : "/api/crm/pipelines";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/crm/settings/pipelines");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-diagram-project"></i>
          </div>
          <div>
            <h1>{mode === "edit" ? initialData?.name : "New Pipeline"}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/settings/pipelines">Pipelines</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {mode === "edit" ? "Edit" : "New"}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/settings/pipelines" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      <form
        method="POST"
        action={mode === "edit" && initialData ? `/crm/settings/pipelines/${initialData.id}` : "/crm/settings/pipelines"}
        className="erp-form"
        data-erp-org-form
        noValidate
        onSubmit={handleSubmit}
      >
        {mode === "edit" && <input type="hidden" name="_method" value="PUT" />}
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-diagram-project"></i>
            </div>
            <div>
              <h2>Pipeline</h2>
              <p>A named process, and where it sits among the others.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-context-banner">
              <span className="erp-context-banner-icon">
                <i className="fa-solid fa-building-columns"></i>
              </span>
              <div className="erp-context-banner-body">
                <strong>E-Hishabi ERP</strong>
                <span>
                  {mode === "edit"
                    ? "This pipeline belongs to HQ and stays with it."
                    : "Filed under HQ \u2014 switch companies from the top bar to change this."}
                </span>
              </div>
            </div>

            <div className="row">
              <div className="col-md-8">
                <div className="erp-field">
                  <label htmlFor="name" className="form-label">
                    Name <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control "
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    placeholder="Resale Pipeline"
                    required
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="sort_order" className="form-label">
                    Display Order
                  </label>
                  <input
                    type="number"
                    id="sort_order"
                    name="sort_order"
                    min={0}
                    max={9999}
                    step={10}
                    className="form-control "
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    placeholder="Auto"
                  />
                  <span className="erp-help">Lower sorts first in the list.</span>
                </div>
              </div>

              <div className="col-md-12">
                <div className="erp-field">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    className="form-control "
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={255}
                    placeholder="The process a resale enquiry moves through"
                  />
                </div>
              </div>
            </div>

            <div className="erp-switch-row">
              <div>
                <h6>Default pipeline</h6>
                <p>
                  The one new deals start on. Turning this on takes the flag off whichever pipeline held it before — a
                  company always has exactly one.
                </p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="is_default"
                  name="is_default"
                  value="1"
                  checked={isDefault}
                  disabled={mode === "edit" && initialData?.isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                {mode === "edit" && initialData?.isDefault && <input type="hidden" name="is_default" value="1" />}
              </div>
            </div>

            <div className="erp-switch-row">
              <div>
                <h6>Active</h6>
                <p>Inactive pipelines stay on record but drop out of the pickers.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="is_active"
                  name="is_active"
                  value="1"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Fields marked <span className="erp-required">*</span> are required.
            {mode === "create" && " A new pipeline starts with the standard stages, which you can then tune."}
          </span>
          <div className="erp-form-bar-actions">
            <Link href="/crm/settings/pipelines" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" data-submit-button disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {mode === "edit" ? "Save Changes" : "Create Pipeline"}
            </button>
          </div>
        </div>
      </form>

      {mode === "edit" && initialData && (
        <>
          <section
            className="erp-card"
            data-stages-panel
            data-store-url={`/crm/settings/pipelines/${initialData.id}/stages`}
            data-reorder-url={`/crm/settings/pipelines/${initialData.id}/stages/reorder`}
            data-update-url-tpl={`/crm/settings/pipelines/${initialData.id}/stages/__ID__`}
            data-delete-url-tpl={`/crm/settings/pipelines/${initialData.id}/stages/__ID__`}
            data-can-update="1"
          >
            <div className="erp-section-head">
              <div className="erp-section-icon">
                <i className="fa-solid fa-layer-group"></i>
              </div>
              <div className="flex-grow-1">
                <h2>Stages</h2>
                <p>The ordered steps a deal moves through. Drag to reorder.</p>
              </div>
              <button type="button" className="btn btn-erp btn-sm" data-stage-add onClick={openNewStageModal}>
                <i className="fa-solid fa-plus me-2"></i>Add Stage
              </button>
            </div>
            <div className="erp-card-body">
              <div data-stages-list>
                <div className="erp-rows" data-stage-rows>
                  {stages.map((st, idx) => {
                    const pillTagClass =
                      st.kind === "won" ? "is-sold" : st.kind === "lost" ? "is-overdue" : "is-booked";
                    const pillTagLabel = st.kind === "won" ? "Won" : st.kind === "lost" ? "Lost" : "Open";
                    return (
                      <div
                        key={st.id}
                        className="erp-row erp-stage-row"
                        data-stage-id={st.id}
                        data-name={st.name}
                        data-color={st.color}
                        data-probability={st.probability}
                        data-kind={st.kind}
                        data-is_active={st.is_active !== false ? "1" : "0"}
                        draggable="true"
                      >
                        <span className="erp-stage-handle" title="Drag to reorder">
                          <i className="fa-solid fa-grip-vertical"></i>
                        </span>

                        <span className="erp-stage-dot" style={{ "--dot": st.color } as React.CSSProperties}></span>

                        <div className="erp-row-body">
                          <strong>
                            {st.name} <span className={`erp-pill ${pillTagClass} erp-row-tag`}>{pillTagLabel}</span>
                          </strong>
                          <div className="erp-row-meta">
                            <span>
                              <i className="fa-solid fa-percent me-1"></i>
                              {st.probability}% probability
                            </span>
                            <span>
                              <i className="fa-solid fa-arrow-down-1-9 me-1"></i>Order {st.order ?? (idx + 1) * 10}
                            </span>
                          </div>
                        </div>

                        <div className="erp-row-actions">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm"
                            title="Edit"
                            data-stage-edit
                            data-id={st.id}
                            onClick={() => openEditStageModal(st)}
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Remove"
                            data-stage-delete
                            data-id={st.id}
                            data-name={st.name}
                            onClick={() => handleDeleteStage(st.id)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <div
            className={`modal fade ${stageModalOpen ? "show" : ""}`}
            id="stageModal"
            tabIndex={-1}
            aria-hidden={!stageModalOpen}
            style={stageModalOpen ? { display: "block", backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
          >
            <div className="modal-dialog modal-dialog-centered">
              <form
                className="modal-content erp-form"
                style={{ border: "none", borderRadius: "14px" }}
                data-stage-form
                data-submit-lock="off"
                onSubmit={handleStageSubmit}
              >
                <input
                  type="hidden"
                  name="_method"
                  value={editingStageId !== null ? "PUT" : "POST"}
                  data-stage-method
                />

                <div className="modal-body p-4">
                  <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: 600 }} data-stage-title>
                    {editingStageId !== null ? "Edit stage" : "New stage"}
                  </h5>

                  <div
                    className="alert alert-danger py-2 px-3 mb-3"
                    role="alert"
                    style={{ borderRadius: "9px", fontSize: "12.5px" }}
                    data-stage-errors
                    hidden
                  >
                    <span data-stage-errors-text></span>
                  </div>

                  <div className="row">
                    <div className="col-md-8">
                      <div className="erp-field">
                        <label htmlFor="stage_name" className="form-label">
                          Name <span className="erp-required">*</span>
                        </label>
                        <input
                          type="text"
                          id="stage_name"
                          name="name"
                          className="form-control"
                          maxLength={120}
                          placeholder="Negotiation"
                          data-field="name"
                          value={stageName}
                          onChange={(e) => setStageName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="stage_kind" className="form-label">
                          Type <span className="erp-required">*</span>
                        </label>
                        <select
                          id="stage_kind"
                          name="kind"
                          className="form-select"
                          data-field="kind"
                          value={stageKind}
                          onChange={(e) => setStageKind(e.target.value)}
                        >
                          <option value="open">Open stage</option>
                          <option value="won">Won (outcome)</option>
                          <option value="lost">Lost (outcome)</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="stage_probability" className="form-label">
                          Probability (%)
                        </label>
                        <input
                          type="number"
                          id="stage_probability"
                          name="probability"
                          className="form-control"
                          min={0}
                          max={100}
                          step={5}
                          placeholder="0"
                          data-field="probability"
                          value={stageProb}
                          onChange={(e) => setStageProb(e.target.value)}
                        />
                        <span className="erp-help">Weighting for the forecast on this stage.</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="stage_color" className="form-label">
                          Colour
                        </label>
                        <input
                          type="color"
                          id="stage_color"
                          name="color"
                          className="form-control form-control-color"
                          value={stageColor}
                          onChange={(e) => setStageColor(e.target.value)}
                          data-field="color"
                          style={{ width: "100%", height: "38px" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="erp-switch-row mt-1">
                    <div>
                      <h6>Active</h6>
                      <p>Inactive stages stay on record but drop out of the pickers.</p>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        role="switch"
                        id="stage_is_active"
                        name="is_active"
                        value="1"
                        data-field="is_active"
                        checked={stageActive}
                        onChange={(e) => setStageActive(e.target.checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    data-bs-dismiss="modal"
                    onClick={() => setStageModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" data-loading-text="Saving…">
                    <i className="fa-solid fa-floppy-disk me-2"></i>Save Stage
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
