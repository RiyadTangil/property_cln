"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DOCUMENT_MODULES } from "@/lib/tier0";

export interface DocumentRow {
  id: number;
  title: string;
  category: string;
  module: string;
  uploadedBy: string;
  uploadedDate: string;
  expiryDate: string | null;
  fileSize: string;
  fileUrl: string;
}

function getExpiryStatus(expiryDate: string | null): { label: string; cls: string } {
  if (!expiryDate) return { label: "—", cls: "" };
  const target = new Date(expiryDate);
  if (isNaN(target.getTime())) return { label: expiryDate, cls: "is-neutral" };
  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return { label: expiryDate, cls: "is-overdue" };
  if (diffDays <= 60) return { label: expiryDate, cls: "is-booked" };
  return { label: expiryDate, cls: "is-available" };
}

export default function DocumentsClient({
  documents,
  filters,
}: {
  documents: DocumentRow[];
  filters: { search: string; documentable_type: string; expiry: string };
}) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Deed / Registry");
  const [mod, setMod] = useState("land_parcel");
  const [expiryDate, setExpiryDate] = useState("");
  const [fileSize, setFileSize] = useState("420 KB");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);

  async function submitUpload(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim(),
          module: mod,
          expiry_date: expiryDate || null,
          file_size: fileSize.trim() || "256 KB",
          file_url: "#",
        }),
      });
      if (res.ok) {
        setTitle("");
        setExpiryDate("");
        setUploadOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await fetch(`/api/settings/documents?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const hasFilter =
    filters.search || filters.documentable_type || filters.expiry;

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-folder-open"></i>
          </div>
          <div>
            <h1>Documents</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Documents
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <button
            type="button"
            className="btn btn-erp"
            onClick={() => setUploadOpen(true)}
          >
            <i className="fa-solid fa-upload me-2"></i>Upload Document
          </button>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form method="GET" action="/documents" className="erp-filterbar">
            <div className="erp-search erp-search-sm">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search file name…"
                aria-label="Search"
              />
            </div>

            <select
              name="documentable_type"
              className="erp-select"
              aria-label="Owner type"
              defaultValue={filters.documentable_type}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">All modules</option>
              {DOCUMENT_MODULES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              name="expiry"
              className="erp-select"
              aria-label="Expiry"
              defaultValue={filters.expiry}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">Any expiry</option>
              <option value="expiring">Expiring soon</option>
              <option value="expired">Expired</option>
              <option value="none">No expiry</option>
            </select>

            <button type="submit" className="btn btn-erp-ghost btn-sm">
              Filter
            </button>

            {hasFilter && (
              <Link href="/documents" className="btn btn-erp-ghost btn-sm">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {documents.length} {documents.length === 1 ? "document" : "documents"}
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <h3>No documents found</h3>
            <p>Central archive for deeds, drawings, RAJUK approvals, and contracts.</p>
            <button
              type="button"
              className="btn btn-erp"
              onClick={() => setUploadOpen(true)}
            >
              <i className="fa-solid fa-upload me-2"></i>Upload Document
            </button>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Module</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Expiry</th>
                    <th className="text-end">Size</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => {
                    const exp = getExpiryStatus(d.expiryDate);
                    const modLabel =
                      DOCUMENT_MODULES.find((m) => m.value === d.module)?.label ??
                      d.module;
                    return (
                      <tr key={d.id}>
                        <td>
                          <div className="erp-identity">
                            <span className="erp-initials">
                              <i className="fa-solid fa-file-pdf"></i>
                            </span>
                            <span>
                              <span className="erp-identity-name">{d.title}</span>
                              <span className="erp-identity-meta">{d.category}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="erp-pill is-neutral">{modLabel}</span>
                        </td>
                        <td>{d.uploadedBy}</td>
                        <td className="text-nowrap">{d.uploadedDate}</td>
                        <td>
                          {exp.cls ? (
                            <span className={`erp-pill ${exp.cls}`}>{exp.label}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-end">{d.fileSize}</td>
                        <td className="text-end text-nowrap">
                          <a
                            href={d.fileUrl}
                            className="btn btn-erp-ghost btn-sm"
                            title="Open"
                          >
                            <i className="fa-solid fa-up-right-from-square"></i>
                          </a>
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            onClick={() => setDeleteTarget(d)}
                            title="Delete"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {uploadOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <form
                onSubmit={submitUpload}
                className="modal-content"
                style={{ border: "none", borderRadius: 14 }}
              >
                <div className="modal-header">
                  <h5 className="modal-title">Upload Document</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setUploadOpen(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="erp-field">
                    <label className="form-label">
                      Document Title <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="RAJUK Structural Clearance.pdf"
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Module</label>
                        <select
                          className="form-select"
                          value={mod}
                          onChange={(e) => setMod(e.target.value)}
                        >
                          {DOCUMENT_MODULES.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Category</label>
                        <input
                          type="text"
                          className="form-control"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="erp-field mb-0">
                        <label className="form-label">Expiry Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="erp-field mb-0">
                        <label className="form-label">File Size Label</label>
                        <input
                          type="text"
                          className="form-control"
                          value={fileSize}
                          onChange={(e) => setFileSize(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    onClick={() => setUploadOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" disabled={saving}>
                    <i className="fa-solid fa-upload me-2"></i>
                    {saving ? "Uploading…" : "Save Document"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {deleteTarget && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <div className="modal-body p-4">
                  <div className="d-flex gap-3">
                    <div className="erp-kpi-icon is-danger">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div>
                      <h5 className="mb-2" style={{ fontSize: 16, fontWeight: 600 }}>
                        Delete document?
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                        <strong>{deleteTarget.title}</strong> will be removed permanently.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    onClick={() => setDeleteTarget(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-erp"
                    style={{
                      background: "var(--erp-danger)",
                      borderColor: "var(--erp-danger)",
                    }}
                    disabled={saving}
                    onClick={confirmDelete}
                  >
                    <i className="fa-solid fa-trash-can me-2"></i>Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
