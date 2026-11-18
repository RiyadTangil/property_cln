"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface LostReasonRow {
  id: number;
  name: string;
  description: string | null;
  requiresNote: boolean;
  sortOrder: number;
  leadsLost: number;
  isActive: boolean;
  createdAt?: string | Date;
}

function resolveLostReasonDisplay(item: LostReasonRow) {
  const isBuiltin = item.id <= 8;
  let cleanName = item.name;
  let cleanDesc = item.description || "";
  if (item.name.includes(" Built in ")) {
    const parts = item.name.split(" Built in ");
    cleanName = parts[0].trim();
    cleanDesc = cleanDesc || parts.slice(1).join(" Built in ").trim();
  }
  const requiresNote = item.requiresNote || (item.id === 8 && cleanName === "Other");
  return { isBuiltin, cleanName, cleanDesc, requiresNote };
}

export function CrmLostReasonsList({ initialItems }: { initialItems: LostReasonRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<LostReasonRow[]>(initialItems);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LostReasonRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = items.filter((item) => {
    const { cleanName, cleanDesc } = resolveLostReasonDisplay(item);
    const q = search.trim().toLowerCase();
    if (q && !cleanName.toLowerCase().includes(q) && !cleanDesc.toLowerCase().includes(q)) {
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
      const res = await fetch(`/api/crm/lost-reasons/${deleteTarget.id}`, { method: "DELETE" });
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
            <i className="fa-solid fa-circle-minus"></i>
          </div>
          <div>
            <h1>Lost Reasons</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Lost Reasons
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/leads?status=unqualified" className="btn btn-erp-ghost">
            <i className="fa-solid fa-filter me-2"></i>Lost Leads
          </Link>
          <Link data-modal-form href="/crm/lost-reasons/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Reason
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/crm/lost-reasons"
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
                aria-label="Search reasons"
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
            {filtered.length} {filtered.length === 1 ? "reason" : "reasons"}
          </span>
        </div>

        <div className="erp-card-body is-flush">
          <div className="erp-table-wrap">
            <table className="table erp-table">
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Note</th>
                  <th className="text-end">Order</th>
                  <th>Leads lost</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const { isBuiltin, cleanName, cleanDesc, requiresNote } = resolveLostReasonDisplay(item);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="erp-identity">
                          <span className="erp-initials">
                            <i className="fa-solid fa-circle-minus"></i>
                          </span>
                          <span>
                            <span className="erp-identity-name">
                              {cleanName}
                              {isBuiltin && <span className="erp-pill is-neutral ms-1">Built in</span>}
                            </span>
                            <span className="erp-identity-meta">{cleanDesc}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        {requiresNote ? (
                          <span className="erp-pill is-hold">Required</span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "12.5px" }}>
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="text-end erp-cell-strong">{item.sortOrder}</td>
                      <td className="text-nowrap">
                        <span className="erp-cell-strong">{item.leadsLost ?? 0}</span>
                      </td>
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
                          data-modal-form
                          href={`/crm/lost-reasons/${item.id}/edit`}
                          className="btn btn-erp-ghost btn-sm"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </Link>{" "}
                        {isBuiltin ? (
                          <span
                            className="text-muted"
                            style={{ fontSize: "12px" }}
                            title="Built-in reasons cannot be deleted"
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
                    Delete lost reason?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>
                      {deleteTarget ? resolveLostReasonDisplay(deleteTarget).cleanName : ""}
                    </strong>{" "}
                    will be removed from active use. The record is retained and can be restored by an administrator.
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

export function CrmLostReasonForm({
  mode,
  initialData,
}: {
  mode: "create" | "edit";
  initialData?: LostReasonRow;
}) {
  const router = useRouter();
  const resolved = initialData ? resolveLostReasonDisplay(initialData) : null;
  const [name, setName] = useState(resolved ? resolved.cleanName : "");
  const [sortOrder, setSortOrder] = useState(initialData ? String(initialData.sortOrder) : "");
  const [description, setDescription] = useState(resolved ? resolved.cleanDesc : "");
  const [requiresNote, setRequiresNote] = useState(resolved ? resolved.requiresNote : false);
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);
  const [submitting, setSubmitting] = useState(false);

  const isBuiltin = mode === "edit" && initialData && initialData.id <= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        sort_order: sortOrder ? Number(sortOrder) : 10,
        description: description.trim() || null,
        requires_note: requiresNote,
        is_active: isActive,
      };
      const url = mode === "edit" && initialData ? `/api/crm/lost-reasons/${initialData.id}` : "/api/crm/lost-reasons";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/crm/lost-reasons");
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
            <i className="fa-solid fa-circle-minus"></i>
          </div>
          <div>
            <h1>{mode === "edit" ? resolved?.cleanName || initialData?.name : "New Lost Reason"}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/lost-reasons">Lost Reasons</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {mode === "edit" ? "Edit" : "New"}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/lost-reasons" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      <form
        method="POST"
        action={mode === "edit" && initialData ? `/crm/lost-reasons/${initialData.id}` : "/crm/lost-reasons"}
        className="erp-form"
        data-erp-org-form
        noValidate
        onSubmit={handleSubmit}
      >
        {mode === "edit" && <input type="hidden" name="_method" value="PUT" />}
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-circle-minus"></i>
            </div>
            <div>
              <h2>Lost Reason</h2>
              <p>One of the choices offered when a lead is written off.</p>
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
                    ? "This lost reason belongs to HQ and stays with it."
                    : "Filed under HQ \u2014 switch companies from the top bar to change this."}
                </span>
              </div>
            </div>

            {isBuiltin && (
              <div
                className="alert alert-warning d-flex gap-2 align-items-start"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
              >
                <i className="fa-solid fa-lock mt-1"></i>
                <div>
                  This is one of the built-in reasons. You can rename it or deactivate it, but it cannot be deleted
                  &mdash; leads already classified with it would end up showing as lost for no reason at all.
                </div>
              </div>
            )}

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
                    maxLength={80}
                    placeholder="Competitor"
                    required
                  />
                  <span className="erp-help">This is the line the loss report is grouped by.</span>
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
                  <span className="erp-help">Lower sorts first in the picker.</span>
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
                    placeholder="They bought from another developer"
                  />
                  <span className="erp-help">
                    Shown beside the name in the picker, so two similar reasons stay distinguishable under pressure.
                  </span>
                </div>
              </div>
            </div>

            <div className="erp-switch-row">
              <div>
                <h6>Require a note</h6>
                <p>
                  For catch-all reasons like &quot;Other&quot; — without the detail the row is unreportable, so the
                  salesperson has to say what happened.
                </p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="requires_note"
                  name="requires_note"
                  value="1"
                  checked={requiresNote}
                  onChange={(e) => setRequiresNote(e.target.checked)}
                />
              </div>
            </div>

            <div className="erp-switch-row">
              <div>
                <h6>Active</h6>
                <p>Inactive reasons stay on the leads already classified with them but drop out of the picker.</p>
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
          </span>
          <div className="erp-form-bar-actions">
            <Link href="/crm/lost-reasons" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" data-submit-button disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {mode === "edit" ? "Save Changes" : "Create Reason"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
