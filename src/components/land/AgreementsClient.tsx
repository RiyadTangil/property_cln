"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AGREEMENT_STATUSES,
  AGREEMENT_TYPES,
  formatMoney,
  getLabel,
} from "@/lib/land";
import { ErpDeleteModal, ErpEmptyState, ErpPageHeader, ErpTableCard } from "@/components/ui";

export interface AgreementRow {
  id: number;
  code: string;
  parcelId: number;
  ownerId: number | null;
  type: string;
  status: string;
  agreementDate: string;
  expiryDate: string | null;
  agreedPrice: number;
  advanceAmount: number;
  advanceSettled: boolean;
  parcel: { id: number; code: string; title: string | null; mouza: string };
  owner: { id: number; code: string; name: string } | null;
}

export default function AgreementsClient({
  agreements,
  parcels,
  owners,
  filters,
}: {
  agreements: AgreementRow[];
  parcels: { id: number; code: string; title: string | null; mouza: string }[];
  owners: { id: number; code: string; name: string }[];
  filters: {
    from: string;
    to: string;
    search: string;
    status: string;
    type: string;
    flag: string;
  };
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [parcelId, setParcelId] = useState(parcels[0] ? String(parcels[0].id) : "");
  const [ownerId, setOwnerId] = useState(owners[0] ? String(owners[0].id) : "");
  const [type, setType] = useState("sale_agreement");
  const [status, setStatus] = useState("active");
  const [agreementDate, setAgreementDate] = useState("2026-11-16");
  const [expiryDate, setExpiryDate] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgreementRow | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!parcelId || !agreedPrice || Number(agreedPrice) <= 0) {
      setError("Please select a Land File and enter a positive Agreed Price.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/land/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelId: Number(parcelId),
          ownerId: ownerId ? Number(ownerId) : null,
          type,
          status,
          agreementDate,
          expiryDate: expiryDate || null,
          agreedPrice: Number(agreedPrice),
          advanceAmount: Number(advanceAmount || 0),
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create agreement.");
        setSaving(false);
        return;
      }
      setModalOpen(false);
      setAgreedPrice("");
      setAdvanceAmount("0");
      setNotes("");
      setSaving(false);
      router.refresh();
    } catch {
      setError("Network error while saving agreement.");
      setSaving(false);
    }
  }

  async function updateStatus(id: number, nextStatus: string) {
    setBusyId(id);
    try {
      await fetch(`/api/land/agreements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await fetch(`/api/land/agreements/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-file-signature"
        title="Agreements & MOU"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Land" },
          { label: "Agreements" },
        ]}
        actions={
          <>
            <a href="/api/land/agreements/export" className="btn btn-erp-ghost">
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </a>
            <button
              type="button"
              className="btn btn-erp"
              onClick={() => setModalOpen(true)}
              disabled={parcels.length === 0}
            >
              <i className="fa-solid fa-plus me-2"></i>Draft Agreement
            </button>
          </>
        }
      />

      <ErpTableCard
        headerClass="erp-card-head"
        toolbar={
          <form method="GET" action="/land/agreements" className="erp-filterbar">
            <div className="erp-daterange" aria-label="Agreement date range">
              <input
                type="date"
                name="from"
                defaultValue={filters.from}
                className="erp-select"
                onChange={(e) => e.currentTarget.form?.submit()}
                aria-label="From"
              />
              <span>–</span>
              <input
                type="date"
                name="to"
                defaultValue={filters.to}
                className="erp-select"
                onChange={(e) => e.currentTarget.form?.submit()}
                aria-label="To"
              />
            </div>
            <div className="erp-search erp-search-sm">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Agreement or land…"
                aria-label="Search"
              />
            </div>
            <select
              name="status"
              className="erp-select"
              defaultValue={filters.status}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Status"
            >
              <option value="">Any status</option>
              {AGREEMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              name="type"
              className="erp-select"
              defaultValue={filters.type}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Type"
            >
              <option value="">Any type</option>
              {AGREEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              name="flag"
              className="erp-select"
              defaultValue={filters.flag}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Attention"
            >
              <option value="">All</option>
              <option value="expiring">Expiring soon</option>
              <option value="unsettled_advance">Advance unsettled</option>
            </select>
            {(filters.from ||
              filters.to ||
              filters.search ||
              filters.status ||
              filters.type ||
              filters.flag) && (
              <Link href="/land/agreements" className="btn btn-erp-ghost btn-sm">
                Reset
              </Link>
            )}
          </form>
        }
        countText={`${agreements.length} ${agreements.length === 1 ? "agreement" : "agreements"}`}
        isEmpty={agreements.length === 0}
        emptyState={
          <ErpEmptyState
            icon="fa-solid fa-file-signature"
            title="No agreements yet"
            description="Agreements are drafted from a land file once an acquisition proposal is approved."
            action={
              parcels.length > 0 ? (
                <button
                  type="button"
                  className="btn btn-erp"
                  onClick={() => setModalOpen(true)}
                >
                  <i className="fa-solid fa-plus me-2"></i>Draft Agreement
                </button>
              ) : undefined
            }
          />
        }
      >
        <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Agreement</th>
                    <th>Land File &amp; Owner</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th className="text-end">Agreed Price</th>
                    <th className="text-end">Advance</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((ag) => (
                    <tr key={ag.id}>
                      <td className="erp-cell-strong">{ag.code}</td>
                      <td>
                        <Link
                          href={`/land/parcels/${ag.parcel.id}`}
                          className="erp-cell-strong d-block text-decoration-none"
                        >
                          {ag.parcel.code} &mdash; {ag.parcel.title || ag.parcel.mouza}
                        </Link>
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {ag.owner ? `${ag.owner.name} (${ag.owner.code})` : "No owner linked"}
                        </span>
                      </td>
                      <td>{getLabel(AGREEMENT_TYPES, ag.type)}</td>
                      <td>
                        <span className="d-block">{ag.agreementDate}</span>
                        {ag.expiryDate && (
                          <span className="text-muted" style={{ fontSize: 11.5 }}>
                            Exp: {ag.expiryDate}
                          </span>
                        )}
                      </td>
                      <td className="text-end erp-cell-strong">
                        ৳ {formatMoney(ag.agreedPrice)}
                      </td>
                      <td className="text-end">৳ {formatMoney(ag.advanceAmount)}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={ag.status}
                          disabled={busyId === ag.id}
                          onChange={(e) => updateStatus(ag.id, e.target.value)}
                          style={{ minWidth: 135 }}
                        >
                          {AGREEMENT_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          disabled={busyId === ag.id}
                          onClick={() => setDeleteTarget(ag)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
        </table>
      </ErpTableCard>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete agreement?"
        description={
          deleteTarget && (
            <>
              Delete agreement <strong>{deleteTarget.code}</strong>?
            </>
          )
        }
        busy={Boolean(deleteTarget && busyId === deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {/* Draft Agreement Modal */}
      {modalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleSubmit} className="erp-form" noValidate>
                  <div className="modal-header">
                    <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>
                      <i className="fa-solid fa-file-signature me-2 text-muted"></i>
                      Draft Agreement / MOU
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setModalOpen(false)}
                    />
                  </div>
                  <div className="modal-body">
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">
                            Land File <span className="erp-required">*</span>
                          </label>
                          <select
                            className="form-select"
                            value={parcelId}
                            onChange={(e) => setParcelId(e.target.value)}
                            required
                          >
                            {parcels.map((p) => (
                              <option key={p.id} value={String(p.id)}>
                                {p.code} — {p.title || p.mouza}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">Landowner</label>
                          <select
                            className="form-select"
                            value={ownerId}
                            onChange={(e) => setOwnerId(e.target.value)}
                          >
                            <option value="">Select owner (optional)</option>
                            {owners.map((o) => (
                              <option key={o.id} value={String(o.id)}>
                                {o.code} — {o.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">
                            Agreement Type <span className="erp-required">*</span>
                          </label>
                          <select
                            className="form-select"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                          >
                            {AGREEMENT_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                          >
                            {AGREEMENT_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-3">
                        <div className="erp-field">
                          <label className="form-label">
                            Agreement Date <span className="erp-required">*</span>
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            value={agreementDate}
                            onChange={(e) => setAgreementDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="erp-field">
                          <label className="form-label">Expiry Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="erp-field">
                          <label className="form-label">
                            Agreed Price <span className="erp-required">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-control"
                            value={agreedPrice}
                            onChange={(e) => setAgreedPrice(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="erp-field">
                          <label className="form-label">Advance Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-control"
                            value={advanceAmount}
                            onChange={(e) => setAdvanceAmount(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="erp-field mb-0">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-erp" disabled={saving}>
                      {saving ? "Saving…" : "Save Agreement"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
