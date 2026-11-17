"use client";

import React, { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccountingSubmenu from "./AccountingSubmenu";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpPageHeader,
  ErpPill,
} from "@/components/ui";

export interface HeadRow {
  id: number;
  type: string;
  name: string;
  accountId: number;
  accountCode: string;
  accountName: string;
  defaultCostCode: string | null;
  description: string | null;
  entriesCount: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
}

export default function HeadsClient({
  heads,
  accounts,
}: {
  heads: HeadRow[];
  accounts: { id: number; code: string; name: string; accountType: string }[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HeadRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeadRow | null>(null);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [defaultCostCode, setDefaultCostCode] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const incomeAccounts = useMemo(
    () => accounts.filter((a) => a.accountType === "income"),
    [accounts]
  );
  const expenseAccounts = useMemo(
    () => accounts.filter((a) => a.accountType === "expense"),
    [accounts]
  );

  function openCreate() {
    setEditing(null);
    setType("expense");
    setName("");
    setAccountId("");
    setDefaultCostCode("");
    setDescription("");
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(h: HeadRow) {
    setEditing(h);
    setType(h.type === "income" ? "income" : "expense");
    setName(h.name);
    setAccountId(String(h.accountId));
    setDefaultCostCode(h.defaultCostCode ?? "");
    setDescription(h.description ?? "");
    setIsActive(h.isActive);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!name.trim() || !accountId) {
      setFormError("Name and Linked Account are required.");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/accounting/heads/${editing.id}`
        : "/api/accounting/heads";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: name.trim(),
          account_id: Number(accountId),
          default_cost_code: defaultCostCode.trim() || null,
          description: description.trim() || null,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save head.");
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
      const res = await fetch(`/api/accounting/heads/${deleteTarget.id}`, {
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
        icon="fa-solid fa-layer-group"
        title="Income / Expense Heads"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Accounting" },
          { label: "Heads" },
        ]}
        actions={
          <>
            <Link href="/accounting/income-expenses" className="btn btn-erp-ghost">
              <i className="fa-solid fa-money-bill-transfer me-2"></i>Entries
            </Link>
            <button type="button" className="btn btn-erp" onClick={openCreate}>
              <i className="fa-solid fa-plus me-2"></i>New Head
            </button>
          </>
        }
      />

      <div className="erp-card">
        {heads.length === 0 ? (
          <ErpEmptyState
            icon="fa-solid fa-layer-group"
            title="No heads yet"
            description="Add named income and expense heads mapped to your Chart of Accounts."
          />
        ) : (
          <div className="erp-table-wrap">
            <table className="table erp-table">
              <thead>
                <tr>
                  <th>Head</th>
                  <th>Type</th>
                  <th>Linked Account</th>
                  <th className="text-center">Entries</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {heads.map((h) => (
                  <tr key={h.id}>
                    <td className="erp-cell-strong">{h.name}</td>
                    <td>
                      <ErpPill tone={h.type === "income" ? "available" : "overdue"}>
                        <i
                          className={`fa-solid ${
                            h.type === "income" ? "fa-arrow-down-long" : "fa-arrow-up-long"
                          } me-1`}
                        ></i>
                        {h.type === "income" ? "Income" : "Expense"}
                      </ErpPill>
                    </td>
                    <td>
                      <span className="erp-cell-strong">{h.accountCode}</span> · {h.accountName}
                    </td>
                    <td className="text-center">{h.entriesCount}</td>
                    <td>
                      <ErpPill tone={h.isActive ? "available" : "neutral"}>
                        {h.isActive ? "Active" : "Inactive"}
                      </ErpPill>
                    </td>
                    <td>
                      <span className="erp-created-by">
                        <span className="erp-cell-strong">{h.createdBy || "—"}</span>
                        <span className="erp-identity-meta d-block">{h.createdAt}</span>
                      </span>
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        title="Edit"
                        onClick={() => openEdit(h)}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      {h.entriesCount > 0 ? (
                        <span
                          className="text-muted ms-1"
                          style={{ fontSize: 12 }}
                          title="In use by entries"
                        >
                          Locked
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(h)}
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
                    {editing ? "Edit head" : "New head"}
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
                    <div className="col-md-5">
                      <div className="erp-field">
                        <label className="form-label">
                          Type <span className="erp-required">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={type}
                          onChange={(e) => {
                            setType(e.target.value === "income" ? "income" : "expense");
                            setAccountId("");
                          }}
                          required
                        >
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-7">
                      <div className="erp-field">
                        <label className="form-label">
                          Name <span className="erp-required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={120}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="erp-field">
                        <label className="form-label">
                          Linked Account <span className="erp-required">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={accountId}
                          onChange={(e) => setAccountId(e.target.value)}
                          required
                        >
                          <option value="">— Choose the account this head posts to —</option>
                          {type === "income" ? (
                            <optgroup label="Income accounts">
                              {incomeAccounts.map((a) => (
                                <option key={a.id} value={String(a.id)}>
                                  {a.code} · {a.name}
                                </option>
                              ))}
                            </optgroup>
                          ) : (
                            <optgroup label="Expense accounts">
                              {expenseAccounts.map((a) => (
                                <option key={a.id} value={String(a.id)}>
                                  {a.code} · {a.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="erp-field">
                        <label className="form-label">Default Cost Code</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 14.01 — Site Office Rent"
                          value={defaultCostCode}
                          onChange={(e) => setDefaultCostCode(e.target.value)}
                        />
                        <span className="erp-help">
                          Proposed on every entry filed under this head, so spend reaches the right
                          budget line without anyone having to think about it. Optional — overheads
                          charged to no project need none.
                        </span>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="erp-field mb-2">
                        <label className="form-label">Description</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={500}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <label className="erp-check">
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
        title="Delete head?"
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
