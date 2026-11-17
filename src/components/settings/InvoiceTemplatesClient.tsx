"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TEMPLATE_TYPES } from "@/lib/tier0";
import { ErpDeleteModal, ErpPageHeader, ErpPill } from "@/components/ui";

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
      <ErpPageHeader
        icon="fa-solid fa-file-invoice"
        title="Invoice Templates"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Settings" },
          { label: "Invoice Templates" },
        ]}
        actions={
          <div className="dropdown">
            <button
              type="button"
              className="btn btn-erp dropdown-toggle"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((o) => !o)}
            >
              <i className="fa-solid fa-plus me-2"></i>New Template
            </button>
            <ul className={`dropdown-menu dropdown-menu-end${dropdownOpen ? " show" : ""}`}>
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
        }
      />

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
                              <ErpPill tone="sold" className="ms-2">
                                Default
                              </ErpPill>
                            )}
                          </td>
                          <td className="text-uppercase">{tpl.paper}</td>
                          <td className="text-capitalize">{tpl.orientation}</td>
                          <td>
                            <ErpPill tone={tpl.isActive ? "available" : "neutral"}>
                              {tpl.isActive ? "Active" : "Inactive"}
                            </ErpPill>
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

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete template?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> will be deleted permanently.
            </>
          )
        }
        busy={busyId === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
