"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AccountingSubmenu from "./AccountingSubmenu";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpPageHeader,
  ErpPill,
} from "@/components/ui";

export interface BankRow {
  id: number;
  name: string;
  shortName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  branch: string | null;
  routingNumber: string | null;
  swift: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
}

export default function BanksClient({ banks }: { banks: BankRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BankRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankRow | null>(null);

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [swift, setSwift] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setName("");
    setShortName("");
    setAccountName("");
    setAccountNumber("");
    setBranch("");
    setRoutingNumber("");
    setSwift("");
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(b: BankRow) {
    setEditing(b);
    setName(b.name);
    setShortName(b.shortName ?? "");
    setAccountName(b.accountName ?? "");
    setAccountNumber(b.accountNumber ?? "");
    setBranch(b.branch ?? "");
    setRoutingNumber(b.routingNumber ?? "");
    setSwift(b.swift ?? "");
    setIsActive(b.isActive);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError("Bank Name is required.");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/accounting/banks/${editing.id}`
        : "/api/accounting/banks";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          short_name: shortName.trim() || null,
          account_name: accountName.trim() || null,
          account_number: accountNumber.trim() || null,
          branch: branch.trim() || null,
          routing_number: routingNumber.trim() || null,
          swift: swift.trim() || null,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save bank.");
        return;
      }
      setModalOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/accounting/banks/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <AccountingSubmenu />

      <ErpPageHeader
        icon="fa-solid fa-building-columns"
        title="Banks"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Accounting" },
          { label: "Banks" },
        ]}
        actions={
          <button type="button" className="btn btn-erp" onClick={openCreate}>
            <i className="fa-solid fa-plus me-2"></i>New Bank
          </button>
        }
      />

      <div className="erp-card">
        {banks.length === 0 ? (
          <ErpEmptyState
            icon="fa-solid fa-building-columns"
            title="No banks yet"
            description="Add the banks you hold accounts with; they can then be picked on bank / cheque payments."
          />
        ) : (
          <div className="erp-table-wrap">
            <table className="table erp-table">
              <thead>
                <tr>
                  <th>Bank</th>
                  <th>Account</th>
                  <th>Branch</th>
                  <th>Routing / SWIFT</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span className="erp-cell-strong d-block">{b.name}</span>
                      {b.shortName && (
                        <span className="erp-identity-meta">{b.shortName}</span>
                      )}
                    </td>
                    <td>
                      <span className="d-block">{b.accountName || "—"}</span>
                      {b.accountNumber && (
                        <span className="erp-identity-meta">{b.accountNumber}</span>
                      )}
                    </td>
                    <td>{b.branch || "—"}</td>
                    <td>
                      {[b.routingNumber, b.swift].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td>
                      <ErpPill tone={b.isActive ? "available" : "neutral"}>
                        {b.isActive ? "Active" : "Inactive"}
                      </ErpPill>
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        title="Edit"
                        onClick={() => openEdit(b)}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm text-danger"
                        title="Delete"
                        onClick={() => setDeleteTarget(b)}
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

      {modalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <form
                className="modal-content erp-form"
                style={{ border: "none", borderRadius: 14 }}
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="modal-body p-4">
                  <h5 className="mb-3" style={{ fontSize: 16, fontWeight: 600 }}>
                    {editing ? "Edit bank" : "New bank"}
                  </h5>
                  {formError && (
                    <div
                      className="alert alert-danger py-2 px-3 mb-3"
                      role="alert"
                      style={{ borderRadius: 9, fontSize: 12.5 }}
                    >
                      {formError}
                    </div>
                  )}
                  <div className="row">
                    <div className="col-md-8">
                      <div className="erp-field">
                        <label className="form-label">
                          Bank Name <span className="erp-required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={150}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label className="form-label">Short Name</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={40}
                          value={shortName}
                          onChange={(e) => setShortName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Account Name</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={150}
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Account Number</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={80}
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Branch</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={120}
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="erp-field">
                        <label className="form-label">Routing</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={40}
                          value={routingNumber}
                          onChange={(e) => setRoutingNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="erp-field">
                        <label className="form-label">SWIFT</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={20}
                          value={swift}
                          onChange={(e) => setSwift(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <label className="erp-check mt-1">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span>Active</span>
                  </label>
                </div>

                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" disabled={saving}>
                    <i className="fa-solid fa-floppy-disk me-2"></i>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete bank?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> will be deleted permanently.
            </>
          )
        }
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
