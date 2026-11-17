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

export interface LenderRow {
  id: number;
  code: string;
  name: string;
  lenderType: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bankId: number | null;
  bankName: string | null;
  loansCount: number;
  notes: string | null;
  isActive: boolean;
}

const LENDER_TYPES = [
  { value: "bank", label: "Bank" },
  { value: "financial_institution", label: "Financial Institution" },
  { value: "nbfi", label: "Non-bank Financial Institution" },
  { value: "shareholder", label: "Shareholder" },
  { value: "director", label: "Director" },
  { value: "related_company", label: "Related Company" },
  { value: "other", label: "Other" },
];

export default function LendersClient({
  lenders,
  banks,
  filters,
}: {
  lenders: LenderRow[];
  banks: { id: number; name: string; shortName: string | null }[];
  filters: { search: string; type: string };
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LenderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LenderRow | null>(null);

  const [name, setName] = useState("");
  const [lenderType, setLenderType] = useState("bank");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [bankId, setBankId] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setName("");
    setLenderType("bank");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setBankId("");
    setNotes("");
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(l: LenderRow) {
    setEditing(l);
    setName(l.name);
    setLenderType(l.lenderType);
    setContactPerson(l.contactPerson ?? "");
    setPhone(l.phone ?? "");
    setEmail(l.email ?? "");
    setAddress(l.address ?? "");
    setBankId(l.bankId ? String(l.bankId) : "");
    setNotes(l.notes ?? "");
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/accounting/lenders/${editing.id}`
        : "/api/accounting/lenders";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          lender_type: lenderType,
          contact_person: contactPerson.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          bank_id: bankId ? Number(bankId) : null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save lender.");
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
      const res = await fetch(`/api/accounting/lenders/${deleteTarget.id}`, {
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
        icon="fa-solid fa-landmark"
        title="Lenders"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Finance" },
          { label: "Lenders" },
        ]}
        actions={
          <button type="button" className="btn btn-erp" onClick={openCreate}>
            <i className="fa-solid fa-plus me-2"></i>New Lender
          </button>
        }
      />

      <div className="erp-card mt-3">
        <div className="erp-card-body">
          <form method="GET" action="/accounting/lenders" className="erp-filterbar mb-3">
            <div className="erp-field mb-0">
              <input
                type="search"
                name="search"
                className="form-control"
                placeholder="Name, code or contact…"
                defaultValue={filters.search}
              />
            </div>
            <div className="erp-field mb-0">
              <select name="type" className="form-select" defaultValue={filters.type}>
                <option value="">Any type</option>
                {LENDER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-erp-ghost">
              <i className="fa-solid fa-filter me-1"></i>Filter
            </button>
          </form>

          {lenders.length === 0 ? (
            <ErpEmptyState
              icon="fa-solid fa-landmark"
              title="No lenders found"
              description="Add banks, financial institutions, or shareholders you borrow from."
            />
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Contact</th>
                    <th className="text-center">Loans</th>
                    <th className="text-center">Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lenders.map((l) => (
                    <tr key={l.id}>
                      <td className="erp-cell-strong">{l.code}</td>
                      <td>{l.name}</td>
                      <td>
                        <ErpPill tone="booked">
                          {LENDER_TYPES.find((t) => t.value === l.lenderType)?.label ??
                            l.lenderType}
                        </ErpPill>
                      </td>
                      <td>
                        {[l.contactPerson, l.phone].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="text-center">{l.loansCount}</td>
                      <td className="text-center">
                        <ErpPill tone={l.isActive ? "available" : "neutral"}>
                          {l.isActive ? "Active" : "Inactive"}
                        </ErpPill>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-erp-ghost"
                          title="Edit"
                          onClick={() => openEdit(l)}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        {l.loansCount === 0 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-erp-ghost text-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(l)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <form
                className="modal-content erp-form"
                style={{ border: "none", borderRadius: 14 }}
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="modal-body p-4">
                  <h5 className="mb-3" style={{ fontSize: 16, fontWeight: 600 }}>
                    {editing ? "Edit lender" : "New lender"}
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
                    <div className="col-md-7">
                      <div className="erp-field">
                        <label className="form-label">
                          Name <span className="erp-required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={190}
                          placeholder="e.g. City Bank PLC"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="erp-field">
                        <label className="form-label">
                          Type <span className="erp-required">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={lenderType}
                          onChange={(e) => setLenderType(e.target.value)}
                        >
                          {LENDER_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Contact person</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={190}
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="erp-field">
                        <label className="form-label">Phone</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={40}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="erp-field">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          maxLength={190}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-7">
                      <div className="erp-field">
                        <label className="form-label">Address</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={255}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="erp-field">
                        <label className="form-label">Linked bank</label>
                        <select
                          className="form-select"
                          value={bankId}
                          onChange={(e) => setBankId(e.target.value)}
                        >
                          <option value="">— None —</option>
                          {banks.map((b) => (
                            <option key={b.id} value={String(b.id)}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                        <span className="erp-help">If this lender is also one of your banks.</span>
                      </div>
                    </div>
                  </div>

                  <div className="erp-field mb-0">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      maxLength={2000}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 px-4 pb-4 pt-0">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" disabled={saving}>
                    {saving ? "Saving…" : "Save lender"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete lender?"
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
