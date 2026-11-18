"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface FollowUpTypeRow {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  pill: string;
  sortOrder: number;
  inUse: number;
  isActive: boolean;
  createdAt?: string | Date;
}

const BUILTIN_META: Record<number, { displayName: string; slug: string; icon: string; pill: string }> = {
  1: { displayName: "Call", slug: "call", icon: "fa-solid fa-phone", pill: "is-booked" },
  2: { displayName: "Meeting", slug: "meeting", icon: "fa-solid fa-handshake", pill: "is-available" },
  3: { displayName: "Site Visit", slug: "site_visit", icon: "fa-solid fa-building-circle-check", pill: "is-sold" },
  4: { displayName: "Email", slug: "email", icon: "fa-solid fa-envelope", pill: "is-neutral" },
  5: { displayName: "SMS", slug: "sms", icon: "fa-solid fa-comment-sms", pill: "is-neutral" },
  6: { displayName: "WhatsApp", slug: "whatsapp", icon: "fa-brands fa-whatsapp", pill: "is-available" },
  7: { displayName: "Demo / Walkthrough", slug: "demo", icon: "fa-solid fa-desktop", pill: "is-hold" },
  8: { displayName: "Collect Documents", slug: "documents", icon: "fa-solid fa-file-arrow-up", pill: "is-hold" },
  9: { displayName: "Payment Reminder", slug: "payment", icon: "fa-solid fa-money-bill-wave", pill: "is-overdue" },
  10: { displayName: "Other", slug: "other", icon: "fa-solid fa-list-check", pill: "is-neutral" },
};

function normalizePill(pill: string | undefined | null, fallback = "is-neutral"): string {
  if (!pill) return fallback;
  return pill.startsWith("is-") ? pill : `is-${pill}`;
}

