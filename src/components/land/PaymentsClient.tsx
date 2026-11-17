"use client";

import React, { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PAYMENT_DIRECTIONS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  formatMoney,
  getLabel,
} from "@/lib/land";
import { ErpDeleteModal, ErpEmptyState, ErpPageHeader, ErpPill, ErpTableCard } from "@/components/ui";

export interface PaymentRow {
  id: number;
  voucherNo: string;
  direction: string;
  type: string;
  paymentDate: string;
  grossAmount: number;
  taxDeducted: number;
  otherDeduction: number;
  netAmount: number;
  method: string;
  accountName: string | null;
  bankName: string | null;
  chequeNo: string | null;
  transactionReference: string | null;
  status: string;
  parcel: { id: number; code: string; title: string | null; mouza: string };
  owner: { id: number; name: string } | null;
}

export default function PaymentsClient({
  payments,
  parcels,
  owners,
  filters,
}: {
  payments: PaymentRow[];
  parcels: { id: number; code: string; title: string | null; mouza: string }[];
  owners: { id: number; code: string; name: string }[];
  filters: {
    from: string;
    to: string;
    search: string;
    direction: string;
    type: string;
    status: string;
  };
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [parcelId, setParcelId] = useState("");
  const [type, setType] = useState("advance");
  const [paymentDate, setPaymentDate] = useState("2026-11-16");
  const [ownerId, setOwnerId] = useState("");
  const [grossAmount, setGrossAmount] = useState("");
  const [taxDeducted, setTaxDeducted] = useState("0");
  const [otherDeduction, setOtherDeduction] = useState("0");
  const [method, setMethod] = useState("bank_transfer");
  const [accountName, setAccountName] = useState("Main Operating Bank A/C");
  const [bankName, setBankName] = useState("BRAC Bank PLC");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [narration, setNarration] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentRow | null>(null);

  const netPayable = useMemo(() => {
    const g = Number(grossAmount) || 0;
    const t = Number(taxDeducted) || 0;
    const o = Number(otherDeduction) || 0;
    return Math.max(0, g - t - o);
  }, [grossAmount, taxDeducted, otherDeduction]);

  const showOwnerWrap = ![
    "investor_contribution",
    "investor_refund",
    "registration_cost",
    "other_cost",
  ].includes(type);
  const showBankWrap = method === "bank_transfer" || method === "cheque" || method === "pay_order";
  const showChequeWrap = method === "cheque" || method === "pay_order";

  async function submitVoucher(statusValue: "draft" | "posted") {
    setError("");
    if (!parcelId) {
      setError("Please choose a Land File.");
      return;
    }
    if (!grossAmount || Number(grossAmount) <= 0) {
      setError("Please enter a positive Gross Amount.");
      return;
    }
    if (showChequeWrap && !chequeNo.trim()) {
      setError("Cheque / Pay Order No. is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/land/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelId: Number(parcelId),
          ownerId: ownerId ? Number(ownerId) : null,
          type,
          paymentDate,
          grossAmount: Number(grossAmount),
          taxDeducted: Number(taxDeducted || 0),
          otherDeduction: Number(otherDeduction || 0),
          method,
          accountName,
          bankName: showBankWrap ? bankName : null,
          chequeNo: showChequeWrap ? chequeNo : null,
          chequeDate: showChequeWrap ? chequeDate : null,
          transactionReference,
          narration,
          status: statusValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save payment voucher.");
        setSaving(false);
        return;
      }
      setModalOpen(false);
      setParcelId("");
      setGrossAmount("");
      setTaxDeducted("0");
      setOtherDeduction("0");
      setChequeNo("");
      setTransactionReference("");
      setNarration("");
      setSaving(false);
      router.refresh();
    } catch {
      setError("Network error while saving payment voucher.");
      setSaving(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    submitVoucher("posted");
  }

  async function updateStatus(id: number, statusValue: string) {
    setBusyId(id);
    try {
      await fetch(`/api/land/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue }),
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
      await fetch(`/api/land/payments/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-hand-holding-dollar"
        title="Land Payments"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Land" },
          { label: "Payments" },
        ]}
        actions={
          <>
            <a href="/api/land/payments/export" className="btn btn-erp-ghost">
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </a>
            <button
              type="button"
              className="btn btn-erp"
              onClick={() => setModalOpen(true)}
            >
              <i className="fa-solid fa-plus me-2"></i>New Voucher
            </button>
          </>
        }
      />

      <ErpTableCard
        headerClass="erp-card-head"
        toolbar={
          <form method="GET" action="/land/payments" className="erp-filterbar">
            <div className="erp-daterange" aria-label="Payment date range">
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
                placeholder="Voucher, cheque, party…"
                aria-label="Search"
              />
            </div>
            <select
              name="direction"
              className="erp-select"
              defaultValue={filters.direction}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Direction"
            >
              <option value="">In &amp; out</option>
              {PAYMENT_DIRECTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
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
              {PAYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              name="status"
              className="erp-select"
              defaultValue={filters.status}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Status"
            >
              <option value="">Any status</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {(filters.from ||
              filters.to ||
              filters.search ||
              filters.direction ||
              filters.type ||
              filters.status) && (
              <Link href="/land/payments" className="btn btn-erp-ghost btn-sm">
                Reset
              </Link>
            )}
          </form>
        }
        countText={`${payments.length} ${payments.length === 1 ? "voucher" : "vouchers"}`}
        isEmpty={payments.length === 0}
        emptyState={
          <ErpEmptyState
            icon="fa-solid fa-hand-holding-dollar"
            title="No land money has moved"
            description={
              <>
                A voucher is raised against a land file and its live agreement. Start one
                with <strong>New Voucher</strong> above.
              </>
            }
          />
        }
      >
        <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Voucher No.</th>
                    <th>Land File &amp; Party</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th className="text-end">Gross</th>
                    <th className="text-end">Net Paid</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pm) => (
                    <tr key={pm.id}>
                      <td className="erp-cell-strong">{pm.voucherNo}</td>
                      <td>
                        <Link
                          href={`/land/parcels/${pm.parcel.id}`}
                          className="erp-cell-strong d-block text-decoration-none"
                        >
                          {pm.parcel.code} &mdash; {pm.parcel.title || pm.parcel.mouza}
                        </Link>
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {pm.owner?.name || "Acquisition / Cost"}
                        </span>
                      </td>
                      <td>{getLabel(PAYMENT_TYPES, pm.type)}</td>
                      <td>{pm.paymentDate}</td>
                      <td>
                        <span className="d-block">{getLabel(PAYMENT_METHODS, pm.method)}</span>
                        {(pm.chequeNo || pm.transactionReference) && (
                          <span className="text-muted" style={{ fontSize: 11.5 }}>
                            {pm.chequeNo ? `Chq #${pm.chequeNo}` : pm.transactionReference}
                          </span>
                        )}
                      </td>
                      <td className="text-end">৳ {formatMoney(pm.grossAmount)}</td>
                      <td className="text-end erp-cell-strong">
                        ৳ {formatMoney(pm.netAmount)}
                      </td>
                      <td>
                        <ErpPill
                          tone={
                            pm.status === "posted"
                              ? "available"
                              : pm.status === "draft"
                              ? "hold"
                              : "overdue"
                          }
                        >
                          {getLabel(PAYMENT_STATUSES, pm.status)}
                        </ErpPill>
                      </td>
                      <td className="text-end text-nowrap">
                        {pm.status === "draft" && (
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm me-1 text-success"
                            title="Post voucher"
                            disabled={busyId === pm.id}
                            onClick={() => updateStatus(pm.id, "posted")}
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          disabled={busyId === pm.id}
                          onClick={() => setDeleteTarget(pm)}
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
        title="Delete payment voucher?"
        description={
          deleteTarget && (
            <>
              Delete payment voucher <strong>{deleteTarget.voucherNo}</strong>?
            </>
          )
        }
        busy={Boolean(deleteTarget && busyId === deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {/* New Payment Voucher Modal */}
      {modalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div
            className="modal fade show d-block"
            id="paymentModal"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <form className="erp-form" onSubmit={handleFormSubmit} noValidate>
                  <div className="modal-header">
                    <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>
                      <i className="fa-solid fa-hand-holding-dollar me-2 text-muted"></i>
                      New Payment Voucher
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      onClick={() => setModalOpen(false)}
                    />
                  </div>

                  <div className="modal-body pb-0">
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    <div className="erp-field mb-0">
                      <label className="form-label">
                        Land File <span className="erp-required">*</span>
                      </label>
                      <select
                        className="form-select"
                        required
                        value={parcelId}
                        onChange={(e) => setParcelId(e.target.value)}
                      >
                        <option value="">Choose a land file</option>
                        {parcels.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.code} — {p.title || p.mouza}
                          </option>
                        ))}
                      </select>
                      {parcels.length === 0 && (
                        <small className="text-muted">
                          Create a land parcel first before posting a payment voucher.
                        </small>
                      )}
                    </div>
                  </div>

                  <fieldset
                    disabled={!parcelId}
                    style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
                  >
                    <div className="modal-body">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="erp-field">
                            <label className="form-label">
                              Payment Type <span className="erp-required">*</span>
                            </label>
                            <select
                              name="type"
                              className="form-select"
                              required
                              value={type}
                              onChange={(e) => setType(e.target.value)}
                            >
                              {PAYMENT_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="erp-field">
                            <label className="form-label">
                              Date <span className="erp-required">*</span>
                            </label>
                            <input
                              type="date"
                              name="payment_date"
                              className="form-control"
                              required
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {showOwnerWrap && (
                        <div className="row">
                          <div className="col-md-12">
                            <div className="erp-field">
                              <label className="form-label">Landowner</label>
                              <select
                                name="land_owner_id"
                                className="form-select"
                                value={ownerId}
                                onChange={(e) => setOwnerId(e.target.value)}
                              >
                                <option value="">Select landowner (optional)</option>
                                {owners.map((o) => (
                                  <option key={o.id} value={String(o.id)}>
                                    {o.code} — {o.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="row">
                        <div className="col-md-4">
                          <div className="erp-field">
                            <label className="form-label">
                              Gross Amount <span className="erp-required">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              name="gross_amount"
                              className="form-control"
                              required
                              value={grossAmount}
                              onChange={(e) => setGrossAmount(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="erp-field">
                            <label className="form-label">Tax Deducted (AIT)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              name="tax_deducted"
                              className="form-control"
                              value={taxDeducted}
                              onChange={(e) => setTaxDeducted(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="erp-field">
                            <label className="form-label">Other Deduction</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              name="other_deduction"
                              className="form-control"
                              value={otherDeduction}
                              onChange={(e) => setOtherDeduction(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div
                        className="alert alert-secondary py-2"
                        style={{ borderRadius: 10, fontSize: 13 }}
                      >
                        Net payable: <strong>{formatMoney(netPayable)}</strong>{" "}
                        <span className="text-muted">
                          — gross is credited against the installment; net is what leaves
                          the bank.
                        </span>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="erp-field">
                            <label className="form-label">
                              Method <span className="erp-required">*</span>
                            </label>
                            <select
                              name="method"
                              className="form-select"
                              required
                              value={method}
                              onChange={(e) => setMethod(e.target.value)}
                            >
                              {PAYMENT_METHODS.map((m) => (
                                <option key={m.value} value={m.value}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="erp-field">
                            <label className="form-label">
                              Paid Through <span className="erp-required">*</span>
                            </label>
                            <select
                              name="account_id"
                              className="form-select"
                              value={accountName}
                              onChange={(e) => setAccountName(e.target.value)}
                            >
                              <option value="Main Operating Bank A/C">
                                Main Operating Bank A/C
                              </option>
                              <option value="Land Acquisition Escrow A/C">
                                Land Acquisition Escrow A/C
                              </option>
                              <option value="Petty Cash — HQ">Petty Cash — HQ</option>
                            </select>
                          </div>
                        </div>
                        {showBankWrap && (
                          <div className="col-md-4">
                            <div className="erp-field">
                              <label className="form-label">Bank</label>
                              <input
                                type="text"
                                className="form-control"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {showChequeWrap && (
                        <div className="row">
                          <div className="col-md-6">
                            <div className="erp-field">
                              <label className="form-label">
                                Cheque No. <span className="erp-required">*</span>
                              </label>
                              <input
                                type="text"
                                name="cheque_no"
                                className="form-control"
                                maxLength={40}
                                value={chequeNo}
                                onChange={(e) => setChequeNo(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="erp-field">
                              <label className="form-label">Cheque Date</label>
                              <input
                                type="date"
                                name="cheque_date"
                                className="form-control"
                                value={chequeDate}
                                onChange={(e) => setChequeDate(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="row">
                        <div className="col-md-6">
                          <div className="erp-field">
                            <label className="form-label">Transaction Reference</label>
                            <input
                              type="text"
                              name="transaction_reference"
                              className="form-control"
                              maxLength={80}
                              value={transactionReference}
                              onChange={(e) => setTransactionReference(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="erp-field">
                            <label className="form-label">Narration</label>
                            <input
                              type="text"
                              name="narration"
                              className="form-control"
                              maxLength={2000}
                              value={narration}
                              onChange={(e) => setNarration(e.target.value)}
                            />
                          </div>
                        </div>
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
                      <button
                        type="button"
                        className="btn btn-erp-ghost"
                        disabled={saving}
                        onClick={() => submitVoucher("draft")}
                      >
                        Save as Draft
                      </button>
                      <button type="submit" className="btn btn-erp" disabled={saving}>
                        {saving ? "Saving…" : "Post Voucher"}
                      </button>
                    </div>
                  </fieldset>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
