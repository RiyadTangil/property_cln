"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContractorsSubmenu } from "./ContractorsSubmenu";
import { COA_ACCOUNT_OPTIONS, UOM_OPTIONS } from "./contractor-options";

interface WoItemRow {
  id: number;
  item_code: string;
  description: string;
  boq_item_id: string;
  boq_code: string;
  uom_id: string;
  quantity: string;
  rate: string;
}

interface BoqCandidate {
  id: string;
  code: string;
  description: string;
  unit: string;
  uom_id: string;
  measured: number;
  already_let: number;
  available: number;
  rate: number;
}

const SAMPLE_BOQ_LINES: BoqCandidate[] = [
  {
    id: "101",
    code: "01.01",
    description: "Earthwork excavation in foundation trenches",
    unit: "CUM",
    uom_id: "50",
    measured: 450,
    already_let: 0,
    available: 450,
    rate: 320,
  },
  {
    id: "102",
    code: "02.01",
    description: "RCC 1:1.5:3 in footing and column pedestals",
    unit: "CUM",
    uom_id: "50",
    measured: 180,
    already_let: 30,
    available: 150,
    rate: 11500,
  },
  {
    id: "103",
    code: "03.01",
    description: "Deformed steel reinforcement 500W grade",
    unit: "MT",
    uom_id: "59",
    measured: 28,
    already_let: 0,
    available: 28,
    rate: 96000,
  },
];

