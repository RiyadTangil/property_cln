"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TEMPLATE_TYPES } from "@/lib/tier0";

export interface InvoiceTemplateRow {
  id: number;
  name: string;
  type: string;
  paper: string;
  orientation: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function InvoiceTemplatesClient({
  templates,
}: {
  templates: InvoiceTemplateRow[];
}) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceTemplateRow | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await fetch(`/api/settings/invoice-templates?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-file-invoice"></i>
          </div>
          <div>
            <h1>Invoice Templates</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Invoice Templates
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <div className="dropdown">
            <button
              type="button"
              className="btn btn-erp dropdown-toggle"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((o) => !o)}
            >
              <i className="fa-solid fa-plus me-2"></i>New Template
            </button>
            <ul
              className={`dropdown-menu dropdown-menu-end${
                dropdownOpen ? " show" : ""
              }`}
            >
              {TEMPLATE_TYPES.map((t) => (
                <li key={t.value}>
                  <Link
                    className="dropdown-item"
                    href={`/settings/invoice-templates/create?type=${t.value}`}
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="erp-help mb-3">
        <i className="fa-solid fa-circle-info me-1"></i>Design your own document layouts
        with merge tokens, then set one as the default for each document type — its Print
        action renders through that template.
      </p>

      {TEMPLATE_TYPES.map((group) => {
        const items = templates.filter((t) => t.type === group.value);
        return (
          <div key={group.value} className="erp-card mb-3">
            <div className="erp-card-head">
              <strong>{group.label}</strong>
            </div>
            <div className="erp-card-body is-flush">
              {items.length === 0 ? (
                <p className="erp-cv-empty px-3 mb-0">
                  No {group.label.toLowerCase()} templates yet.{" "}
                  <Link href={`/settings/invoice-templates/create?type=${group.value}`}>
                    Create one
                  </Link>
                  .
                </p>
              ) : (
                <div className="erp-table-wrap">
                  <table className="table erp-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Paper</th>
                        <th>Orientation</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((tpl) => (
                        <tr key={tpl.id}>
                          <td>
                            <span className="erp-cell-strong">{tpl.name}</span>
                            {tpl.isDefault && (
                              <span className="erp-pill is-sold ms-2">Default</span>
                            )}
                          </td>
                          <td className="text-uppercase">{tpl.paper}</td>
                          <td className="text-capitalize">{tpl.orientation}</td>
                          <td>
                            <span
                              className={`erp-pill ${
                                tpl.isActive ? "is-available" : "is-neutral"
                              }`}
                            >
                              {tpl.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-danger"
                              onClick={() => setDeleteTarget(tpl)}
                              title="Delete"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })}

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
                        Delete template?
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                        <strong>{deleteTarget.name}</strong> will be deleted permanently.
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
                    disabled={busyId === deleteTarget.id}
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
