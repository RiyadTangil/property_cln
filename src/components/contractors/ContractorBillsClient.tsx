"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";
import { ContractorsSubmenu } from "./ContractorsSubmenu";
import { COA_ACCOUNT_OPTIONS } from "./contractor-options";

interface BillRow {
  id: number;
  code: string;
  billDate: string;
  grossAmount: number;
  retentionAmount: number;
  netPayable: number;
  status: string;
  contractorId?: number;
  projectId?: number | null;
  contractor: { id?: number; name: string };
}

interface PaymentRow {
  id: number;
  code: string;
  kind: string;
  paymentDate: string;
  amount: number;
  method: string;
  reference: string | null;
  notes?: string | null;
  contractorId?: number;
  contractor: { id?: number; name: string };
}

export function ContractorBillsClient({
  bills,
  contractors = [],
  projects = [],
}: {
  bills: BillRow[];
  contractors?: { id: number; name: string }[];
  projects?: { id: number; code?: string; name: string }[];
}) {
  const [contractorFilter, setContractorFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = bills.filter((b) => {
    if (contractorFilter) {
      const cId = b.contractor.id ?? b.contractorId;
      if (String(cId ?? "") !== contractorFilter) return false;
    }
    if (projectFilter && String(b.projectId ?? "") !== projectFilter) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    if (fromDate && b.billDate < fromDate) return false;
    if (toDate && b.billDate > toDate) return false;
    return true;
  });

  const nonCancelled = filtered.filter((b) => b.status !== "cancelled");
  const certified = nonCancelled.reduce((s, b) => s + b.grossAmount, 0);
  const netPayableTotal = nonCancelled.reduce((s, b) => s + b.netPayable, 0);
  const retention = nonCancelled.reduce((s, b) => s + b.retentionAmount, 0);
  const awaitingCount = filtered.filter(
    (b) => b.status === "submitted" || b.status === "certified"
  ).length;

  return (
    <div className="container ">
      <ContractorsSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-file-invoice-dollar" />
          </div>
          <div>
            <h1>Running Account Bills</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/contractors">Contractors</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Bills
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() =>
              downloadCsv(
                "ra-bills.csv",
                ["Bill", "Contractor", "Date", "Gross", "Retention", "Net Payable", "Status"],
                filtered.map((b) => [
                  b.code,
                  b.contractor.name,
                  b.billDate,
                  b.grossAmount,
                  b.retentionAmount,
                  b.netPayable,
                  b.status,
                ])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2" />
            Export
          </button>
        </div>
      </div>

      <div className="erp-sale-strip">
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Bills</span>
          <strong>{nonCancelled.length}</strong>
          <span className="erp-sale-stat-foot">Cancelled ones excluded</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Certified value</span>
          <strong>{certified.toFixed(2)}</strong>
          <span className="erp-sale-stat-foot">{netPayableTotal.toFixed(2)} net of deductions</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Retention held</span>
          <strong>{retention.toFixed(2)}</strong>
          <span className="erp-sale-stat-foot">Withheld across these bills</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Awaiting action</span>
          <strong className="">{awaitingCount}</strong>
          <span className="erp-sale-stat-foot">Submitted or certified, not yet posted</span>
        </div>
      </div>

      <div className="erp-card mt-3">
        <div className="erp-card-body">
          <form
            method="GET"
            className="erp-filterbar mb-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-field mb-0">
              <select
                name="contractor_id"
                className="form-select"
                value={contractorFilter}
                onChange={(e) => setContractorFilter(e.target.value)}
              >
                <option value="">Any contractor</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="erp-field mb-0">
              <select
                name="project_id"
                className="form-select"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="">Any project</option>
                {projects.length > 0 ? (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code || p.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="2">PRJ-2026-002</option>
                    <option value="1">PRJ-2026-001</option>
                  </>
                )}
              </select>
            </div>
            <div className="erp-field mb-0">
              <select
                name="status"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Any status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="certified">Certified</option>
                <option value="posted">Posted</option>
                <option value="partially_paid">Partly Paid</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="erp-field mb-0">
              <input
                type="date"
                name="from"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="erp-field mb-0">
              <input
                type="date"
                name="to"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-erp-ghost">
              <i className="fa-solid fa-filter me-1" />
              Filter
            </button>
          </form>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-file-invoice-dollar" />
              </div>
              <h3>No bills yet</h3>
              <p>Raise a bill from the work order it measures against.</p>
            </div>
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table mb-0">
                <thead>
                  <tr>
                    <th>Bill</th>
                    <th>Contractor</th>
                    <th>Date</th>
                    <th className="text-end">Gross</th>
                    <th className="text-end">Retention</th>
                    <th className="text-end">Net Payable</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <code>{b.code}</code>
                      </td>
                      <td className="erp-cell-strong">{b.contractor.name}</td>
                      <td>{b.billDate}</td>
                      <td className="text-end">
                        {b.grossAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-end">
                        {b.retentionAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-end">
                        {b.netPayable.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        <span className="erp-pill is-booked text-capitalize">
                          {b.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContractorPaymentsClient({
  payments: initial,
  contractors,
  projects,
}: {
  payments: PaymentRow[];
  contractors: { id: number; name: string }[];
  projects: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [payments, setPayments] = useState(initial);
  const [contractorFilter, setContractorFilter] = useState("");
  const [modalKind, setModalKind] = useState<null | "advance" | "payment">(null);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");

  // Advance form state
  const [advContractorId, setAdvContractorId] = useState(String(contractors[0]?.id ?? ""));
  const [advDate, setAdvDate] = useState(new Date().toISOString().slice(0, 10));
  const [advType, setAdvType] = useState("mobilisation");
  const [advAmount, setAdvAmount] = useState("");
  const [advRecoveryPercent, setAdvRecoveryPercent] = useState("0");
  const [advBankAccountId, setAdvBankAccountId] = useState("");
  const [advReference, setAdvReference] = useState("");

  // Payment form state
  const [payContractorId, setPayContractorId] = useState(String(contractors[0]?.id ?? ""));
  const [payBillId, setPayBillId] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank");
  const [payBankAccountId, setPayBankAccountId] = useState("");
  const [payChequeNo, setPayChequeNo] = useState("");
  const [payReference, setPayReference] = useState("");
  const [isRetentionRelease, setIsRetentionRelease] = useState(false);

  const filteredPayments = payments.filter((p) => {
    if (!contractorFilter) return true;
    const cId = p.contractor.id ?? p.contractorId;
    return String(cId ?? "") === contractorFilter;
  });

  const advanceList = filteredPayments.filter((p) => p.kind === "advance");
  const paymentList = filteredPayments.filter((p) => p.kind !== "advance");

  const advancesTotal = advanceList.reduce((s, p) => s + p.amount, 0);
  const paidTotal = paymentList.reduce((s, p) => s + p.amount, 0);
  const retentionReleasedTotal = paymentList
    .filter((p) => p.notes?.includes("retention_release"))
    .reduce((s, p) => s + p.amount, 0);

  async function handleRaiseAdvance(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorText("");
    try {
      const res = await fetch("/api/contractors/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: Number(advContractorId),
          project_id: projects[0]?.id ?? null,
          kind: "advance",
          payment_date: advDate,
          amount: Number(advAmount) || 0,
          method: "bank",
          reference: advReference || null,
          notes: `type:${advType};recovery:${advRecoveryPercent}%;account:${advBankAccountId}`,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setPayments((prev) => [d.payment, ...prev]);
        setModalKind(null);
        setAdvAmount("");
        setAdvReference("");
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorText(err.error || "Failed to record advance.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRaisePayment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorText("");
    try {
      const res = await fetch("/api/contractors/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: Number(payContractorId),
          project_id: projects[0]?.id ?? null,
          kind: "payment",
          payment_date: payDate,
          amount: Number(payAmount) || 0,
          method: payMethod,
          reference: payReference || payChequeNo || null,
          notes: `${isRetentionRelease ? "retention_release;" : ""}bill:${payBillId};account:${payBankAccountId}`,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setPayments((prev) => [d.payment, ...prev]);
        setModalKind(null);
        setPayAmount("");
        setPayChequeNo("");
        setPayReference("");
        setIsRetentionRelease(false);
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorText(err.error || "Failed to record payment.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container ">
      <ContractorsSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-money-bill-transfer" />
          </div>
          <div>
            <h1>Advances &amp; Payments</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/contractors">Contractors</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Advances &amp; Payments
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <button
            type="button"
            className="btn btn-erp-ghost"
            data-bs-toggle="modal"
            data-bs-target="#advanceModal"
            onClick={() => {
              setErrorText("");
              setModalKind("advance");
            }}
          >
            <i className="fa-solid fa-hand-holding-dollar me-2" />
            New Advance
          </button>
          <button
            type="button"
            className="btn btn-erp"
            data-bs-toggle="modal"
            data-bs-target="#paymentModal"
            onClick={() => {
              setErrorText("");
              setModalKind("payment");
            }}
          >
            <i className="fa-solid fa-plus me-2" />
            New Payment
          </button>
        </div>
      </div>

      <div className="erp-sale-strip">
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Advances given</span>
          <strong>{advancesTotal.toFixed(2)}</strong>
          <span className="erp-sale-stat-foot">0.00 recovered</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Advance outstanding</span>
          <strong className="">{advancesTotal.toFixed(2)}</strong>
          <span className="erp-sale-stat-foot">Still to come off future bills</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Paid</span>
          <strong>{paidTotal.toFixed(2)}</strong>
          <span className="erp-sale-stat-foot">Against certified bills</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Retention released</span>
          <strong>{retentionReleasedTotal.toFixed(2)}</strong>
          <span className="erp-sale-stat-foot">Paid back after the defect period</span>
        </div>
      </div>

      <div className="erp-card mt-3">
        <div className="erp-card-body">
          <form
            method="GET"
            className="erp-filterbar mb-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-field mb-0">
              <select
                name="contractor_id"
                className="form-select"
                value={contractorFilter}
                onChange={(e) => setContractorFilter(e.target.value)}
              >
                <option value="">Any contractor</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-erp-ghost">
              <i className="fa-solid fa-filter me-1" />
              Filter
            </button>
          </form>
        </div>
      </div>

      <div className="row g-3 mt-0">
        <div className="col-xl-6">
          <div className="erp-card">
            <div className="erp-card-head">
              <div>
                <h2>Advances</h2>
                <p>Recovered from later bills rather than repaid.</p>
              </div>
            </div>
            <div className="erp-card-body">
              {advanceList.length === 0 ? (
                <p className="erp-cv-empty mb-0">No advances.</p>
              ) : (
                <div className="erp-table-wrap">
                  <table className="table erp-table mb-0">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Contractor</th>
                        <th>Date</th>
                        <th className="text-end">Amount</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advanceList.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <code>{a.code}</code>
                          </td>
                          <td className="erp-cell-strong">{a.contractor.name}</td>
                          <td>{a.paymentDate}</td>
                          <td className="text-end">
                            {a.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>{a.reference || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="erp-card">
            <div className="erp-card-head">
              <div>
                <h2>Payments</h2>
                <p>Retention releases are marked — they do not settle the bill they sit against.</p>
              </div>
            </div>
            <div className="erp-card-body">
              {paymentList.length === 0 ? (
                <p className="erp-cv-empty mb-0">No payments.</p>
              ) : (
                <div className="erp-table-wrap">
                  <table className="table erp-table mb-0">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Contractor</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th className="text-end">Amount</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentList.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <code>{p.code}</code>
                          </td>
                          <td className="erp-cell-strong">{p.contractor.name}</td>
                          <td>{p.paymentDate}</td>
                          <td className="text-capitalize">{p.method}</td>
                          <td className="text-end">
                            {p.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>{p.reference || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advance Modal */}
      <div
        className={`modal fade ${modalKind === "advance" ? "show d-block" : ""}`}
        id="advanceModal"
        tabIndex={-1}
        aria-hidden={modalKind !== "advance"}
        style={modalKind === "advance" ? { background: "rgba(0,0,0,0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            className="modal-content erp-form"
            data-adv-form
            data-submit-lock="off"
            action="/contractors/advances"
            style={{ border: "none", borderRadius: "14px" }}
            onSubmit={handleRaiseAdvance}
          >
            <div className="modal-body p-4">
              <h5 className="mb-1" style={{ fontSize: "16px", fontWeight: 600 }}>
                New advance
              </h5>
              <p className="text-muted mb-3" style={{ fontSize: "12.5px" }}>
                Money paid before the work it pays for. It is recovered from later bills
                rather than repaid.
              </p>

              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-adv-error
                hidden={!errorText}
              >
                <span data-adv-error-text>{errorText}</span>
              </div>

              <div className="erp-field">
                <label className="form-label">
                  Contractor <span className="erp-required">*</span>
                </label>
                <select
                  className="form-select"
                  data-select2
                  data-afield="contractor_id"
                  required
                  value={advContractorId}
                  onChange={(e) => setAdvContractorId(e.target.value)}
                >
                  <option value="">— Choose —</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">
                      Date <span className="erp-required">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      data-afield="advance_date"
                      value={advDate}
                      onChange={(e) => setAdvDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      data-select2
                      data-afield="advance_type"
                      value={advType}
                      onChange={(e) => setAdvType(e.target.value)}
                    >
                      <option value="mobilisation">Mobilisation</option>
                      <option value="secured">Secured (material on site)</option>
                      <option value="adhoc">Ad-hoc</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">
                      Amount <span className="erp-required">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      data-afield="amount"
                      required
                      value={advAmount}
                      onChange={(e) => setAdvAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Recovery %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="form-control"
                      data-afield="recovery_percent"
                      value={advRecoveryPercent}
                      onChange={(e) => setAdvRecoveryPercent(e.target.value)}
                    />
                    <span className="erp-help">
                      0 recovers it all on the first bill that can carry it.
                    </span>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Paid from</label>
                    <select
                      className="form-select"
                      data-select2
                      data-placeholder="Choose at payment"
                      data-afield="bank_account_id"
                      value={advBankAccountId}
                      onChange={(e) => setAdvBankAccountId(e.target.value)}
                    >
                      <option value="">— Choose later —</option>
                      {COA_ACCOUNT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} data-meta={opt.meta}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field mb-0">
                    <label className="form-label">Reference</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={120}
                      data-afield="reference"
                      value={advReference}
                      onChange={(e) => setAdvReference(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setModalKind(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" data-adv-submit disabled={busy}>
                <i className="fa-solid fa-floppy-disk me-1" />
                Raise
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Payment Modal */}
      <div
        className={`modal fade ${modalKind === "payment" ? "show d-block" : ""}`}
        id="paymentModal"
        tabIndex={-1}
        aria-hidden={modalKind !== "payment"}
        style={modalKind === "payment" ? { background: "rgba(0,0,0,0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            className="modal-content erp-form"
            data-pay-form
            data-submit-lock="off"
            action="/contractors/payments"
            style={{ border: "none", borderRadius: "14px" }}
            onSubmit={handleRaisePayment}
          >
            <div className="modal-body p-4">
              <h5 className="mb-1" style={{ fontSize: "16px", fontWeight: 600 }}>
                New payment
              </h5>
              <p className="text-muted mb-3" style={{ fontSize: "12.5px" }}>
                Against a certified bill, or on account. A payment can never exceed what the
                bill still has outstanding.
              </p>

              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-pay-error
                hidden={!errorText}
              >
                <span data-pay-error-text>{errorText}</span>
              </div>

              <div className="erp-field">
                <label className="form-label">
                  Contractor <span className="erp-required">*</span>
                </label>
                <select
                  className="form-select"
                  data-select2
                  data-pfield="contractor_id"
                  required
                  data-pay-contractor
                  value={payContractorId}
                  onChange={(e) => setPayContractorId(e.target.value)}
                >
                  <option value="">— Choose —</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="erp-field">
                <label className="form-label">Against bill</label>
                <select
                  className="form-select"
                  data-pfield="bill_id"
                  data-pay-bill
                  value={payBillId}
                  onChange={(e) => setPayBillId(e.target.value)}
                >
                  <option value="">— On account —</option>
                </select>
                <span className="erp-help" data-pay-outstanding />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">
                      Date <span className="erp-required">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      data-pfield="payment_date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">
                      Amount <span className="erp-required">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      data-pfield="amount"
                      required
                      data-pay-amount
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Method</label>
                    <select
                      className="form-select"
                      data-select2
                      data-pfield="payment_method"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                    >
                      <option value="bank">Bank transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Paid from</label>
                    <select
                      className="form-select"
                      data-select2
                      data-placeholder="Choose at payment"
                      data-pfield="bank_account_id"
                      value={payBankAccountId}
                      onChange={(e) => setPayBankAccountId(e.target.value)}
                    >
                      <option value="">— Choose later —</option>
                      {COA_ACCOUNT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} data-meta={opt.meta}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Cheque no.</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={60}
                      data-pfield="cheque_no"
                      value={payChequeNo}
                      onChange={(e) => setPayChequeNo(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Reference</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={120}
                      data-pfield="reference"
                      value={payReference}
                      onChange={(e) => setPayReference(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="erp-field mb-0">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    data-pfield-check="is_retention_release"
                    checked={isRetentionRelease}
                    onChange={(e) => setIsRetentionRelease(e.target.checked)}
                  />
                  <label className="form-check-label" style={{ fontSize: "12.5px" }}>
                    This is a retention release
                    <span className="erp-help d-block">
                      It will not count toward settling the bill — that bill was already paid net of it.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setModalKind(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" data-pay-submit disabled={busy}>
                <i className="fa-solid fa-floppy-disk me-1" />
                Raise
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
