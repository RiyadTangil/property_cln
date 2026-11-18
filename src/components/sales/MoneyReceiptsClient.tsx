"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

export interface MoneyReceiptItem {
  id: number;
  code: string;
  customerId: number | null;
  apartmentSaleId: number | null;
  paymentDate: string;
  paymentTypeId: number | null;
  accountId: number | null;
  amount: number;
  method: string;
  reference: string | null;
  narration: string | null;
  status: string;
}

export interface CustomerRef {
  id: number;
  code: string;
  firstName: string | null;
  lastName: string | null;
  organisationName: string | null;
  mobile: string | null;
}

export interface AccountRef {
  id: number;
  code: string;
  name: string;
}

export interface SaleItemRef {
  id: number;
  code: string;
  customerId: number | null;
  totalAmount: number;
  paidAmount: number;
}

interface MoneyReceiptsClientProps {
  view: "payments" | "payments_create";
  payments?: MoneyReceiptItem[];
  customers?: CustomerRef[];
  accounts?: AccountRef[];
  sales?: SaleItemRef[];
}

export default function MoneyReceiptsClient({
  view,
  payments = [],
  customers = [],
  accounts = [],
  sales = [],
}: MoneyReceiptsClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // /payments filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState("");

  // /payments/create form state
  const [form, setForm] = useState({
    customer_id: "",
    payment_date: "2026-11-18",
    payment_type_id: "",
    account_id: "",
    reference: "",
    narration: "",
    apartment_sale_id: "",
    amount: "0",
    method: "bank",
  });

  const [tenders, setTenders] = useState<
    Array<{ id: number; method: string; amount: string }>
  >([{ id: 1, method: "bank", amount: "0" }]);

  const totalReceived = tenders.reduce(
    (acc, t) => acc + (Number(t.amount) || 0),
    0
  );

  async function handleCreateReceipt(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: totalReceived || Number(form.amount) || 0,
          method: tenders[0]?.method || form.method,
        }),
      });
      if (res.ok) {
        router.push("/payments");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "payments") {
    const filtered = payments.filter((p) => {
      if (fromDate && p.paymentDate < fromDate) return false;
      if (toDate && p.paymentDate > toDate) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (methodFilter && p.method !== methodFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const cust = customers.find((c) => c.id === p.customerId);
        const custName = cust
          ? `${cust.firstName} ${cust.lastName ?? ""}`.toLowerCase()
          : "";
        if (
          !p.code.toLowerCase().includes(q) &&
          !custName.includes(q) &&
          !(p.reference ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });

    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div>
              <h1>Money Receipts</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Sales</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Money Receipts
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() => downloadCsv("money-receipts.csv", ["Code", "Date", "Method", "Amount", "Status"], filtered.map((r) => [r.code, r.paymentDate, r.method, r.amount, r.status]))}
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/payments/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>Receive Payment
            </Link>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-card-head">
            <form
              method="GET"
              action="/payments"
              className="erp-filterbar"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-daterange" aria-label="Receipt date range">
                <input
                  type="date"
                  name="from"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="erp-select"
                  aria-label="From"
                />
                <span>–</span>
                <input
                  type="date"
                  name="to"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="erp-select"
                  aria-label="To"
                />
              </div>
              <div className="erp-search erp-search-sm">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Receipt, customer, cheque…"
                  aria-label="Search"
                />
              </div>
              <select
                name="source"
                className="erp-select"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                aria-label="Source"
              >
                <option value="">All modules</option>
                <option value="apartment_sale">Apartment Sale</option>
                <option value="pos_sale">POS Sale</option>
                <option value="other">Other</option>
              </select>
              <select
                name="status"
                className="erp-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Status"
              >
                <option value="">Any status</option>
                <option value="draft">Draft</option>
                <option value="posted">Posted</option>
                <option value="bounced">Bounced</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                name="method"
                className="erp-select"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                aria-label="Method"
              >
                <option value="">Any method</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="mfs">MFS (Mobile)</option>
              </select>
              <select
                name="flag"
                className="erp-select"
                value={flagFilter}
                onChange={(e) => setFlagFilter(e.target.value)}
                aria-label="Attention"
              >
                <option value="">All receipts</option>
                <option value="uncleared">Awaiting clearance</option>
                <option value="bounced">Bounced</option>
                <option value="advance">Has advance</option>
              </select>
            </form>
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} receipts
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-receipt"></i>
              </div>
              <h3>No receipts yet</h3>
              <p>
                Choose a customer and their outstanding dues load automatically.
              </p>
              <Link href="/payments/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>Receive Payment
              </Link>
            </div>
          ) : (
            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Receipt No</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th className="text-end">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const cust = customers.find((c) => c.id === p.customerId);
                      return (
                        <tr key={p.id}>
                          <td className="erp-cell-strong">{p.code}</td>
                          <td>
                            {cust
                              ? `${cust.firstName} ${cust.lastName ?? ""}`.trim()
                              : "—"}
                          </td>
                          <td>{p.paymentDate}</td>
                          <td className="text-uppercase">{p.method}</td>
                          <td className="text-end">{p.amount.toFixed(2)}</td>
                          <td className="text-capitalize">{p.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // payments_create
  const customerSales = sales.filter(
    (s) => form.customer_id && String(s.customerId) === form.customer_id
  );
  const dueAmount = customerSales.reduce(
    (acc, s) => acc + Math.max(0, s.totalAmount - s.paidAmount),
    0
  );

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-hand-holding-dollar"></i>
          </div>
          <div>
            <h1>Receive Payment</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Sales</li>
                <li className="breadcrumb-item">
                  <Link href="/payments">Money Receipts</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/payments" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      <form
        method="POST"
        action="/payments"
        className="erp-form"
        data-payment-form
        data-dues-url="/payments/dues"
        data-allocate-url="/payments/auto-allocate"
        data-customers-url="/sales/customer-lookup"
        data-preselect-customer=""
        data-preselect-sale=""
        noValidate
        onSubmit={handleCreateReceipt}
      >
        <div className="erp-ws" data-payment-workspace>
          <div className="erp-ws-col erp-ws-main">
            <section className="erp-card erp-ws-card is-static">
              <div className="erp-ws-row">
                <div className="erp-field erp-ws-grow">
                  <label htmlFor="customer_id" className="form-label">
                    Customer <span className="erp-required">*</span>
                  </label>
                  <select
                    id="customer_id"
                    name="customer_id"
                    className="form-control "
                    data-customer-picker
                    value={form.customer_id}
                    onChange={(e) =>
                      setForm({ ...form, customer_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Choose customer…</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName ?? ""} · {c.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="erp-field erp-ws-fixed">
                  <label htmlFor="payment_date" className="form-label">
                    Date <span className="erp-required">*</span>
                  </label>
                  <input
                    type="date"
                    id="payment_date"
                    name="payment_date"
                    className="form-control"
                    required
                    value={form.payment_date}
                    onChange={(e) =>
                      setForm({ ...form, payment_date: e.target.value })
                    }
                  />
                </div>
                <div className="erp-field erp-ws-fixed">
                  <label htmlFor="payment_type_id" className="form-label">
                    Category
                  </label>
                  <select
                    id="payment_type_id"
                    name="payment_type_id"
                    className="form-control"
                    data-select2
                    value={form.payment_type_id}
                    onChange={(e) =>
                      setForm({ ...form, payment_type_id: e.target.value })
                    }
                  >
                    <option value="">Not specified</option>
                    <option value="1">Booking Money</option>
                    <option value="2">Down Payment</option>
                    <option value="3">Installment</option>
                    <option value="4">Handover Payment</option>
                    <option value="5">Advance / On Account</option>
                  </select>
                </div>
              </div>

              <div
                className={`erp-customer-snapshot ${form.customer_id ? "" : "d-none"}`}
                data-snapshot
              >
                <div className="erp-snap-item">
                  <span className="erp-snap-label">Total Outstanding</span>
                  <strong className="erp-snap-value" data-snap-due>
                    {dueAmount.toFixed(2)}
                  </strong>
                </div>
                <div className="erp-snap-item">
                  <span className="erp-snap-label">Overdue</span>
                  <strong
                    className="erp-snap-value text-danger"
                    data-snap-overdue
                  >
                    0.00
                  </strong>
                </div>
                <div className="erp-snap-item">
                  <span className="erp-snap-label">On Account</span>
                  <strong className="erp-snap-value" data-snap-advance>
                    0.00
                  </strong>
                </div>
              </div>
            </section>

            <section className="erp-card erp-ws-card is-fill" data-dues-panel>
              <div className="erp-ws-head">
                <span className="erp-ws-head-icon">
                  <i className="fa-solid fa-file-invoice-dollar"></i>
                </span>
                <h2>Outstanding Dues</h2>
                <span className="erp-ws-head-hint">
                  Untick anything this money should not settle
                </span>
                <div className="erp-ws-head-actions">
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    data-auto-allocate
                  >
                    <i className="fa-solid fa-wand-magic-sparkles me-1"></i>
                    Auto-allocate
                  </button>
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    data-clear-allocations
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="erp-ws-scroll" data-dues-body>
                {!form.customer_id || customerSales.length === 0 ? (
                  <p className="erp-cv-empty mb-0">
                    Choose a customer to see what they owe.
                  </p>
                ) : (
                  <div className="erp-table-wrap">
                    <table className="table erp-table">
                      <thead>
                        <tr>
                          <th>Sale</th>
                          <th className="text-end">Total</th>
                          <th className="text-end">Outstanding</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerSales.map((s) => (
                          <tr key={s.id}>
                            <td className="erp-cell-strong">{s.code}</td>
                            <td className="text-end">
                              {s.totalAmount.toFixed(2)}
                            </td>
                            <td className="text-end">
                              {Math.max(0, s.totalAmount - s.paidAmount).toFixed(
                                2
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="erp-ws-col erp-ws-side">
            <section className="erp-card erp-ws-card is-fill">
              <div className="erp-ws-head">
                <span className="erp-ws-head-icon">
                  <i className="fa-solid fa-wallet"></i>
                </span>
                <h2>How it was paid</h2>
                <div className="erp-ws-head-actions">
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    data-add-tender
                    onClick={() =>
                      setTenders([
                        ...tenders,
                        { id: Date.now(), method: "cash", amount: "0" },
                      ])
                    }
                  >
                    <i className="fa-solid fa-plus me-1"></i>Add
                  </button>
                </div>
              </div>

              <div className="erp-ws-scroll is-flush" data-tender-rows>
                {tenders.map((t, idx) => (
                  <div
                    key={t.id}
                    className="d-flex align-items-center gap-2 p-2 border-bottom"
                  >
                    <select
                      className="form-select form-select-sm"
                      value={t.method}
                      onChange={(e) => {
                        const next = [...tenders];
                        next[idx] = { ...t, method: e.target.value };
                        setTenders(next);
                      }}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="mfs">MFS (Mobile)</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control form-control-sm text-end"
                      value={t.amount}
                      onChange={(e) => {
                        const next = [...tenders];
                        next[idx] = { ...t, amount: e.target.value };
                        setTenders(next);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="erp-ws-foot">
                <div className="erp-receipt-totals">
                  <div className="erp-receipt-line">
                    <span>Received</span>
                    <strong data-t-received>{totalReceived.toFixed(2)}</strong>
                  </div>
                  <div className="erp-receipt-line">
                    <span>Allocated</span>
                    <strong data-t-allocated>0.00</strong>
                  </div>
                  <div className="erp-receipt-line is-total">
                    <span>On account</span>
                    <strong data-t-unallocated>
                      {totalReceived.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div
                  className="alert alert-warning py-2 mt-2 d-none"
                  role="alert"
                  data-over-warning
                  style={{ borderRadius: "10px", fontSize: "12.5px" }}
                >
                  <i className="fa-solid fa-triangle-exclamation me-1"></i>
                  Allocating more than was received.
                </div>

                <div className="erp-ws-row mt-2">
                  <div className="erp-field erp-ws-grow">
                    <label htmlFor="account_id" className="form-label">
                      Deposited To
                    </label>
                    <select
                      id="account_id"
                      name="account_id"
                      className="form-control"
                      data-select2
                      value={form.account_id}
                      onChange={(e) =>
                        setForm({ ...form, account_id: e.target.value })
                      }
                    >
                      <option value="">Default cash account</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="erp-field erp-ws-grow">
                    <label htmlFor="reference" className="form-label">
                      Reference
                    </label>
                    <input
                      type="text"
                      id="reference"
                      name="reference"
                      className="form-control"
                      value={form.reference}
                      onChange={(e) =>
                        setForm({ ...form, reference: e.target.value })
                      }
                      maxLength={120}
                    />
                  </div>
                </div>

                <div className="erp-field mb-0">
                  <label htmlFor="narration" className="form-label">
                    Narration
                  </label>
                  <textarea
                    id="narration"
                    name="narration"
                    className="form-control"
                    rows={2}
                    maxLength={2000}
                    value={form.narration}
                    onChange={(e) =>
                      setForm({ ...form, narration: e.target.value })
                    }
                  ></textarea>
                </div>

                <input
                  type="hidden"
                  name="apartment_sale_id"
                  data-sale-input
                  value={form.apartment_sale_id}
                />

                <button
                  type="submit"
                  className="btn btn-erp w-100 mt-3"
                  data-submit-button
                  disabled={submitting}
                >
                  <i className="fa-solid fa-floppy-disk me-2"></i>Create Receipt
                </button>
                <small
                  className="text-muted d-block mt-2 text-center"
                  style={{ fontSize: "11.5px" }}
                >
                  Saved as a draft — post it to move the money and the ledger.
                </small>
              </div>
            </section>
          </div>
        </div>

        <div data-tender-inputs hidden></div>
        <div data-allocation-inputs hidden></div>
      </form>
    </div>
  );
}
