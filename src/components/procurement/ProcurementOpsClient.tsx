"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

type ProcKind =
  | "material-requisitions"
  | "requirements"
  | "requisitions"
  | "rfqs"
  | "receipts"
  | "inspections"
  | "supplier-payments"
  | "material-issues"
  | "stock-transfers"
  | "material-consumptions";

export function ProcurementOpsClient({
  kind,
  rows,
  projects = [],
  warehouses = [],
  suppliers = [],
  boqs = [],
}: {
  kind: ProcKind;
  rows: Record<string, unknown>[];
  projects?: { id: number; name: string }[];
  warehouses?: { id: number; name: string }[];
  suppliers?: { id: number; companyName: string }[];
  boqs?: { id: number; title: string }[];
  purchases?: { id: number; code: string }[];
  receipts?: { id: number; code: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [direction, setDirection] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dueOnly, setDueOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const [reqForm, setReqForm] = useState({
    boq_id: boqs[0]?.id ? String(boqs[0].id) : "",
    title: "",
    factor: "100",
    warehouse_id: "",
    required_by: today,
    notes: "",
  });

  const projMap = new Map(projects.map((p) => [p.id, p.name]));
  const whMap = new Map(warehouses.map((w) => [w.id, w.name]));

  const filtered = rows.filter((r) => {
    if (status && String(r.status ?? r.result ?? "") !== status) return false;
    if (projectId && String(r.projectId ?? "") !== projectId) return false;
    if (priority && String(r.priority ?? "") !== priority) return false;
    if (warehouseId && String(r.warehouseId ?? r.fromWarehouseId ?? "") !== warehouseId)
      return false;
    if (supplierId && String(r.supplierId ?? "") !== supplierId) return false;
    if (dueOnly && String(r.status ?? "") === "closed") return false;
    const q = search.trim().toLowerCase();
    if (q && !JSON.stringify(r).toLowerCase().includes(q)) return false;
    return true;
  });

  const totalPaidOut =
    kind === "supplier-payments"
      ? rows.reduce((s, r) => s + Number(r.amount ?? 0), 0)
      : 0;

  async function handleRequirementSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/procurement/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqForm),
      });
      if (res.ok) {
        setModalOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  function renderTable() {
    return (
      <div className="erp-card-body is-flush">
        <div className="erp-table-wrap">
          <table className="table erp-table">
            <thead>
              <tr>
                <th>Code / Reference</th>
                <th>Scope / Party</th>
                <th>Date</th>
                <th className="text-end">Amount / Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const sup = r.supplier as { companyName?: string } | undefined;
                const po = r.purchaseOrder as { code?: string } | undefined;
                const grn = r.goodsReceipt as { code?: string } | undefined;
                const party =
                  sup?.companyName ??
                  po?.code ??
                  grn?.code ??
                  projMap.get(Number(r.projectId)) ??
                  whMap.get(Number(r.warehouseId)) ??
                  "—";
                const date = String(
                  r.reqDate ??
                    r.requiredBy ??
                    r.issueDate ??
                    r.receiptDate ??
                    r.inspectionDate ??
                    r.paymentDate ??
                    r.transferDate ??
                    r.consumptionDate ??
                    "—"
                );
                const amt = Number(
                  r.totalEst ?? r.amount ?? r.totalAmount ?? r.totalCost ?? r.factor ?? 0
                );
                const st = String(r.status ?? r.result ?? "draft");
                return (
                  <tr key={String(r.id)}>
                    <td className="erp-cell-strong">
                      {String(r.code ?? r.title ?? `REC-${r.id}`)}
                      {Boolean(r.title && r.code) && (
                        <span className="erp-identity-meta d-block">{String(r.title)}</span>
                      )}
                    </td>
                    <td>{party}</td>
                    <td>{date}</td>
                    <td className="text-end">
                      {kind === "requirements" ? `${amt}%` : amt.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`erp-pill ${
                          st === "passed" || st === "accepted" || st === "posted"
                            ? "is-available"
                            : "is-neutral"
                        }`}
                      >
                        {st}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (kind === "material-requisitions") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-hand"></i>
            </div>
            <div>
              <h1>Material Requisitions</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Procurement</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Material Requisitions
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <Link href="/procurement/requirements" className="btn btn-erp-ghost">
              <i className="fa-solid fa-chart-line me-2"></i>Requirements (planned)
            </Link>
          </div>
        </div>

        <div className="erp-note mb-3">
          <i className="fa-solid fa-circle-info me-2"></i>A <strong>requisition</strong> is a
          site asking for material it needs now — raised on a project, reviewed by somebody
          else, then sourced by moving stock or buying it. A{" "}
          <strong>
            <Link href="/procurement/requirements" className="erp-link">
              requirement
            </Link>
          </strong>{" "}
          is a planner&apos;s forecast of what a whole project will need, exploded from its
          bill.
        </div>

        <div className="erp-card">
          <div className="erp-card-head">
            <form
              method="GET"
              action="/procurement/material-requisitions"
              className="erp-filter-grid"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-search erp-search-sm erp-filter-wide">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="q"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by number or title…"
                  aria-label="Search"
                />
              </div>
              <select
                name="project_id"
                className="erp-select"
                data-select2
                data-placeholder="Project"
                aria-label="Project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                name="status"
                className="erp-select"
                data-select2
                data-placeholder="Status"
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Awaiting Review</option>
                <option value="planned">Approved</option>
                <option value="partially_ordered">Partly Ordered</option>
                <option value="ordered">Ordered</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="erp-filter-actions">
                <button type="submit" className="btn btn-erp btn-sm">
                  <i className="fa-solid fa-filter me-1"></i>Filter
                </button>
              </div>
            </form>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-card-body">
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-hand"></i>
                </div>
                <h3>No requisitions</h3>
                <p>
                  Sites raise these from a project&apos;s overview — tick what has run out and
                  press <strong>Request Material</strong>.
                </p>
              </div>
            </div>
          ) : (
            renderTable()
          )}
        </div>
      </div>
    );
  }

  if (kind === "requirements") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-calculator"></i>
            </div>
            <div>
              <h1>Material Requirements</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Procurement</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Requirements
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
                  "requirements.csv",
                  ["ID", "Title", "Status"],
                  filtered.map((r) => [
                    String(r.id ?? ""),
                    String(r.title ?? r.code ?? ""),
                    String(r.status ?? ""),
                  ])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <button
              type="button"
              className="btn btn-erp"
              data-req-create
              onClick={() => setModalOpen(true)}
            >
              <i className="fa-solid fa-plus me-2"></i>Plan From BOQ
            </button>
          </div>
        </div>

        <div className="erp-chain" aria-label="Procurement chain">
          <span className="erp-chain-step">
            <i className="fa-solid fa-list-check"></i>BOQ
          </span>
          <span className="erp-chain-step is-here">
            <i className="fa-solid fa-calculator"></i>Requirement
          </span>
          <span className="erp-chain-step">
            <i className="fa-solid fa-file-pen"></i>Requisition
          </span>
          <span className="erp-chain-step">
            <i className="fa-solid fa-envelope-open-text"></i>RFQ
          </span>
          <span className="erp-chain-step">
            <i className="fa-solid fa-tags"></i>Quotation
          </span>
          <span className="erp-chain-step">
            <i className="fa-solid fa-cart-shopping"></i>Order
          </span>
          <span className="erp-chain-step">
            <i className="fa-solid fa-truck-ramp-box"></i>Receipt
          </span>
          <span className="erp-chain-step">
            <i className="fa-solid fa-clipboard-check"></i>Inspection
          </span>
          <span className="erp-chain-step">
            <i className="fa-solid fa-warehouse"></i>Warehouse
          </span>
          <span className="erp-chain-step">
            <i className="fa-solid fa-person-carry-box"></i>Issue
          </span>
          <span className="erp-chain-step">
            <i className="fa-solid fa-fire"></i>Consumption
          </span>
        </div>

        <div className="erp-card mb-3">
          <div className="erp-card-body">
            <div className="erp-target-summary" data-req-summary>
              <div className="erp-target-summary-card is-headline">
                <span className="erp-target-summary-label">
                  <i className="fa-solid fa-triangle-exclamation me-1"></i>Short, in money
                </span>
                <strong data-summary-value>BDT 0</strong>
                <span className="erp-help">What still has to be bought</span>
              </div>
              <div className="erp-target-summary-card">
                <span className="erp-target-summary-label">
                  <i className="fa-solid fa-clock me-1"></i>Wanted within 7 days
                </span>
                <strong data-summary-due>0</strong>
                <span className="erp-help">Buy these first</span>
              </div>
              <div className="erp-target-summary-card">
                <span className="erp-target-summary-label">
                  <i className="fa-solid fa-cart-arrow-down me-1"></i>Open to order
                </span>
                <strong data-summary-open>0</strong>
              </div>
              <div className="erp-target-summary-card">
                <span className="erp-target-summary-label">
                  <i className="fa-solid fa-layer-group me-1"></i>Plans
                </span>
                <strong data-summary-plans>{rows.length}</strong>
              </div>
            </div>
          </div>
        </div>

        <div
          className="erp-card"
          data-req-page
          data-store-url="/procurement/requirements"
        >
          <div className="erp-card-head">
            <form
              method="GET"
              action="/procurement/requirements"
              className="erp-filter-grid is-requirements"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-search erp-search-sm erp-filter-wide">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="q"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search plans…"
                  aria-label="Search by number or title"
                />
              </div>

              <select
                name="project_id"
                className="erp-select"
                data-select2
                data-placeholder="Project"
                aria-label="Project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                name="status"
                className="erp-select"
                data-select2
                data-placeholder="Status"
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Awaiting Review</option>
                <option value="planned">Approved</option>
                <option value="partially_ordered">Partly Ordered</option>
                <option value="ordered">Ordered</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <label className="erp-check erp-filter-check">
                <input
                  type="checkbox"
                  name="due"
                  value="1"
                  checked={dueOnly}
                  onChange={(e) => setDueOnly(e.target.checked)}
                />
                <span>Due soon</span>
              </label>

              <div className="erp-filter-actions">
                <button type="submit" className="btn btn-erp btn-sm">
                  <i className="fa-solid fa-filter me-1"></i>Filter
                </button>
              </div>
            </form>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-card-body">
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-calculator"></i>
                </div>
                <h3>Nothing planned yet</h3>
                <p>
                  A requirement takes a project&apos;s bill of quantities, subtracts what is
                  already on the shelf and on order, and tells you what to buy.
                </p>
                <button
                  type="button"
                  className="btn btn-erp"
                  data-req-create
                  onClick={() => setModalOpen(true)}
                >
                  <i className="fa-solid fa-plus me-2"></i>Plan the first one
                </button>
              </div>
            </div>
          ) : (
            renderTable()
          )}
        </div>

        <div
          className={`modal fade ${modalOpen ? "show d-block" : ""}`}
          id="requirementModal"
          tabIndex={-1}
          aria-hidden={!modalOpen}
          style={modalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form
                method="POST"
                className="erp-form"
                action="/procurement/requirements"
                data-req-form
                data-submit-lock="off"
                noValidate
                onSubmit={handleRequirementSave}
              >
                <div className="modal-header">
                  <h5 className="mb-0" style={{ fontSize: "16px", fontWeight: 600 }}>
                    <i className="fa-solid fa-calculator me-2 text-muted"></i>Plan From BOQ
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => setModalOpen(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <div
                    className="alert alert-danger py-2 px-3 mb-3"
                    role="alert"
                    style={{ borderRadius: "9px", fontSize: "12.5px" }}
                    data-req-error
                    hidden
                  >
                    <span data-req-error-text></span>
                  </div>

                  <div className="erp-field">
                    <label className="form-label" htmlFor="req_boq">
                      Bill of Quantities <span className="erp-required">*</span>
                    </label>
                    <select
                      id="req_boq"
                      name="boq_id"
                      className="erp-select"
                      data-select2
                      required
                      value={reqForm.boq_id}
                      onChange={(e) => setReqForm({ ...reqForm, boq_id: e.target.value })}
                    >
                      <option value="">Choose a bill</option>
                      {boqs.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                    <span className="erp-help">
                      Only active bills. A superseded one is not what the project is building
                      to.
                    </span>
                    <span className="erp-error" data-error-for="boq_id"></span>
                  </div>

                  <div className="row">
                    <div className="col-md-7">
                      <div className="erp-field">
                        <label className="form-label" htmlFor="req_title">
                          Title
                        </label>
                        <input
                          type="text"
                          id="req_title"
                          name="title"
                          className="form-control"
                          maxLength={190}
                          placeholder="Ground floor slab"
                          value={reqForm.title}
                          onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })}
                        />
                        <span className="erp-error" data-error-for="title"></span>
                      </div>
                    </div>

                    <div className="col-md-5">
                      <div className="erp-field">
                        <label className="form-label" htmlFor="req_factor">
                          Share of the bill
                        </label>
                        <div className="erp-input-suffix">
                          <input
                            type="number"
                            id="req_factor"
                            name="factor"
                            className="form-control"
                            step="1"
                            min="1"
                            max="100"
                            value={reqForm.factor}
                            onChange={(e) =>
                              setReqForm({ ...reqForm, factor: e.target.value })
                            }
                            data-req-percent
                          />
                          <span>%</span>
                        </div>
                        <span className="erp-help">100% takes the whole bill.</span>
                        <span className="erp-error" data-error-for="factor"></span>
                      </div>
                    </div>

                    <div className="col-md-7">
                      <div className="erp-field">
                        <label className="form-label" htmlFor="req_warehouse">
                          Netted Against
                        </label>
                        <select
                          id="req_warehouse"
                          name="warehouse_id"
                          className="erp-select"
                          data-select2
                          value={reqForm.warehouse_id}
                          onChange={(e) =>
                            setReqForm({ ...reqForm, warehouse_id: e.target.value })
                          }
                        >
                          <option value="">Everywhere in the company</option>
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                        <span className="erp-help">
                          Which store&apos;s stock counts as already held.
                        </span>
                        <span className="erp-error" data-error-for="warehouse_id"></span>
                      </div>
                    </div>

                    <div className="col-md-5">
                      <div className="erp-field">
                        <label className="form-label" htmlFor="req_required_by">
                          Wanted By <span className="erp-required">*</span>
                        </label>
                        <input
                          type="date"
                          id="req_required_by"
                          name="required_by"
                          className="form-control"
                          value={reqForm.required_by}
                          onChange={(e) =>
                            setReqForm({ ...reqForm, required_by: e.target.value })
                          }
                          required
                        />
                        <span className="erp-error" data-error-for="required_by"></span>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="erp-field">
                        <label className="form-label" htmlFor="req_notes">
                          Notes
                        </label>
                        <textarea
                          id="req_notes"
                          name="notes"
                          className="form-control"
                          rows={2}
                          maxLength={1000}
                          value={reqForm.notes}
                          onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })}
                        ></textarea>
                        <span className="erp-error" data-error-for="notes"></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    data-bs-dismiss="modal"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-erp"
                    data-req-submit
                    disabled={busy}
                  >
                    <i className="fa-solid fa-calculator me-2"></i>
                    <span>Plan &amp; Net</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="modal fade" id="deleteRecordModal" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ border: "none", borderRadius: "14px" }}>
              <div className="modal-body p-4">
                <div className="d-flex gap-3">
                  <div className="erp-kpi-icon is-danger">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div>
                    <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                      Delete requirement?
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                      <strong data-delete-name></strong> will be removed from active use. The
                      record is retained and can be restored by an administrator.
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal">
                  Cancel
                </button>
                <form method="POST" data-delete-form>
                  <input type="hidden" name="_method" value="DELETE" />
                  <button
                    type="submit"
                    className="btn btn-erp"
                    style={{
                      background: "var(--erp-danger)",
                      borderColor: "var(--erp-danger)",
                    }}
                  >
                    <i className="fa-solid fa-trash-can me-2"></i>Delete
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "requisitions") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-clipboard-list"></i>
            </div>
            <div>
              <h1>Purchase Requisitions</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Procurement</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Requisitions
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
                  "requisitions.csv",
                  ["ID", "Code", "Status"],
                  filtered.map((r) => [
                    String(r.id ?? ""),
                    String(r.code ?? ""),
                    String(r.status ?? ""),
                  ])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <button
              type="button"
              className="btn btn-erp-ghost"
              data-bs-toggle="modal"
              data-bs-target="#fromRequirementModal"
              onClick={() => setModalOpen(true)}
            >
              <i className="fa-solid fa-calculator me-2"></i>From Requirement
            </button>
            <Link href="/requisitions/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Requisition
            </Link>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-card-head">
            <form
              method="GET"
              action="/requisitions"
              className="erp-filterbar"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-daterange" aria-label="Required-by range">
                <input
                  type="date"
                  name="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="erp-select"
                  aria-label="From"
                  title="Required from"
                />
                <span>–</span>
                <input
                  type="date"
                  name="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="erp-select"
                  aria-label="To"
                  title="Required to"
                />
              </div>
              <div className="erp-search erp-search-sm">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Code or title…"
                  aria-label="Search"
                />
              </div>
              <select
                name="status"
                className="erp-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Status"
              >
                <option value="">Any status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="converted">Ordered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                name="priority"
                className="erp-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                aria-label="Priority"
              >
                <option value="">Any priority</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <select
                name="warehouse_id"
                className="erp-select"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                aria-label="Warehouse"
              >
                <option value="">All warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </form>
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} {filtered.length === 1 ? "requisition" : "requisitions"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-clipboard-list"></i>
              </div>
              <h3>No requisitions yet</h3>
              <p>
                Raise an internal request for materials; once approved it can be turned into a
                purchase order.
              </p>
              <Link href="/requisitions/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Requisition
              </Link>
            </div>
          ) : (
            renderTable()
          )}
        </div>

        <div
          className={`modal fade ${modalOpen ? "show d-block" : ""}`}
          id="fromRequirementModal"
          tabIndex={-1}
          aria-hidden={!modalOpen}
          style={modalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered">
            <form
              method="POST"
              action="/requisitions/from-requirement"
              className="modal-content"
              onSubmit={(e) => {
                e.preventDefault();
                setModalOpen(false);
              }}
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fa-solid fa-calculator me-2"></i>Requisition From Material
                  Requirement
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  onClick={() => setModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="erp-empty py-3">
                  <div className="erp-empty-icon">
                    <i className="fa-solid fa-calculator"></i>
                  </div>
                  <h3>No planned requirements</h3>
                  <p className="mb-0">
                    A material requirement has to be <strong>planned</strong> before a
                    requisition can be raised from it. Open a requirement and choose{" "}
                    <strong>Plan</strong> first.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  data-bs-dismiss="modal"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "rfqs") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-file-lines"></i>
            </div>
            <div>
              <h1>RFQ / Quotations</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Procurement</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    RFQ
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-card-head">
            <form
              method="GET"
              action="/rfqs"
              className="erp-filterbar"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-search erp-search-sm">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="RFQ code or title…"
                  aria-label="Search"
                />
              </div>
              <select
                name="status"
                className="erp-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Status"
              >
                <option value="">Any status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="awarded">Awarded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </form>
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} RFQS
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-file-lines"></i>
              </div>
              <h3>No RFQs yet</h3>
              <p>
                Raise an RFQ from an approved purchase requisition to collect and compare
                supplier quotations.
              </p>
              <Link href="/requisitions" className="btn btn-erp-ghost">
                <i className="fa-solid fa-clipboard-list me-2"></i>Requisitions
              </Link>
            </div>
          ) : (
            renderTable()
          )}
        </div>
      </div>
    );
  }

  if (kind === "receipts") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-truck-ramp-box"></i>
            </div>
            <div>
              <h1>Goods Receipts</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Procurement</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Goods Receipts
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-card-head">
            <form
              method="GET"
              action="/purchases/receipts"
              className="erp-filterbar"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-search erp-search-sm">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Receipt code or delivery note…"
                  aria-label="Search"
                />
              </div>
              <select
                name="status"
                className="erp-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Status"
              >
                <option value="">Any status</option>
                <option value="posted">Posted</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </form>
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} {filtered.length === 1 ? "receipt" : "receipts"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-truck-ramp-box"></i>
              </div>
              <h3>No goods receipts yet</h3>
              <p>Receipts are created when goods arrive against a placed purchase order.</p>
            </div>
          ) : (
            renderTable()
          )}
        </div>
      </div>
    );
  }

  if (kind === "inspections") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-clipboard-check"></i>
            </div>
            <div>
              <h1>Quality Inspections</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Procurement</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Inspections
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
                  "inspections.csv",
                  ["ID", "Code", "Result"],
                  filtered.map((r) => [
                    String(r.id ?? ""),
                    String(r.code ?? ""),
                    String(r.result ?? ""),
                  ])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/purchases/receipts" className="btn btn-erp">
              <i className="fa-solid fa-truck-ramp-box me-2"></i>Goods Receipts
            </Link>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-card-head">
            <form
              method="GET"
              action="/procurement/inspections"
              className="erp-filter-grid"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-search erp-search-sm erp-filter-wide">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by inspection or receipt no…"
                  aria-label="Search"
                />
              </div>
              <select
                name="result"
                className="erp-select"
                data-select2
                data-placeholder="Result"
                aria-label="Result"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Result</option>
                <option value="pending">Awaiting Inspection</option>
                <option value="accepted">Accepted</option>
                <option value="partially_accepted">Partly Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="erp-filter-actions">
                <button type="submit" className="btn btn-erp btn-sm">
                  <i className="fa-solid fa-filter me-1"></i>Filter
                </button>
              </div>
            </form>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-card-body">
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-clipboard-check"></i>
                </div>
                <h3>No inspections yet</h3>
                <p>
                  An inspection is opened against a goods receipt. Open a receipt and choose{" "}
                  <strong>Inspect Delivery</strong> to check what arrived before it reaches the
                  shelf.
                </p>
                <Link href="/purchases/receipts" className="btn btn-erp">
                  <i className="fa-solid fa-truck-ramp-box me-2"></i>Go to Goods Receipts
                </Link>
              </div>
            </div>
          ) : (
            renderTable()
          )}
        </div>
      </div>
    );
  }

  if (kind === "supplier-payments") {
    const draftCount = rows.filter((r) => r.status === "draft").length;
    const postedCount = rows.filter((r) => r.status === "posted").length;
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-money-bill-transfer"></i>
            </div>
            <div>
              <h1>Supplier Payments</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Procurement</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Supplier Payments
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <Link href="/purchases/supplier-payments" className="btn btn-erp-ghost">
              <i className="fa-solid fa-calendar-days me-2"></i>Installment Plans
            </Link>
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() =>
                downloadCsv(
                  "supplier-payments.csv",
                  ["ID", "Code", "Amount", "Status"],
                  filtered.map((r) => [
                    String(r.id ?? ""),
                    String(r.code ?? ""),
                    String(r.amount ?? 0),
                    String(r.status ?? ""),
                  ])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/purchases/supplier-payments/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>Pay a Supplier
            </Link>
          </div>
        </div>

        <div className="erp-sale-strip">
          <div className="erp-sale-stat ">
            <span className="erp-sale-stat-label">Still Owed</span>
            <strong>0.00</strong>
            <span className="erp-sale-stat-foot">Across {suppliers.length} suppliers</span>
          </div>
          <div className="erp-sale-stat">
            <span className="erp-sale-stat-label">Paid Out</span>
            <strong>{totalPaidOut.toFixed(2)}</strong>
            <span className="erp-sale-stat-foot">{postedCount} posted payouts</span>
          </div>
          <div className="erp-sale-stat ">
            <span className="erp-sale-stat-label">Drafts</span>
            <strong>{draftCount}</strong>
            <span className="erp-sale-stat-foot">Prepared, not yet paid</span>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-toolbar">
            <form
              method="GET"
              className="erp-filterbar"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-search erp-search-sm">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="q"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Voucher, reference, supplier…"
                  aria-label="Search"
                />
              </div>
              <select
                name="supplier_id"
                className="erp-select"
                data-select2
                data-placeholder="All suppliers"
                aria-label="Supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">All suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
              <select
                name="status"
                className="erp-select"
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Any status</option>
                <option value="draft">Draft</option>
                <option value="posted">Posted</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="erp-daterange" aria-label="Date range">
                <input
                  type="date"
                  name="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="erp-select"
                  aria-label="From"
                />
                <span>&ndash;</span>
                <input
                  type="date"
                  name="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="erp-select"
                  aria-label="To"
                />
                <button type="submit" className="btn btn-erp-ghost btn-sm">
                  Apply
                </button>
              </div>
            </form>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-money-bill-transfer"></i>
              </div>
              <h3>No supplier payments yet</h3>
              <p>
                A payout settles what posted goods receipts left owing, and posts{" "}
                <strong>Dr Trade Payables / Cr Cash</strong> to the ledger.
              </p>
            </div>
          ) : (
            renderTable()
          )}
        </div>
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
              <h1>Material Issues</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Procurement</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Material Issues
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
                  "material-issues.csv",
                  ["ID", "Code", "Status"],
                  filtered.map((r) => [
                    String(r.id ?? ""),
                    String(r.code ?? ""),
                    String(r.status ?? ""),
                  ])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/material-issues/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Issue
            </Link>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-card-head">
            <form
              method="GET"
              action="/material-issues"
              className="erp-filter-grid"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-search erp-search-sm erp-filter-wide">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by issue no…"
                  aria-label="Search"
                />
              </div>
              <select
                name="project_id"
                className="erp-select"
                data-select2
                data-placeholder="Project"
                aria-label="Project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                name="status"
                className="erp-select"
                data-select2
                data-placeholder="Status"
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Awaiting Approval</option>
                <option value="approved">Approved</option>
                <option value="issued">Issued</option>
                <option value="cancelled">Cancelled</option>
                <option value="reversed">Reversed</option>
              </select>
              <div className="erp-filter-actions">
                <button type="submit" className="btn btn-erp btn-sm">
                  <i className="fa-solid fa-filter me-1"></i>Filter
                </button>
              </div>
            </form>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-card-body">
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-person-carry-box"></i>
                </div>
                <h3>No issues yet</h3>
                <p>
                  A material issue moves stock from a store out to a project. It is written,
                  approved, then posted — which is when the stock actually leaves the shelf.
                </p>
                <Link href="/material-issues/create" className="btn btn-erp">
                  <i className="fa-solid fa-plus me-2"></i>Raise the first one
                </Link>
              </div>
            </div>
          ) : (
            renderTable()
          )}
        </div>
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
              <h1>Stock Transfers</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Inventory</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Transfers
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
                  "stock-transfers.csv",
                  ["ID", "Code", "Status"],
                  filtered.map((r) => [
                    String(r.id ?? ""),
                    String(r.code ?? ""),
                    String(r.status ?? ""),
                  ])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/inventory/stock-transfers/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Transfer
            </Link>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-toolbar">
            <form
              method="GET"
              className="d-flex flex-wrap align-items-end gap-2 flex-grow-1"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Transfer no. or reference…"
                />
              </div>

              <select
                name="status"
                className="form-select erp-select"
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Any status</option>
                <option value="draft">Draft</option>
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="picked">Picked</option>
                <option value="in_transit">In Transit</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                name="warehouse"
                className="form-select erp-select"
                aria-label="Store"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">Any store</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <select
                name="direction"
                className="form-select erp-select"
                aria-label="Direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
              >
                <option value="">In and out</option>
                <option value="out">Sent from it</option>
                <option value="in">Coming to it</option>
              </select>

              <label className="erp-inline-date">
                <span>From</span>
                <input
                  type="date"
                  name="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="form-control form-control-sm"
                />
              </label>
              <label className="erp-inline-date">
                <span>To</span>
                <input
                  type="date"
                  name="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="form-control form-control-sm"
                />
              </label>

              <button type="submit" className="btn btn-erp-ghost">
                <i className="fa-solid fa-filter"></i>
              </button>
            </form>

            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} {filtered.length === 1 ? "transfer" : "transfers"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-truck-fast"></i>
              </div>
              <h3>No stock transfers yet</h3>
              <p>Move material between stores &mdash; central to site, site to site, or back again.</p>
              <Link href="/inventory/stock-transfers/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Transfer
              </Link>
            </div>
          ) : (
            renderTable()
          )}
        </div>

        <div className="modal fade" id="deleteRecordModal" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ border: "none", borderRadius: "14px" }}>
              <div className="modal-body p-4">
                <div className="d-flex gap-3">
                  <div className="erp-kpi-icon is-danger">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div>
                    <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                      Delete stock transfer?
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                      <strong data-delete-name></strong> will be removed from active use. The
                      record is retained and can be restored by an administrator.
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal">
                  Cancel
                </button>
                <form method="POST" data-delete-form>
                  <input type="hidden" name="_method" value="DELETE" />
                  <button
                    type="submit"
                    className="btn btn-erp"
                    style={{
                      background: "var(--erp-danger)",
                      borderColor: "var(--erp-danger)",
                    }}
                  >
                    <i className="fa-solid fa-trash-can me-2"></i>Delete
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
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
            <h1>Material Consumption</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Procurement</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Material Consumption
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
                "material-consumptions.csv",
                ["ID", "Code", "Status"],
                filtered.map((r) => [
                  String(r.id ?? ""),
                  String(r.code ?? ""),
                  String(r.status ?? ""),
                ])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </button>
          <Link href="/material-consumptions/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>Record Consumption
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-card-head">
          <form
            method="GET"
            action="/material-consumptions"
            className="erp-filter-grid"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-search erp-search-sm erp-filter-wide">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by consumption no…"
                aria-label="Search"
              />
            </div>
            <select
              name="project_id"
              className="erp-select"
              data-select2
              data-placeholder="Project"
              aria-label="Project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              name="status"
              className="erp-select"
              data-select2
              data-placeholder="Status"
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Awaiting Approval</option>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="erp-filter-actions">
              <button type="submit" className="btn btn-erp btn-sm">
                <i className="fa-solid fa-filter me-1"></i>Filter
              </button>
            </div>
          </form>
        </div>

        {filtered.length === 0 ? (
          <div className="erp-card-body">
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-fire"></i>
              </div>
              <h3>Nothing recorded yet</h3>
              <p>
                A consumption record says what material was used on a piece of work — which is
                what the variance report measures against the bill of quantities.
              </p>
              <Link href="/material-consumptions/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>Record the first one
              </Link>
            </div>
          </div>
        ) : (
          renderTable()
        )}
      </div>
    </div>
  );
}