function resolveTypeDisplay(item: FollowUpTypeRow) {
  const builtin = BUILTIN_META[item.id];
  const isBuiltin = item.id <= 10;
  const displayName =
    builtin && (item.name === builtin.displayName.split(" ")[0] || item.name === builtin.displayName)
      ? builtin.displayName
      : item.name;
  const slug =
    item.description ||
    (builtin ? builtin.slug : item.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  const icon =
    builtin && item.icon === "fa-solid fa-phone" && item.id !== 1 ? builtin.icon : item.icon || "fa-solid fa-list-check";
  const pillClass = normalizePill(item.pill, builtin?.pill || "is-neutral");
  return { isBuiltin, displayName, slug, icon, pillClass };
}

export function CrmFollowupTypesList({ initialItems }: { initialItems: FollowUpTypeRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<FollowUpTypeRow[]>(initialItems);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FollowUpTypeRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = items.filter((item) => {
    const { displayName, slug } = resolveTypeDisplay(item);
    const q = search.trim().toLowerCase();
    if (q && !displayName.toLowerCase().includes(q) && !slug.toLowerCase().includes(q)) {
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
      const res = await fetch(`/api/crm/followup-types/${deleteTarget.id}`, { method: "DELETE" });
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
            <i className="fa-solid fa-tags"></i>
          </div>
          <div>
            <h1>Follow-up Types</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Follow-up Types
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/followups" className="btn btn-erp-ghost">
            <i className="fa-solid fa-list-check me-2"></i>Follow-ups
          </Link>
          <Link data-modal-form href="/crm/followup-types/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Type
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/crm/followup-types"
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
                aria-label="Search types"
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
            {filtered.length} {filtered.length === 1 ? "type" : "types"}
          </span>
        </div>

        <div className="erp-card-body is-flush">
          <div className="erp-table-wrap">
            <table className="table erp-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Preview</th>
                  <th className="text-end">Order</th>
                  <th className="text-end">In use</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const { isBuiltin, displayName, slug, icon, pillClass } = resolveTypeDisplay(item);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="erp-identity">
                          <span className="erp-initials">
                            <i className={icon}></i>
                          </span>
                          <span>
                            <span className="erp-identity-name">
                              {displayName}
                              {isBuiltin && <span className="erp-pill is-neutral ms-1">Built in</span>}
                            </span>
                            <span className="erp-identity-meta">{slug}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`erp-pill ${pillClass}`}>{displayName}</span>
                      </td>
                      <td className="text-end erp-cell-strong">{item.sortOrder}</td>
                      <td className="text-end erp-cell-strong">{item.inUse ?? 0}</td>
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
                          href={`/crm/followup-types/${item.id}/edit`}
                          className="btn btn-erp-ghost btn-sm"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </Link>{" "}
                        {isBuiltin ? (
                          <span
                            className="text-muted"
                            style={{ fontSize: "12px" }}
                            title="Built-in types cannot be deleted"
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
                    Delete follow-up type?
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

const PILL_OPTIONS = [
  { value: "is-neutral", label: "Grey" },
  { value: "is-booked", label: "Blue" },
  { value: "is-available", label: "Green" },
  { value: "is-hold", label: "Amber" },
  { value: "is-sold", label: "Purple" },
  { value: "is-overdue", label: "Red" },
];

export function CrmFollowupTypeForm({
  mode,
  initialData,
}: {
  mode: "create" | "edit";
  initialData?: FollowUpTypeRow;
}) {
  const router = useRouter();
  const resolved = initialData ? resolveTypeDisplay(initialData) : null;
  const [name, setName] = useState(resolved ? resolved.displayName : "");
  const [sortOrder, setSortOrder] = useState(initialData ? String(initialData.sortOrder) : "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [icon, setIcon] = useState(resolved ? resolved.icon : "fa-solid fa-list-check");
  const [pill, setPill] = useState(resolved ? resolved.pillClass : "is-neutral");
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);
  const [submitting, setSubmitting] = useState(false);

  const isBuiltin = mode === "edit" && initialData && initialData.id <= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        sort_order: sortOrder ? Number(sortOrder) : 10,
        description: description.trim() || null,
        icon: icon.trim() || "fa-solid fa-list-check",
        pill: pill.replace(/^is-/, ""),
        is_active: isActive,
      };
      const url = mode === "edit" && initialData ? `/api/crm/followup-types/${initialData.id}` : "/api/crm/followup-types";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/crm/followup-types");
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
            <i className="fa-solid fa-tags"></i>
          </div>
          <div>
            <h1>{mode === "edit" ? resolved?.displayName || initialData?.name : "New Follow-up Type"}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/followup-types">Follow-up Types</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {mode === "edit" ? "Edit" : "New"}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          {mode === "edit" ? (
            <Link href="/crm/followup-types" className="btn btn-erp-ghost">
              <i className="fa-solid fa-list me-2"></i>All Types
            </Link>
          ) : (
            <Link href="/crm/followup-types" className="btn btn-erp-ghost">
              <i className="fa-solid fa-arrow-left me-2"></i>Back to list
            </Link>
          )}
        </div>
      </div>

      <form
        method="POST"
        action={mode === "edit" && initialData ? `/crm/followup-types/${initialData.id}` : "/crm/followup-types"}
        className="erp-form"
        data-erp-org-form
        noValidate
        onSubmit={handleSubmit}
      >
        {mode === "edit" && <input type="hidden" name="_method" value="PUT" />}
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-tags"></i>
            </div>
            <div>
              <h2>Follow-up Type</h2>
              <p>How this kind of follow-up is named and shown on lists.</p>
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
                    ? "This follow-up type belongs to HQ and stays with it."
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
                  This is one of the built-in types. You can rename it, restyle it or deactivate it, but it cannot be
                  deleted &mdash; existing follow-ups rely on it.
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
                    placeholder="Site Visit"
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
                  <span className="erp-help">Lower sorts first.</span>
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
                    placeholder="When to use this type"
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="icon" className="form-label">
                    Icon
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className={icon || "fa-solid fa-list-check"} data-icon-preview></i>
                    </span>
                    <input
                      type="text"
                      id="icon"
                      name="icon"
                      className="form-control "
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      maxLength={60}
                      placeholder="fa-solid fa-phone"
                      data-icon-input
                    />
                  </div>
                  <span className="erp-help">
                    Any Font Awesome class, e.g. <code>fa-solid fa-phone</code>.
                  </span>
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field">
                  <label className="form-label">Colour</label>
                  <div className="erp-pill-choices">
                    {PILL_OPTIONS.map((opt) => (
                      <label key={opt.value} className="erp-pill-choice">
                        <input
                          type="radio"
                          name="pill"
                          value={opt.value}
                          checked={pill === opt.value}
                          onChange={() => setPill(opt.value)}
                        />
                        <span className={`erp-pill ${opt.value}`}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="erp-switch-row">
              <div>
                <h6>Active</h6>
                <p>Inactive types stay on existing follow-ups but drop out of the picker.</p>
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
            <Link href="/crm/followup-types" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" data-submit-button disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {mode === "edit" ? "Save Changes" : "Create Type"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
