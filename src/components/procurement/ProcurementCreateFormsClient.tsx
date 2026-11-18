"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateKind =
  | "requisitions"
  | "supplier-payments"
  | "material-issues"
  | "stock-transfers"
  | "material-consumptions";

export function ProcurementCreateFormsClient({
  kind,
  projects = [],
  warehouses = [],
  suppliers = [],
  products = [],
  accounts = [],
}: {
  kind: CreateKind;
  projects?: { id: number; name: string }[];
  warehouses?: { id: number; name: string }[];
  suppliers?: { id: number; companyName: string }[];
  products?: { id: number; code: string; name: string; costPrice: number }[];
  accounts?: { id: number; code: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    title: "",
    department_id: "",
    reason: "",
    project_id: projects[0]?.id ? String(projects[0].id) : "",
    warehouse_id: warehouses[0]?.id ? String(warehouses[0].id) : "",
    from_warehouse_id: warehouses[0]?.id ? String(warehouses[0].id) : "",
    to_warehouse_id: warehouses[1]?.id
      ? String(warehouses[1].id)
      : warehouses[0]?.id
      ? String(warehouses[0].id)
      : "",
    supplier_id: suppliers[0]?.id ? String(suppliers[0].id) : "",
    account_id: accounts[0]?.id ? String(accounts[0].id) : "",
    building_id: "",
    floor_id: "",
    project_task_id: "",
    task_id: "",
    responsible_employee_id: "",
    date: today,
    priority: "normal",
    method: "bank_transfer",
    amount: "",
    reference: "",
    purpose: "",
    narration: "",
    notes: "",
    status: kind === "supplier-payments" ? "posted" : "draft",
  });

  const [lines, setLines] = useState([
    {
      item_id: products[0]?.id ? String(products[0].id) : "",
      code: products[0]?.code ?? "",
      item: products[0]?.name ?? "",
      uom: "BAG",
      cost_code: "06.01 · RCC Concrete",
      from_issue: "",
      type: "BOQ_LINKED",
      qty: 10,
      unit_cost: products[0]?.costPrice ?? 500,
      wastage: 0,
      note: "",
    },
  ]);

  const totalCost = lines.reduce((s, l) => s + l.qty * l.unit_cost, 0);

  const backMap: Record<CreateKind, string> = {
    requisitions: "/requisitions",
    "supplier-payments": "/purchases/supplier-payments",
    "material-issues": "/material-issues",
    "stock-transfers": "/inventory/stock-transfers",
    "material-consumptions": "/material-consumptions",
  };

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        item_id: products[0]?.id ? String(products[0].id) : "",
        code: products[0]?.code ?? "",
        item: products[0]?.name ?? "",
        uom: "BAG",
        cost_code: "06.01 · RCC Concrete",
        from_issue: "",
        type: "BOQ_LINKED",
        qty: 1,
        unit_cost: products[0]?.costPrice ?? 0,
        wastage: 0,
        note: "",
      },
    ]);
  }

  async function submitForm(overrideStatus?: string) {
    setBusy(true);
    try {
      const payload = {
        ...form,
        status: overrideStatus ?? form.status,
        req_date: form.date,
        required_by: form.date,
        payment_date: form.date,
        issue_date: form.date,
        transfer_date: form.date,
        consumption_date: form.date,
        total_est: totalCost,
        total_amount: totalCost,
        total_cost: totalCost,
        lines,
      };
      const res = await fetch(`/api/procurement/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push(backMap[kind]);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitForm();
  }

  if (kind === "requisitions") {
    const matchingProducts = productSearch.trim()
      ? products
          .filter((p) =>
            `${p.code} ${p.name}`
              .toLowerCase()
              .includes(productSearch.trim().toLowerCase())
          )
          .slice(0, 10)
      : [];

    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-clipboard-list"></i>
            </div>
            <div>
              <h1>
                New Requisition{" "}
                <span className="text-muted" style={{ fontSize: "15px", fontWeight: 500 }}>
                  REQ-2026-0001
                </span>
              </h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/requisitions">Requisitions</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Draft
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <span className="erp-pill is-neutral align-self-center">
              <i className="fa-solid fa-pen-ruler me-1"></i>Draft
            </span>
            <span
              className="erp-save-state text-muted me-2"
              data-save-state
              style={{ fontSize: "12.5px" }}
            ></span>
            <Link href="/requisitions" className="btn btn-erp-ghost">
              Close
            </Link>
          </div>
        </div>

        <form
          className="erp-form"
          data-requisition-builder
          data-save="/requisitions/1"
          data-products="/requisitions/products"
          data-reorder="/requisitions/reorder-suggestions"
          data-index="/requisitions"
          onSubmit={handleSubmit}
        >
          <div className="erp-builder" data-fill-viewport="26">
            <div className="erp-builder-main">
              <div className="erp-card p-2 erp-builder-head">
                <div className="erp-cv-block-head erp-block-head-sm mb-2">
                  <i className="fa-solid fa-circle-info"></i>
                  <h3>Request Details</h3>
                </div>
                <div className="row g-2">
                  <div className="col-lg-4 col-sm-6">
                    <div className="erp-field mb-0">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        name="title"
                        className="form-control form-control-sm"
                        data-field="title"
                        maxLength={160}
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. Site A — rebar & cement"
                      />
                    </div>
                  </div>
                  <div className="col-lg-2 col-sm-6">
                    <div className="erp-field mb-0">
                      <label className="form-label">Priority</label>
                      <select
                        name="priority"
                        className="form-select form-select-sm"
                        data-field="priority"
                        data-select2
                        data-minimum-results-for-search="-1"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-3 col-sm-6">
                    <div className="erp-field mb-0">
                      <label className="form-label">
                        Deliver To (Warehouse) <span className="erp-required">*</span>
                      </label>
                      <select
                        name="warehouse_id"
                        className="form-select form-select-sm"
                        data-field="warehouse_id"
                        data-select2
                        data-placeholder="Select warehouse"
                        value={form.warehouse_id}
                        onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                      >
                        <option value="">—</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-3 col-sm-6">
                    <div className="erp-field mb-0">
                      <label className="form-label">Required By</label>
                      <input
                        type="date"
                        name="required_by"
                        className="form-control form-control-sm"
                        data-field="required_by"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-lg-3 col-sm-6">
                    <div className="erp-field mb-0">
                      <label className="form-label">Project</label>
                      <select
                        name="project_id"
                        className="form-select form-select-sm"
                        data-field="project_id"
                        data-select2
                        data-placeholder="Optional"
                        value={form.project_id}
                        onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                      >
                        <option value="">—</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-3 col-sm-6">
                    <div className="erp-field mb-0">
                      <label className="form-label">Department</label>
                      <select
                        name="department_id"
                        className="form-select form-select-sm"
                        data-field="department_id"
                        data-select2
                        data-placeholder="Optional"
                        value={form.department_id}
                        onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                      >
                        <option value="">—</option>
                        <option value="21">Administration</option>
                        <option value="3">Business Development &amp; CRM</option>
                        <option value="8">Civil Engineering</option>
                        <option value="18">Contracts &amp; Tendering</option>
                        <option value="12">Procurement &amp; Supply Chain</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="erp-field mb-0">
                      <label className="form-label">Justification / Reason</label>
                      <input
                        type="text"
                        name="reason"
                        className="form-control form-control-sm"
                        data-field="reason"
                        maxLength={2000}
                        value={form.reason}
                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        placeholder="Why is this needed?"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="erp-card p-3 erp-builder-items">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="erp-search flex-grow-1" style={{ position: "relative" }}>
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="search"
                      data-product-search
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search product by name, code or barcode to add…"
                      autoComplete="off"
                      aria-label="Add product"
                    />
                    <div
                      data-product-results
                      className="erp-pos-results"
                      style={{
                        position: "absolute",
                        zIndex: 20,
                        left: 0,
                        right: 0,
                        top: "100%",
                        background: "var(--erp-surface,#fff)",
                        border: "1px solid var(--erp-line)",
                        borderRadius: "10px",
                        marginTop: "4px",
                        maxHeight: "320px",
                        display: matchingProducts.length > 0 ? "block" : "none",
                        padding: "6px",
                        overflowY: "auto",
                      }}
                    >
                      {matchingProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="dropdown-item d-flex justify-content-between align-items-center py-1 px-2 rounded"
                          onClick={() => {
                            setLines((prev) => [
                              ...prev,
                              {
                                item_id: String(p.id),
                                code: p.code,
                                item: p.name,
                                uom: "BAG",
                                cost_code: "06.01",
                                from_issue: "",
                                type: "BOQ_LINKED",
                                qty: 1,
                                unit_cost: p.costPrice ?? 0,
                                wastage: 0,
                                note: "",
                              },
                            ]);
                            setProductSearch("");
                          }}
                        >
                          <span>
                            <strong>{p.name}</strong>{" "}
                            <small className="text-muted">({p.code})</small>
                          </span>
                          <span className="text-muted small">{p.costPrice} BDT</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm text-nowrap"
                    data-bs-toggle="modal"
                    data-bs-target="#reorderModal"
                    data-reorder-open
                    onClick={() => setReorderModalOpen(true)}
                  >
                    <i className="fa-solid fa-triangle-exclamation me-2 text-warning"></i>
                    Reorder Suggestions
                  </button>
                </div>
                <div className="erp-table-wrap">
                  <table className="table erp-table erp-purchase-items mb-0">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="text-end" style={{ width: "120px" }}>
                          Qty
                        </th>
                        <th className="text-end" style={{ width: "140px" }}>
                          Est. Unit Cost
                        </th>
                        <th className="text-end" style={{ width: "140px" }}>
                          Est. Total
                        </th>
                        <th style={{ width: "44px" }}></th>
                      </tr>
                    </thead>
                    <tbody data-items>
                      {lines.length === 0 ? (
                        <tr data-empty>
                          <td colSpan={5} className="erp-cv-empty">
                            No items yet — search above to add.
                          </td>
                        </tr>
                      ) : (
                        lines.map((l, i) => (
                          <tr key={i} data-item>
                            <td>
                              <strong data-cell-name>{l.item}</strong>
                              <span className="erp-identity-meta d-block" data-cell-code>
                                {l.code}
                              </span>
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                className="form-control form-control-sm text-end"
                                data-cell="quantity"
                                value={l.qty}
                                onChange={(e) =>
                                  setLines((prev) =>
                                    prev.map((r, idx) =>
                                      idx === i ? { ...r, qty: Number(e.target.value) } : r
                                    )
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                className="form-control form-control-sm text-end"
                                data-cell="estimated_cost"
                                value={l.unit_cost}
                                onChange={(e) =>
                                  setLines((prev) =>
                                    prev.map((r, idx) =>
                                      idx === i
                                        ? { ...r, unit_cost: Number(e.target.value) }
                                        : r
                                    )
                                  )
                                }
                              />
                            </td>
                            <td className="text-end" data-cell-total>
                              {(l.qty * l.unit_cost).toFixed(2)}
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-erp-ghost btn-sm text-danger"
                                data-remove
                                onClick={() =>
                                  setLines((prev) => prev.filter((_, idx) => idx !== i))
                                }
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="erp-builder-side">
              <div className="erp-builder-side-scroll">
                <div className="erp-card p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Estimated Total</span>
                    <span style={{ fontSize: "20px", fontWeight: 700 }}>
                      <span data-t-total>{totalCost.toFixed(2)}</span>
                    </span>
                  </div>
                  <p className="erp-help mb-0 mt-1">
                    Indicative only — the real cost is set on the purchase order.
                  </p>
                </div>

                <div className="erp-card p-3 mb-3">
                  <div className="erp-field mb-0">
                    <label className="form-label">Note</label>
                    <textarea
                      name="notes"
                      className="form-control"
                      data-field="note"
                      rows={2}
                      maxLength={2000}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="erp-builder-side-actions">
                <button
                  type="button"
                  className="btn btn-erp-ghost w-100 mb-2"
                  data-draft-btn
                  disabled={busy}
                  onClick={() => submitForm("draft")}
                >
                  <i className="fa-solid fa-floppy-disk me-2"></i>Save Draft
                </button>
                <button
                  type="submit"
                  className="btn btn-erp w-100"
                  style={{ padding: "11px", fontSize: "15px" }}
                  data-submit-btn
                  disabled={busy}
                >
                  <i className="fa-solid fa-paper-plane me-2"></i>Submit for Approval
                </button>
                <p className="erp-help text-center mt-2 mb-0">
                  Once submitted, the requisition is locked pending approval.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div
          className={`modal fade ${reorderModalOpen ? "show d-block" : ""}`}
          id="reorderModal"
          tabIndex={-1}
          aria-hidden={!reorderModalOpen}
          style={reorderModalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa-solid fa-triangle-exclamation me-2 text-warning"></i>
                  Low-Stock Reorder Suggestions
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  onClick={() => setReorderModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="erp-help mb-2">
                  Purchasable items whose on-hand quantity has fallen below their reorder level.
                  Tick the ones to request and adjust the quantity.
                </p>
                <div className="erp-table-wrap" style={{ maxHeight: "52vh", overflow: "auto" }}>
                  <table className="table erp-table mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: "36px" }}>
                          <input type="checkbox" data-reorder-all />
                        </th>
                        <th>Item</th>
                        <th className="text-end">On Hand</th>
                        <th className="text-end">Reorder At</th>
                        <th className="text-end" style={{ width: "130px" }}>
                          Order Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody data-reorder-list>
                      <tr>
                        <td colSpan={5} className="erp-cv-empty">
                          All items are above their reorder level.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  data-bs-dismiss="modal"
                  onClick={() => setReorderModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-erp"
                  data-reorder-add
                  onClick={() => setReorderModalOpen(false)}
                >
                  <i className="fa-solid fa-plus me-2"></i>Add Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "supplier-payments") {
    const amtNum = Number(form.amount || 0);
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-money-bill-transfer"></i>
            </div>
            <div>
              <h1>Pay a Supplier</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Procurement</li>
                  <li className="breadcrumb-item">
                    <Link href="/purchases/supplier-payments">Supplier Payments</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    New
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <Link href="/purchases/supplier-payments" className="btn btn-erp-ghost">
              <i className="fa-solid fa-calendar-days me-2"></i>Pay in Installments
            </Link>
            <Link href="/purchases/supplier-payments" className="btn btn-erp-ghost">
              <i className="fa-solid fa-arrow-left me-2"></i>Back
            </Link>
          </div>
        </div>

        <form
          method="POST"
          action="/purchases/supplier-payments"
          data-payout-form
          data-submit-lock="off"
          data-outstanding-url="/purchases/supplier-payments/outstanding/__ID__"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="status" value={form.status} data-payout-status />

          <div className="erp-card">
            <div className="erp-card-head">
              <div>
                <h2>Who is being paid</h2>
                <p>Choosing a supplier lists everything they are still owed.</p>
              </div>
            </div>

            <div className="erp-card-body">
              <div className="row">
                <div className="col-md-5">
                  <div className="erp-field">
                    <label className="form-label">
                      Supplier <span className="erp-required">*</span>
                    </label>
                    <select
                      name="supplier_id"
                      className="form-select"
                      data-select2
                      data-payout-supplier
                      required
                      value={form.supplier_id}
                      onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                    >
                      <option value="">Choose a supplier…</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-md-7">
                  <div className="erp-sale-strip mb-0" style={{ margin: 0 }}>
                    <div className="erp-sale-stat">
                      <span className="erp-sale-stat-label">Outstanding</span>
                      <strong data-payout-due>0.00</strong>
                      <span className="erp-sale-stat-foot" data-payout-due-foot>
                        0 open receipts
                      </span>
                    </div>
                    <div className="erp-sale-stat">
                      <span className="erp-sale-stat-label">Allocating</span>
                      <strong data-payout-allocated>0.00</strong>
                      <span className="erp-sale-stat-foot">Against the receipts below</span>
                    </div>
                    <div className="erp-sale-stat" data-payout-oa-stat>
                      <span className="erp-sale-stat-label">On Account</span>
                      <strong data-payout-onaccount>{amtNum.toFixed(2)}</strong>
                      <span className="erp-sale-stat-foot">
                        Advance, not tied to an invoice
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="erp-card mt-3">
            <div className="erp-card-head">
              <div>
                <h2>What is being settled</h2>
                <p>
                  Tick a receipt to pay it in full, or type a part amount. Only posted receipts
                  appear — those are the ones that actually put a balance on the supplier&apos;s
                  account.
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm"
                  data-alloc-auto
                  title="Spread the payment amount across the oldest receipts first"
                >
                  <i className="fa-solid fa-wand-magic-sparkles me-1"></i>Auto-allocate
                </button>
                <button type="button" className="btn btn-erp-ghost btn-sm" data-alloc-clear>
                  <i className="fa-solid fa-eraser me-1"></i>Clear
                </button>
              </div>
            </div>

            <div className="erp-card-body is-flush" data-payout-rows>
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-hand-pointer"></i>
                </div>
                <h3>Choose a supplier</h3>
                <p>Their open receipts will be listed here with what each one still owes.</p>
              </div>
            </div>
          </div>

          <div className="erp-card mt-3">
            <div className="erp-card-head">
              <div>
                <h2>How it is being paid</h2>
                <p>The account chosen here is what the ledger credits.</p>
              </div>
            </div>

            <div className="erp-card-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">
                      Amount <span className="erp-required">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="amount"
                      className="form-control text-end"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      data-payout-amount
                      required
                      placeholder="0.00"
                    />
                    <span className="erp-help">Total leaving the account.</span>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">
                      Date <span className="erp-required">*</span>
                    </label>
                    <input
                      type="date"
                      name="payment_date"
                      className="form-control"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">
                      Method <span className="erp-required">*</span>
                    </label>
                    <select
                      name="method"
                      className="form-select"
                      data-select2
                      data-payout-method
                      required
                      value={form.method}
                      onChange={(e) => setForm({ ...form, method: e.target.value })}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="card">Card</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="adjustment">Adjustment / Set-off</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">
                      Reference{" "}
                      <span className="erp-required" data-ref-required hidden>
                        *
                      </span>
                    </label>
                    <input
                      type="text"
                      name="reference"
                      className="form-control"
                      maxLength={100}
                      value={form.reference}
                      onChange={(e) => setForm({ ...form, reference: e.target.value })}
                      data-payout-reference
                    />
                    <span className="erp-help" data-ref-hint></span>
                  </div>
                </div>

                <div className="col-md-5">
                  <div className="erp-field mb-0">
                    <label className="form-label">
                      Paid From <span className="erp-required">*</span>
                    </label>
                    <select
                      name="account_id"
                      className="form-select"
                      data-select2
                      required
                      value={form.account_id}
                      onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                    >
                      <option value="">Choose an account…</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} · {a.name}
                        </option>
                      ))}
                    </select>
                    <span className="erp-help">
                      Cash or bank — this account is credited.
                    </span>
                  </div>
                </div>

                <div className="col-md-7">
                  <div className="erp-field mb-0">
                    <label className="form-label">Narration</label>
                    <input
                      type="text"
                      name="narration"
                      className="form-control"
                      maxLength={500}
                      value={form.narration}
                      onChange={(e) => setForm({ ...form, narration: e.target.value })}
                      placeholder="Optional — appears on the voucher"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="erp-card-foot d-flex align-items-center justify-content-between flex-wrap gap-2">
              <span className="erp-help" data-payout-summary>
                Choose a supplier and enter an amount.
              </span>
              <span className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  data-payout-draft
                  disabled={busy}
                  onClick={() => submitForm("draft")}
                >
                  <i className="fa-solid fa-floppy-disk me-2"></i>Save as Draft
                </button>
                <button
                  type="submit"
                  className="btn btn-erp"
                  data-payout-post
                  disabled={busy}
                >
                  <i className="fa-solid fa-paper-plane me-2"></i>Pay &amp; Post to Ledger
                </button>
              </span>
            </div>
          </div>
        </form>
      </div>
    );
  }

  if (kind === "material-issues") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-person-carry-box"></i>
            </div>
            <div>
              <h1>New Material Issue</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/material-issues">Material Issues</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    New
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <Link href="/material-issues" className="btn btn-erp-ghost">
              Cancel
            </Link>
          </div>
        </div>

        <form
          method="POST"
          action="/material-issues"
          className="erp-form"
          data-issue-form
          onSubmit={handleSubmit}
        >
          <div className="erp-card p-3 mb-3">
            <div className="erp-cv-block-head erp-block-head-sm mb-2">
              <i className="fa-solid fa-circle-info"></i>
              <h3>Issue Details</h3>
            </div>
            <div className="row g-2">
              <div className="col-lg-3 col-sm-6">
                <div className="erp-field mb-0">
                  <label className="form-label">
                    Store (Warehouse) <span className="erp-required">*</span>
                  </label>
                  <select
                    name="warehouse_id"
                    className="form-select form-select-sm"
                    data-select2
                    data-placeholder="Select store"
                    required
                    value={form.warehouse_id}
                    onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                  >
                    <option value="">—</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  {warehouses.length === 0 && (
                    <span className="erp-error">
                      No project store exists yet. A material issue draws on project stock, which a retail warehouse does not hold —{" "}
                      <Link href="/pos/warehouses">create a Site or Central store</Link> first.
                    </span>
                  )}
                </div>
              </div>
              <div className="col-lg-3 col-sm-6">
                <div className="erp-field mb-0">
                  <label className="form-label">Project</label>
                  <select
                    name="project_id"
                    className="form-select form-select-sm"
                    data-select2
                    data-placeholder="Optional"
                    value={form.project_id}
                    onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                  >
                    <option value="">—</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-lg-3 col-sm-6">
                <div className="erp-field mb-0">
                  <label className="form-label">Task</label>
                  <select
                    name="task_id"
                    className="form-select form-select-sm"
                    data-select2
                    data-task-picker
                    data-placeholder="Optional — pick a project first"
                    value={form.task_id}
                    onChange={(e) => setForm({ ...form, task_id: e.target.value })}
                  >
                    <option value="">—</option>
                  </select>
                  <span className="erp-help" data-task-hint>
                    Loads the chosen project&apos;s work breakdown.
                  </span>
                </div>
              </div>

              <div className="col-lg-3 col-sm-6">
                <div className="erp-field mb-0">
                  <label className="form-label">Responsible Person</label>
                  <select
                    name="responsible_employee_id"
                    className="form-select form-select-sm"
                    data-employee-picker
                    data-placeholder="Optional — search by name or code"
                    value={form.responsible_employee_id}
                    onChange={(e) =>
                      setForm({ ...form, responsible_employee_id: e.target.value })
                    }
                  >
                    <option value="">—</option>
                  </select>
                  <span className="erp-help">Who signs for the material on site.</span>
                </div>
              </div>

              <div className="col-lg-2 col-sm-6">
                <div className="erp-field mb-0">
                  <label className="form-label">Issue Date</label>
                  <input
                    type="date"
                    name="issue_date"
                    className="form-control form-control-sm"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-lg-4 col-sm-12">
                <div className="erp-field mb-0">
                  <label className="form-label">Purpose</label>
                  <input
                    type="text"
                    name="purpose"
                    className="form-control form-control-sm"
                    maxLength={500}
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    placeholder="e.g. Slab casting — 5th floor"
                  />
                </div>
              </div>
              <div className="col-12">
                <div className="erp-field mb-0">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    name="notes"
                    className="form-control form-control-sm"
                    maxLength={2000}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="erp-card p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="erp-cv-block-head erp-block-head-sm mb-0">
                <i className="fa-solid fa-boxes-stacked"></i>
                <h3>Materials</h3>
              </div>
              <button
                type="button"
                className="btn btn-erp-ghost btn-sm"
                data-add-material
                onClick={addLine}
              >
                <i className="fa-solid fa-plus me-2"></i>Add Material
              </button>
            </div>
            <div className="erp-table-wrap">
              <table className="table erp-table erp-purchase-items mb-0">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th style={{ width: "110px" }}>UoM</th>
                    <th className="text-end" style={{ width: "130px" }}>
                      Requested Qty
                    </th>
                    <th className="text-end" style={{ width: "130px" }}>
                      Unit Cost
                    </th>
                    <th>Note</th>
                    <th style={{ width: "44px" }}></th>
                  </tr>
                </thead>
                <tbody data-rows>
                  {lines.length === 0 ? (
                    <tr data-empty>
                      <td colSpan={6} className="erp-cv-empty">
                        No materials yet — add one to issue.
                      </td>
                    </tr>
                  ) : (
                    lines.map((l, i) => (
                      <tr key={i}>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={l.item_id}
                            onChange={(e) => {
                              const prod = products.find(
                                (p) => String(p.id) === e.target.value
                              );
                              setLines((prev) =>
                                prev.map((r, idx) =>
                                  idx === i
                                    ? {
                                        ...r,
                                        item_id: e.target.value,
                                        item: prod?.name ?? "",
                                        unit_cost: prod?.costPrice ?? 0,
                                      }
                                    : r
                                )
                              );
                            }}
                          >
                            <option value="">— Choose material —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.code} · {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={l.uom}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((r, idx) =>
                                  idx === i ? { ...r, uom: e.target.value } : r
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm text-end"
                            value={l.qty}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((r, idx) =>
                                  idx === i ? { ...r, qty: Number(e.target.value) } : r
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm text-end"
                            value={l.unit_cost}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((r, idx) =>
                                  idx === i
                                    ? { ...r, unit_cost: Number(e.target.value) }
                                    : r
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={l.note}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((r, idx) =>
                                  idx === i ? { ...r, note: e.target.value } : r
                                )
                              )
                            }
                          />
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            onClick={() =>
                              setLines((prev) => prev.filter((_, idx) => idx !== i))
                            }
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button
              type="submit"
              className="btn btn-erp"
              style={{ padding: "10px 22px" }}
              disabled={busy}
            >
              <i className="fa-solid fa-floppy-disk me-2"></i>Create Issue
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (kind === "stock-transfers") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-truck-fast"></i>
            </div>
            <div>
              <h1>New Stock Transfer</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/inventory/stock-transfers">Stock Transfers</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    New
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <Link href="/inventory/stock-transfers" className="btn btn-erp-ghost">
              <i className="fa-solid fa-arrow-left me-2"></i>Back
            </Link>
          </div>
        </div>

        <form
          method="POST"
          className="erp-form"
          data-transfer-form
          data-availability-url="/inventory/stock-transfers/availability"
          action="/inventory/stock-transfers"
          onSubmit={handleSubmit}
        >
          <section className="erp-card">
            <div className="erp-section-head">
              <div className="erp-section-icon">
                <i className="fa-solid fa-route"></i>
              </div>
              <div>
                <h2>The journey</h2>
                <p>Where the material is leaving from, and where it is going.</p>
              </div>
            </div>

            <div className="erp-card-body">
              <div className="row">
                <div className="col-md-5">
                  <div className="erp-field">
                    <label className="form-label">
                      From store <span className="erp-required">*</span>
                    </label>
                    <select
                      name="from_warehouse_id"
                      className="form-select"
                      data-select2
                      data-from-warehouse
                      data-placeholder="Which store is giving it up…"
                      required
                      value={form.from_warehouse_id}
                      onChange={(e) =>
                        setForm({ ...form, from_warehouse_id: e.target.value })
                      }
                    >
                      <option value=""></option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-md-2 d-none d-md-flex align-items-center justify-content-center">
                  <i className="fa-solid fa-arrow-right-long erp-route-arrow"></i>
                </div>

                <div className="col-md-5">
                  <div className="erp-field">
                    <label className="form-label">
                      To store <span className="erp-required">*</span>
                    </label>
                    <select
                      name="to_warehouse_id"
                      className="form-select"
                      data-select2
                      data-placeholder="Which store is receiving it…"
                      required
                      value={form.to_warehouse_id}
                      onChange={(e) =>
                        setForm({ ...form, to_warehouse_id: e.target.value })
                      }
                    >
                      <option value=""></option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                    <span className="erp-help">
                      A store attached to a project is that project&apos;s site store.
                    </span>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">
                      Transfer date <span className="erp-required">*</span>
                    </label>
                    <input
                      type="date"
                      name="transfer_date"
                      className="form-control"
                      required
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">Reference</label>
                    <input
                      type="text"
                      name="reference"
                      className="form-control"
                      maxLength={120}
                      value={form.reference}
                      onChange={(e) => setForm({ ...form, reference: e.target.value })}
                      placeholder="Gate pass, challan no.…"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field mb-0">
                    <label className="form-label">Notes</label>
                    <input
                      type="text"
                      name="notes"
                      className="form-control"
                      maxLength={2000}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Anything the far store should know"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="erp-card">
            <div className="erp-section-head">
              <div className="erp-section-icon">
                <i className="fa-solid fa-boxes-stacked"></i>
              </div>
              <div>
                <h2>Materials</h2>
                <p>
                  What is being asked for. The store records what it actually loads at
                  dispatch.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-erp-ghost btn-sm ms-auto"
                data-line-add
                onClick={addLine}
              >
                <i className="fa-solid fa-plus me-1"></i>Add material
              </button>
            </div>

            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table erp-line-table">
                  <thead>
                    <tr>
                      <th style={{ width: "38%" }}>Material</th>
                      <th style={{ width: "17%" }}>Quantity</th>
                      <th style={{ width: "20%" }}>In source store</th>
                      <th>Note</th>
                      <th style={{ width: "44px" }}></th>
                    </tr>
                  </thead>
                  <tbody data-line-rows>
                    {lines.map((l, i) => (
                      <tr key={i} data-line-row>
                        <td>
                          <select
                            name={`lines[${i}][item_id]`}
                            className="form-select form-select-sm"
                            data-line-item
                            required
                            value={l.item_id}
                            onChange={(e) => {
                              const prod = products.find(
                                (p) => String(p.id) === e.target.value
                              );
                              setLines((prev) =>
                                prev.map((r, idx) =>
                                  idx === i
                                    ? {
                                        ...r,
                                        item_id: e.target.value,
                                        item: prod?.name ?? "",
                                      }
                                    : r
                                )
                              );
                            }}
                          >
                            <option value="">— Choose material —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} · {p.code}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            name={`lines[${i}][requested_qty]`}
                            className="form-control form-control-sm"
                            step="0.0001"
                            min="0.0001"
                            data-line-qty
                            required
                            placeholder="0"
                            value={l.qty}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((r, idx) =>
                                  idx === i ? { ...r, qty: Number(e.target.value) } : r
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <span className="erp-stock-flag is-idle" data-line-stock>
                            <i className="fa-solid fa-minus"></i>
                            <span data-line-stock-text>Pick a store and material</span>
                          </span>
                        </td>
                        <td>
                          <input
                            type="text"
                            name={`lines[${i}][note]`}
                            className="form-control form-control-sm"
                            maxLength={190}
                            data-line-note
                            placeholder="Optional"
                            value={l.note}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((r, idx) =>
                                  idx === i ? { ...r, note: e.target.value } : r
                                )
                              )
                            }
                          />
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            data-line-remove
                            title="Remove"
                            onClick={() =>
                              setLines((prev) => prev.filter((_, idx) => idx !== i))
                            }
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="erp-line-empty" data-line-empty hidden={lines.length > 0}>
                No materials yet — add the first one above.
              </p>
            </div>
          </section>

          <div className="erp-form-bar">
            <span className="erp-form-bar-note">
              <i className="fa-solid fa-circle-info me-1"></i>
              Saved as a draft. Nothing moves until it is dispatched.
            </span>
            <div className="erp-form-bar-actions">
              <Link href="/inventory/stock-transfers" className="btn btn-erp-ghost">
                Cancel
              </Link>
              <button type="submit" className="btn btn-erp" disabled={busy}>
                <i className="fa-solid fa-floppy-disk me-2"></i>Create transfer
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-fire"></i>
          </div>
          <div>
            <h1>New Material Consumption</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/material-consumptions">Material Consumption</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/material-consumptions" className="btn btn-erp-ghost">
            Cancel
          </Link>
        </div>
      </div>

      <form
        method="POST"
        action="/material-consumptions"
        className="erp-form"
        data-consumption-form
        onSubmit={handleSubmit}
      >
        <div className="erp-card p-3 mb-3">
          <div className="erp-cv-block-head erp-block-head-sm mb-2">
            <i className="fa-solid fa-circle-info"></i>
            <h3>Consumption Details</h3>
          </div>
          <div className="row g-2">
            <div className="col-lg-3 col-sm-6">
              <div className="erp-field mb-0">
                <label className="form-label">
                  Project <span className="erp-required">*</span>
                </label>
                <select
                  name="project_id"
                  className="form-select form-select-sm"
                  data-select2
                  data-project
                  data-placeholder="Select project"
                  required
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                >
                  <option value="">—</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6">
              <div className="erp-field mb-0">
                <label className="form-label">Building</label>
                <select
                  name="building_id"
                  className="form-select form-select-sm"
                  data-select2
                  data-building
                  data-placeholder="Optional"
                  value={form.building_id}
                  onChange={(e) => setForm({ ...form, building_id: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="1">J &amp; J Tower</option>
                </select>
              </div>
            </div>
            <div className="col-lg-2 col-sm-6">
              <div className="erp-field mb-0">
                <label className="form-label">Floor</label>
                <select
                  name="floor_id"
                  className="form-select form-select-sm"
                  data-select2
                  data-floor
                  data-placeholder="Optional"
                  value={form.floor_id}
                  onChange={(e) => setForm({ ...form, floor_id: e.target.value })}
                >
                  <option value="">—</option>
                </select>
              </div>
            </div>
            <div className="col-lg-2 col-sm-6">
              <div className="erp-field mb-0">
                <label className="form-label">Task</label>
                <select
                  name="project_task_id"
                  className="form-select form-select-sm"
                  data-select2
                  data-task
                  data-placeholder="Whole project"
                  data-url="/material-consumptions/tasks"
                  data-default=""
                  value={form.project_task_id}
                  onChange={(e) =>
                    setForm({ ...form, project_task_id: e.target.value })
                  }
                >
                  <option value="">— whole project —</option>
                </select>
              </div>
            </div>
            <div className="col-lg-2 col-sm-6">
              <div className="erp-field mb-0">
                <label className="form-label">
                  Store{" "}
                  <i
                    className="fa-solid fa-circle-info erp-hint"
                    title="The store material used off the shelf is deducted from. Leave blank to use the project's own store."
                  ></i>
                </label>
                <select
                  name="warehouse_id"
                  className="form-select form-select-sm"
                  data-select2
                  data-placeholder="Project's own store"
                  value={form.warehouse_id}
                  onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                >
                  <option value="">— project&apos;s own store —</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-lg-2 col-sm-6">
              <div className="erp-field mb-0">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  name="consumption_date"
                  className="form-control form-control-sm"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            <div className="col-12">
              <div className="erp-field mb-0">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  name="notes"
                  className="form-control form-control-sm"
                  maxLength={2000}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Slab casting — 5th floor"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="erp-card p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="erp-cv-block-head erp-block-head-sm mb-0">
              <i className="fa-solid fa-fire"></i>
              <h3>Materials Used</h3>
            </div>
            <button
              type="button"
              className="btn btn-erp-ghost btn-sm"
              data-add-material
              onClick={addLine}
            >
              <i className="fa-solid fa-plus me-2"></i>Add Material
            </button>
          </div>
          <p className="erp-help mb-2">
            <strong>Cost Code</strong> is the budget line this material is charged to — it is
            what lets the budget screen say what a code has actually consumed, so leaving it
            blank means this spend appears nowhere in budget-versus-actual.{" "}
            <strong>From Issue</strong> ties this back to the delivery the material came out
            of, so an issue can show how much of it is still standing on site; leave it blank
            for material that was already there. <strong>Unit Cost</strong> fills itself from
            the oldest lot still in stock (FIFO) when you pick a material, and from the
            delivery&apos;s own cost when you pick an issue — overwrite it if you know better.
            Wastage is part of the quantity used, not extra, so it can never be more than the
            quantity. Off-bill work (change orders, emergencies) is recorded with its type so
            the variance report can say <em>why</em> a project went over.
          </p>
          <div className="erp-table-wrap">
            <table className="table erp-table erp-purchase-items mb-0">
              <thead>
                <tr>
                  <th style={{ width: "200px" }}>Material</th>
                  <th style={{ width: "190px" }}>Cost Code</th>
                  <th style={{ width: "180px" }}>From Issue</th>
                  <th style={{ width: "140px" }}>Type</th>
                  <th className="text-end" style={{ width: "100px" }}>
                    Qty Used
                  </th>
                  <th className="text-end" style={{ width: "95px" }}>
                    Wastage
                  </th>
                  <th style={{ width: "90px" }}>UoM</th>
                  <th className="text-end" style={{ width: "120px" }}>
                    Unit Cost
                  </th>
                  <th style={{ width: "210px" }}>Note / Wastage Reason</th>
                  <th style={{ width: "44px" }}></th>
                </tr>
              </thead>
              <tbody data-rows>
                {lines.length === 0 ? (
                  <tr data-empty>
                    <td colSpan={10} className="erp-cv-empty">
                      No materials yet — add one.
                    </td>
                  </tr>
                ) : (
                  lines.map((l, i) => (
                    <tr key={i}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={l.item_id}
                          onChange={(e) => {
                            const prod = products.find(
                              (p) => String(p.id) === e.target.value
                            );
                            setLines((prev) =>
                              prev.map((r, idx) =>
                                idx === i
                                  ? {
                                      ...r,
                                      item_id: e.target.value,
                                      item: prod?.name ?? "",
                                      unit_cost: prod?.costPrice ?? 0,
                                    }
                                  : r
                              )
                            );
                          }}
                        >
                          <option value="">— Choose material —</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} · {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={l.cost_code}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((r, idx) =>
                                idx === i ? { ...r, cost_code: e.target.value } : r
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={l.from_issue}
                          placeholder="On-site stock"
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((r, idx) =>
                                idx === i ? { ...r, from_issue: e.target.value } : r
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={l.type}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((r, idx) =>
                                idx === i ? { ...r, type: e.target.value } : r
                              )
                            )
                          }
                        >
                          <option value="BOQ_LINKED">Against BOQ</option>
                          <option value="NON_BOQ">Not in BOQ</option>
                          <option value="ADDITIONAL_WORK">Additional Work</option>
                          <option value="CHANGE_ORDER">Change Order</option>
                          <option value="EMERGENCY">Emergency</option>
                          <option value="MAINTENANCE">Maintenance</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm text-end"
                          value={l.qty}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((r, idx) =>
                                idx === i ? { ...r, qty: Number(e.target.value) } : r
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm text-end"
                          value={l.wastage}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((r, idx) =>
                                idx === i ? { ...r, wastage: Number(e.target.value) } : r
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={l.uom}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((r, idx) =>
                                idx === i ? { ...r, uom: e.target.value } : r
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm text-end"
                          value={l.unit_cost}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((r, idx) =>
                                idx === i
                                  ? { ...r, unit_cost: Number(e.target.value) }
                                  : r
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={l.note}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((r, idx) =>
                                idx === i ? { ...r, note: e.target.value } : r
                              )
                            )
                          }
                        />
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          onClick={() =>
                            setLines((prev) => prev.filter((_, idx) => idx !== i))
                          }
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-3">
          <button
            type="submit"
            className="btn btn-erp"
            style={{ padding: "10px 22px" }}
            disabled={busy}
          >
            <i className="fa-solid fa-floppy-disk me-2"></i>Record Consumption
          </button>
        </div>
      </form>
    </div>
  );
}
