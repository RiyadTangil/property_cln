"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpPageHeader,
  ErpPill,
  ErpTableCard,
} from "@/components/ui";

export interface MfsRow {
  id: number;
  name: string;
  shortName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  accountType: string | null;
  isActive: boolean;
}

export default function MfsClient({ services }: { services: MfsRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MfsRow | null>(null);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("merchant");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MfsRow | null>(null);

  function openNew() {
    setEditing(null);
    setName("");
    setShortName("");
    setAccountName("");
    setAccountNumber("");
    setAccountType("merchant");
    setIsActive(true);
    setModalOpen(true);
  }

  function openEdit(row: MfsRow) {
    setEditing(row);
    setName(row.name);
    setShortName(row.shortName ?? "");
    setAccountName(row.accountName ?? "");
    setAccountNumber(row.accountNumber ?? "");
    setAccountType(row.accountType ?? "merchant");
    setIsActive(row.isActive);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        name: name.trim(),
        short_name: shortName.trim(),
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
        account_type: accountType,
        is_active: isActive,
      };
      const res = await fetch("/api/settings/mfs-services", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setModalOpen(false);
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
      await fetch(`/api/settings/mfs-services?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-mobile-screen-button"
        title="MFS Services"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Settings" },
          { label: "MFS Services" },
        ]}
        actions={
          <>
            <a href="/api/settings/mfs-services/export" className="btn btn-erp-ghost">
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </a>
            <button type="button" className="btn btn-erp" onClick={openNew}>
              <i className="fa-solid fa-plus me-2"></i>New Service
            </button>
          </>
        }
      />

      <p className="erp-def-note mb-3">
        The mobile financial services this company collects money through. A payment taken as{" "}
        <strong>Mobile Money</strong> points at one of these, so a receipt says where the money
        actually landed rather than only that it arrived by phone.
      </p>

      <ErpTableCard
        isEmpty={services.length === 0}
        emptyState={
          <ErpEmptyState
            icon="fa-solid fa-mobile-screen-button"
            title="No mobile services yet"
            description="Add bKash, Nagad, Rocket or any other service you collect through; they can then be picked on mobile money payments."
          />
        }
      >
        <table className="table erp-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Account Name</th>
              <th>Account Number</th>
              <th>Account Type</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className="erp-cell-strong">{s.name}</span>
                  {s.shortName && <span className="erp-identity-meta d-block">{s.shortName}</span>}
                </td>
                <td>{s.accountName || "—"}</td>
                <td className="erp-cell-strong">{s.accountNumber || "—"}</td>
                <td>
                  <ErpPill tone="neutral" className="text-capitalize">
                    {s.accountType || "merchant"}
                  </ErpPill>
                </td>
                <td>
                  <ErpPill tone={s.isActive ? "available" : "neutral"}>
                    {s.isActive ? "Active" : "Inactive"}
                  </ErpPill>
                </td>
                <td className="text-end text-nowrap">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm"
                      onClick={() => openEdit(s)}
                      title="Edit"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm text-danger"
                      onClick={() => setDeleteTarget(s)}
                      title="Delete"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ErpTableCard>

      {modalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <form
                onSubmit={handleSubmit}
                className="modal-content erp-form"
                style={{ border: "none", borderRadius: 14 }}
              >
                <div className="modal-body p-4">
                  <h5 className="mb-3" style={{ fontSize: 16, fontWeight: 600 }}>
                    {editing ? "Edit service" : "New service"}
                  </h5>
                  <div className="row">
                    <div className="col-md-8">
                      <div className="erp-field">
                        <label className="form-label">
                          Service Name <span className="erp-required">*</span>
                        </label>
                        <input
                          type="text"
                          list="mfsNames"
                          className="form-control"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="bKash, Nagad, Rocket…"
                          required
                        />
                        <datalist id="mfsNames">
                          <option value="bKash" />
                          <option value="Nagad" />
                          <option value="Rocket" />
                          <option value="Upay" />
                          <option value="SureCash" />
                        </datalist>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label className="form-label">Short Name</label>
                        <input
                          type="text"
                          className="form-control"
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
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="Registered holder"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Wallet / Merchant Number</label>
                        <input
                          type="text"
                          className="form-control"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Account Type</label>
                        <select
                          className="form-control"
                          value={accountType}
                          onChange={(e) => setAccountType(e.target.value)}
                        >
                          <option value="">—</option>
                          <option value="personal">Personal</option>
                          <option value="agent">Agent</option>
                          <option value="merchant">Merchant</option>
                        </select>
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
        title="Delete service?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> ({deleteTarget.accountNumber || "—"}) will be
              deleted.
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