export function WorkOrderCreateClient({
  contractors,
  projects,
}: {
  contractors: { id: number; name: string }[];
  projects: { id: number; code: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    contractor_id: String(contractors[0]?.id ?? ""),
    project_id: String(projects[0]?.id ?? ""),
    order_date: new Date().toISOString().slice(0, 10),
    engagement_type: "labour",
    pricing_method: "item_rate",
    title: "",
    scope: "",
    start_date: "",
    completion_date: "",
    defect_liability_days: "0",
    expense_account_id: "",
    retention_percent: "0",
    tds_percent: "0",
    vat_percent: "0",
    advance_recovery_percent: "0",
  });

  const [rows, setRows] = useState<WoItemRow[]>([]);
  const [nextRowId, setNextRowId] = useState(1);
  const [boqModalOpen, setBoqModalOpen] = useState(false);
  const [boqFilter, setBoqFilter] = useState("");
  const [selectedBoqIds, setSelectedBoqIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");

  const totalAmount = rows.reduce((sum, r) => {
    const q = parseFloat(r.quantity) || 0;
    const rate = parseFloat(r.rate) || 0;
    return sum + q * rate;
  }, 0);

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: nextRowId,
        item_code: "",
        description: "",
        boq_item_id: "",
        boq_code: "—",
        uom_id: "",
        quantity: "0",
        rate: "0",
      },
    ]);
    setNextRowId((n) => n + 1);
  }

  function updateRow(id: number, patch: Partial<WoItemRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const visibleBoqLines = SAMPLE_BOQ_LINES.filter((b) => {
    if (!boqFilter) return true;
    const q = boqFilter.toLowerCase();
    return b.code.toLowerCase().includes(q) || b.description.toLowerCase().includes(q);
  });

  function toggleBoqSelect(id: string) {
    setSelectedBoqIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selectAllShownBoq() {
    const shownIds = visibleBoqLines.map((b) => b.id);
    setSelectedBoqIds((prev) => Array.from(new Set([...prev, ...shownIds])));
  }

  function insertSelectedBoq() {
    const picked = SAMPLE_BOQ_LINES.filter((b) => selectedBoqIds.includes(b.id));
    if (picked.length > 0) {
      let currentId = nextRowId;
      const added: WoItemRow[] = picked.map((b) => ({
        id: currentId++,
        item_code: b.code,
        description: b.description,
        boq_item_id: b.id,
        boq_code: b.code,
        uom_id: b.uom_id,
        quantity: String(b.available),
        rate: String(b.rate),
      }));
      setRows((prev) => [...prev, ...added]);
      setNextRowId(currentId);
    }
    setSelectedBoqIds([]);
    setBoqModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorText("");
    try {
      const res = await fetch("/api/contractors/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          contract_value: totalAmount > 0 ? String(totalAmount) : "0",
          items: rows,
        }),
      });
      if (res.ok) {
        router.push("/contractors/work-orders");
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorText(err.error || "Failed to save work order.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container ">
      <ContractorsSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-file-signature" />
          </div>
          <div>
            <h1>New Work Order</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/contractors">Contractors</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/contractors/work-orders">Work Orders</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <form
        className="erp-card"
        data-wo-form
        action="/contractors/work-orders"
        data-boq-lines-url="/contractors/work-orders/boq-lines"
        onSubmit={handleSubmit}
      >
        <div className="erp-card-head">
          <div>
            <h2>The contract</h2>
            <p>
              Terms default from the contractor and are frozen onto this order when it is
              issued — changing the contractor later never re-prices it.
            </p>
          </div>
        </div>

        <div className="erp-card-body">
          <div
            className="alert alert-danger py-2 px-3 mb-3"
            role="alert"
            style={{ borderRadius: "9px", fontSize: "12.5px" }}
            data-wo-error
            hidden={!errorText}
          >
            <span data-wo-error-text>{errorText}</span>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div className="erp-field">
                <label htmlFor="wo_contractor" className="form-label">
                  Contractor <span className="erp-required">*</span>
                </label>
                <select
                  id="wo_contractor"
                  name="contractor_id"
                  className="form-select"
                  data-select2
                  required
                  data-field="contractor_id"
                  data-defaults="[]"
                  value={form.contractor_id}
                  onChange={(e) => setForm({ ...form, contractor_id: e.target.value })}
                >
                  <option value="">— Choose —</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="erp-help">Only active contractors can be given new work.</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="erp-field">
                <label htmlFor="wo_project" className="form-label">
                  Project <span className="erp-required">*</span>
                </label>
                <select
                  id="wo_project"
                  name="project_id"
                  className="form-select"
                  data-select2
                  required
                  data-field="project_id"
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                >
                  <option value="">— Choose —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} data-meta={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="erp-field">
                <label htmlFor="wo_date" className="form-label">
                  Order date <span className="erp-required">*</span>
                </label>
                <input
                  type="date"
                  id="wo_date"
                  name="order_date"
                  className="form-control"
                  required
                  data-field="order_date"
                  value={form.order_date}
                  onChange={(e) => setForm({ ...form, order_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="erp-field">
                <label htmlFor="wo_engagement" className="form-label">
                  Engagement type
                </label>
                <select
                  id="wo_engagement"
                  name="engagement_type"
                  className="form-select"
                  data-select2
                  data-field="engagement_type"
                  value={form.engagement_type}
                  onChange={(e) => setForm({ ...form, engagement_type: e.target.value })}
                >
                  <option value="labour">Labour Only</option>
                  <option value="material_and_labour">Material + Labour</option>
                  <option value="specialist">Specialist</option>
                  <option value="turnkey">Turnkey</option>
                </select>
                <span className="erp-help">Defaults to the contractor&apos;s type; set it per package.</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="erp-field">
                <label htmlFor="wo_pricing" className="form-label">
                  Pricing method
                </label>
                <select
                  id="wo_pricing"
                  name="pricing_method"
                  className="form-select"
                  data-select2
                  data-field="pricing_method"
                  value={form.pricing_method}
                  onChange={(e) => setForm({ ...form, pricing_method: e.target.value })}
                >
                  <option value="lump_sum">Lump Sum</option>
                  <option value="item_rate">Item Rate (BOQ)</option>
                  <option value="cost_plus">Cost Plus</option>
                  <option value="percentage_rate">Percentage Rate</option>
                  <option value="labour_rate">Labour Rate</option>
                </select>
              </div>
            </div>
          </div>

          <div className="erp-field">
            <label htmlFor="wo_title" className="form-label">
              Title <span className="erp-required">*</span>
            </label>
            <input
              type="text"
              id="wo_title"
              name="title"
              className="form-control"
              maxLength={190}
              required
              data-field="title"
              placeholder="Substructure — civil works"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="erp-field">
            <label className="form-label">Scope</label>
            <textarea
              name="scope"
              className="form-control"
              rows={2}
              maxLength={5000}
              data-field="scope"
              placeholder="What is included, and what is explicitly not."
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
            />
          </div>

          <div className="row">
            <div className="col-md-3">
              <div className="erp-field">
                <label className="form-label">Start date</label>
                <input
                  type="date"
                  name="start_date"
                  className="form-control"
                  data-field="start_date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="erp-field">
                <label className="form-label">Completion date</label>
                <input
                  type="date"
                  name="completion_date"
                  className="form-control"
                  data-field="completion_date"
                  value={form.completion_date}
                  onChange={(e) => setForm({ ...form, completion_date: e.target.value })}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="erp-field">
                <label className="form-label">Defect liability (days)</label>
                <input
                  type="number"
                  min="0"
                  max="3650"
                  name="defect_liability_days"
                  className="form-control"
                  data-field="defect_liability_days"
                  value={form.defect_liability_days}
                  onChange={(e) => setForm({ ...form, defect_liability_days: e.target.value })}
                />
                <span className="erp-help">Retention is released after it.</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="erp-field">
                <label className="form-label">Cost account</label>
                <select
                  name="expense_account_id"
                  className="form-select"
                  data-select2
                  data-placeholder="Choose later"
                  data-field="expense_account_id"
                  value={form.expense_account_id}
                  onChange={(e) => setForm({ ...form, expense_account_id: e.target.value })}
                >
                  <option value="">— Not set —</option>
                  {COA_ACCOUNT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} data-meta={opt.meta}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="erp-help">Bills cannot be posted without it.</span>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-3">
              <div className="erp-field">
                <label className="form-label">Retention %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="retention_percent"
                  className="form-control"
                  data-field="retention_percent"
                  value={form.retention_percent}
                  onChange={(e) => setForm({ ...form, retention_percent: e.target.value })}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="erp-field">
                <label className="form-label">TDS %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="tds_percent"
                  className="form-control"
                  data-field="tds_percent"
                  value={form.tds_percent}
                  onChange={(e) => setForm({ ...form, tds_percent: e.target.value })}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="erp-field">
                <label className="form-label">VAT %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="vat_percent"
                  className="form-control"
                  data-field="vat_percent"
                  value={form.vat_percent}
                  onChange={(e) => setForm({ ...form, vat_percent: e.target.value })}
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="erp-field">
                <label className="form-label">Advance recovery %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="advance_recovery_percent"
                  className="form-control"
                  data-field="advance_recovery_percent"
                  value={form.advance_recovery_percent}
                  onChange={(e) => setForm({ ...form, advance_recovery_percent: e.target.value })}
                />
                <span className="erp-help">0 recovers it all on the first bill that can carry it.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="erp-card-head">
          <div>
            <h2>Priced items</h2>
            <p>The schedule of rates every bill is measured against.</p>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-erp btn-sm"
              data-wo-from-boq
              onClick={() => setBoqModalOpen(true)}
            >
              <i className="fa-solid fa-file-invoice me-1" />
              Pull lines from the BOQ
            </button>
            <button
              type="button"
              className="btn btn-erp-ghost btn-sm"
              data-wo-add-row
              onClick={addRow}
            >
              <i className="fa-solid fa-plus me-1" />
              Add line
            </button>
          </div>
        </div>

        <div className="erp-card-body">
          <div className="erp-table-wrap">
            <table className="table erp-table" data-wo-items>
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>Code</th>
                  <th>Description</th>
                  <th style={{ width: "9%" }} title="The bill of quantities line this is let against">
                    BOQ line
                  </th>
                  <th style={{ width: "11%" }}>Unit</th>
                  <th className="text-end" style={{ width: "12%" }}>
                    Quantity
                  </th>
                  <th className="text-end" style={{ width: "13%" }}>
                    Rate
                  </th>
                  <th className="text-end" style={{ width: "13%" }}>
                    Amount
                  </th>
                  <th style={{ width: "5%" }} />
                </tr>
              </thead>
              <tbody data-wo-rows>
                {rows.map((r) => {
                  const rowAmount = (parseFloat(r.quantity) || 0) * (parseFloat(r.rate) || 0);
                  return (
                    <tr key={r.id} data-wo-row>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          data-cell="item_code"
                          maxLength={40}
                          value={r.item_code}
                          onChange={(e) => updateRow(r.id, { item_code: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          data-cell="description"
                          maxLength={500}
                          placeholder="Excavation in ordinary soil"
                          value={r.description}
                          onChange={(e) => updateRow(r.id, { description: e.target.value })}
                        />
                      </td>
                      <td>
                        <input type="hidden" data-cell="boq_item_id" value={r.boq_item_id} />
                        <span
                          className={`erp-wo-boqchip ${r.boq_item_id ? "" : "is-none"}`}
                          data-cell-boq
                        >
                          {r.boq_code || "—"}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          data-cell="uom_id"
                          value={r.uom_id}
                          onChange={(e) => updateRow(r.id, { uom_id: e.target.value })}
                        >
                          <option value="">—</option>
                          {UOM_OPTIONS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className="form-control form-control-sm text-end"
                          data-cell="quantity"
                          value={r.quantity}
                          onChange={(e) => updateRow(r.id, { quantity: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className="form-control form-control-sm text-end"
                          data-cell="rate"
                          value={r.rate}
                          onChange={(e) => updateRow(r.id, { rate: e.target.value })}
                        />
                      </td>
                      <td className="text-end">
                        <span data-cell-amount>{rowAmount.toFixed(2)}</span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          data-wo-drop-row
                          title="Remove"
                          onClick={() => removeRow(r.id)}
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="erp-cbs-group">
                  <td colSpan={6} className="text-end">
                    <strong>Contract value</strong>
                  </td>
                  <td className="text-end">
                    <strong data-wo-total>{totalAmount.toFixed(2)}</strong>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="erp-card-body pt-0 d-flex justify-content-end gap-2">
          <Link href="/contractors/work-orders" className="btn btn-erp-ghost">
            Cancel
          </Link>
          <button type="submit" className="btn btn-erp" data-wo-submit disabled={saving}>
            <i className="fa-solid fa-floppy-disk me-1" />
            Save as Draft
          </button>
        </div>
      </form>

      <div
        className={`modal fade ${boqModalOpen ? "show d-block" : ""}`}
        id="woBoqModal"
        tabIndex={-1}
        aria-hidden={!boqModalOpen}
        style={boqModalOpen ? { background: "rgba(0,0,0,0.45)" } : undefined}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content erp-form">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fa-solid fa-file-invoice me-2" />
                Lines from the bill of quantities
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setBoqModalOpen(false)}
              />
            </div>

            <div className="modal-body">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <strong data-wo-boq-label className="erp-help mb-0">
                  {form.project_id ? `${visibleBoqLines.length} lines available` : "Loading…"}
                </strong>
                <div className="ms-auto d-flex gap-2">
                  <input
                    type="search"
                    className="form-control form-control-sm"
                    style={{ maxWidth: "220px" }}
                    placeholder="Filter by code or description"
                    data-wo-boq-filter
                    value={boqFilter}
                    onChange={(e) => setBoqFilter(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    data-wo-boq-all
                    onClick={selectAllShownBoq}
                  >
                    Select all shown
                  </button>
                </div>
              </div>

              <div className="erp-table-wrap">
                <table className="table erp-table mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: "34px" }} />
                      <th style={{ width: "10%" }}>Code</th>
                      <th>Description</th>
                      <th style={{ width: "8%" }}>Unit</th>
                      <th className="text-end" style={{ width: "11%" }}>
                        Measured
                      </th>
                      <th className="text-end" style={{ width: "11%" }}>
                        Already let
                      </th>
                      <th
                        className="text-end"
                        style={{ width: "11%" }}
                        title="What is left to let — this is the quantity inserted"
                      >
                        Available
                      </th>
                      <th className="text-end" style={{ width: "12%" }}>
                        Bill rate
                      </th>
                    </tr>
                  </thead>
                  <tbody data-wo-boq-rows>
                    {visibleBoqLines.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="erp-cv-empty">
                          Loading the bill…
                        </td>
                      </tr>
                    ) : (
                      visibleBoqLines.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedBoqIds.includes(b.id)}
                              onChange={() => toggleBoqSelect(b.id)}
                            />
                          </td>
                          <td>
                            <code>{b.code}</code>
                          </td>
                          <td>{b.description}</td>
                          <td>{b.unit}</td>
                          <td className="text-end">{b.measured.toFixed(2)}</td>
                          <td className="text-end">{b.already_let.toFixed(2)}</td>
                          <td className="text-end">{b.available.toFixed(2)}</td>
                          <td className="text-end">{b.rate.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <span className="erp-help me-auto" data-wo-boq-count>
                {selectedBoqIds.length === 0
                  ? "Nothing selected."
                  : `${selectedBoqIds.length} selected.`}
              </span>
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setBoqModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-erp"
                data-wo-boq-insert
                data-loading
                onClick={insertSelectedBoq}
              >
                <i className="fa-solid fa-arrow-down me-2" />
                Insert selected lines
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
