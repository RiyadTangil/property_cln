"use client";

import Link from "next/link";
import { useState } from "react";
import { EquipmentSubmenu } from "./EquipmentSubmenu";

export function EquipmentWorkOrderDetailClient({
  wo,
}: {
  wo: {
    id: number;
    code: string;
    type: string;
    priority: string;
    symptoms: string;
    estimatedCost: number;
    status: string;
    equipment: { id: number; code: string; name: string } | null;
  };
}) {
  const [lineTab, setLineTab] = useState<"part" | "labour">("part");
  const [fromStock, setFromStock] = useState(false);
  const [transitionStatus, setTransitionStatus] = useState("approved");
  const [lines, setLines] = useState<Array<{ id: number; item: string; qty: string; rate: number; amount: number }>>([]);
  const [partForm, setPartForm] = useState({ part_name: "", part_no: "", quantity: "1", rate: "" });
  const [labourForm, setLabourForm] = useState({ employee_id: "", worker_name: "", work_date: "2026-11-17", hours: "", rate: "" });

  function handleAddPart(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(partForm.quantity || 1);
    const rate = Number(partForm.rate || 0);
    setLines((prev) => [
      ...prev,
      { id: Date.now(), item: `${partForm.part_name}${partForm.part_no ? ` (${partForm.part_no})` : ""}`, qty: String(qty), rate, amount: qty * rate },
    ]);
    setPartForm({ part_name: "", part_no: "", quantity: "1", rate: "" });
  }

  function handleAddLabour(e: React.FormEvent) {
    e.preventDefault();
    const hrs = Number(labourForm.hours || 1);
    const rate = Number(labourForm.rate || 0);
    setLines((prev) => [
      ...prev,
      {
        id: Date.now(),
        item: `Labour — ${labourForm.worker_name || labourForm.employee_id || "Fitter"} (${labourForm.work_date})`,
        qty: `${hrs} hr`,
        rate,
        amount: hrs * rate,
      },
    ]);
    setLabourForm({ employee_id: "", worker_name: "", work_date: "2026-11-17", hours: "", rate: "" });
  }

  const totalCost = lines.reduce((s, l) => s + l.amount, 0) || wo.estimatedCost;

  return (
    <div className="container ">
      <EquipmentSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <div>
            <h1>{wo.code}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/equipment">Equipment</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/equipment/work-orders">Work Orders</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {wo.code}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          {wo.equipment && (
            <Link href={`/equipment/register/${wo.equipment.id}`} className="btn btn-erp-ghost">
              <i className="fa-solid fa-tractor me-2" />
              {wo.equipment.code}
            </Link>
          )}
        </div>
      </div>

      <div className="erp-statrow">
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-bullhorn" />
          </span>
          <span className="erp-stat-body">
            <strong className="text-capitalize">{wo.status || "Reported"}</strong>
            <small>{wo.type === "preventive" ? "Scheduled service" : "Breakdown / repair"}</small>
          </span>
        </div>
        <div className="erp-stat ">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-clock" />
          </span>
          <span className="erp-stat-body">
            <strong>0.0 hr</strong>
            <small>machine down</small>
          </span>
        </div>
        <div className="erp-stat ">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-box-open" />
          </span>
          <span className="erp-stat-body">
            <strong>0.0 hr</strong>
            <small>waiting to start</small>
          </span>
        </div>
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-coins" />
          </span>
          <span className="erp-stat-body">
            <strong>{totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <small>total cost</small>
          </span>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-xl-8">
          <div className="erp-card">
            <div className="erp-card-head">
              <h2>
                <i className="fa-solid fa-clipboard me-2" />
                The job
              </h2>
            </div>
            <div className="erp-card-body">
              <ul className="erp-keyval">
                <li>
                  <span>Machine</span>
                  <strong>{wo.equipment ? `${wo.equipment.code} — ${wo.equipment.name}` : "EQP-0002 — Hitachi ZX200 Excavator"}</strong>
                </li>
                <li>
                  <span>Project</span>
                  <strong>yard</strong>
                </li>
                <li>
                  <span>Reported</span>
                  <strong>30 Oct 2026 11:23</strong>
                </li>
                <li>
                  <span>Stopped working</span>
                  <strong>28 Oct 2026 11:23</strong>
                </li>
                <li>
                  <span>Mechanic</span>
                  <strong>—</strong>
                </li>
                <li>
                  <span>Outside workshop</span>
                  <strong>—</strong>
                </li>
              </ul>

              <h6 className="text-muted mt-3">Symptoms</h6>
              <p className="mb-2">{wo.symptoms}</p>
            </div>
          </div>

          <div
            className="erp-card mt-3"
            data-lines-card
            data-add-url={`/equipment/work-orders/${wo.id}/lines`}
            data-remove-url={`/equipment/work-orders/${wo.id}/lines/__KIND__/__ID__`}
          >
            <div className="erp-card-head">
              <h2>
                <i className="fa-solid fa-list me-2" />
                Parts and labour
              </h2>
              <span className="erp-identity-meta">
                parts <strong data-parts-cost>0.00</strong> · labour <strong data-labour-cost>0.00</strong> · total{" "}
                <strong data-total-cost>{totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </span>
            </div>

            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-end">Qty / hrs</th>
                      <th className="text-end">Rate</th>
                      <th className="text-end">Amount</th>
                      <th className="text-end" />
                    </tr>
                  </thead>
                  <tbody data-lines-body>
                    {lines.length === 0 ? (
                      <tr data-empty-row>
                        <td colSpan={5} className="text-center text-muted py-3">
                          Nothing recorded yet. An in-house repair with no labour on it looks free,
                          and then the workshop looks like a cost centre that produces nothing.
                        </td>
                      </tr>
                    ) : (
                      lines.map((line) => (
                        <tr key={line.id}>
                          <td>{line.item}</td>
                          <td className="text-end">{line.qty}</td>
                          <td className="text-end">{line.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="text-end erp-cell-strong">{line.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-danger"
                              onClick={() => setLines((prev) => prev.filter((x) => x.id !== line.id))}
                            >
                              <i className="fa-solid fa-trash-can" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="erp-card-foot">
              <div className="d-flex gap-2 mb-2">
                <button
                  type="button"
                  className={`btn btn-erp-ghost btn-sm ${lineTab === "part" ? "active" : ""}`}
                  data-line-tab="part"
                  onClick={() => setLineTab("part")}
                >
                  <i className="fa-solid fa-gear me-1" />
                  Add a part
                </button>
                <button
                  type="button"
                  className={`btn btn-erp-ghost btn-sm ${lineTab === "labour" ? "active" : ""}`}
                  data-line-tab="labour"
                  onClick={() => setLineTab("labour")}
                >
                  <i className="fa-solid fa-user-gear me-1" />
                  Add labour
                </button>
              </div>

              <form data-line-form="part" className={lineTab === "part" ? "" : "d-none"} onSubmit={handleAddPart}>
                <input type="hidden" name="kind" value="part" />

                <div className="row g-2 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="partName">
                      Part <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="partName"
                      name="part_name"
                      className="form-control form-control-sm"
                      required
                      maxLength={190}
                      placeholder="Hydraulic hose, 1 inch"
                      value={partForm.part_name}
                      onChange={(e) => setPartForm({ ...partForm, part_name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="partNo">
                      Part no
                    </label>
                    <input
                      type="text"
                      id="partNo"
                      name="part_no"
                      className="form-control form-control-sm"
                      maxLength={80}
                      value={partForm.part_no}
                      onChange={(e) => setPartForm({ ...partForm, part_no: e.target.value })}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="partQty">
                      Quantity <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      id="partQty"
                      name="quantity"
                      className="form-control form-control-sm"
                      required
                      value={partForm.quantity}
                      onChange={(e) => setPartForm({ ...partForm, quantity: e.target.value })}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="partRate">
                      Rate <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="partRate"
                      name="rate"
                      className="form-control form-control-sm"
                      required
                      value={partForm.rate}
                      onChange={(e) => setPartForm({ ...partForm, rate: e.target.value })}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        name="from_stock"
                        value="1"
                        data-from-stock
                        checked={fromStock}
                        onChange={(e) => setFromStock(e.target.checked)}
                      />
                      <span className="form-check-label" style={{ fontSize: 12 }}>
                        From the store
                      </span>
                    </label>
                    <button type="submit" className="btn btn-erp btn-sm w-100" data-submit-button>
                      <i className="fa-solid fa-plus" />
                    </button>
                  </div>
                </div>

                <div className={`row g-2 align-items-end mt-1 ${fromStock ? "" : "d-none"}`} data-stock-fields>
                  <div className="col-md-5">
                    <label className="form-label" htmlFor="partProduct">
                      Stock item <span className="text-danger">*</span>
                    </label>
                    <select id="partProduct" name="product_id" className="form-select form-select-sm">
                      <option value="">Choose the stock item</option>
                      <option value="54">AAC Block</option>
                      <option value="215">APP Membrane</option>
                      <option value="72">Accelerator</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="partWarehouse">
                      Out of which store <span className="text-danger">*</span>
                    </label>
                    <select id="partWarehouse" name="warehouse_id" className="form-select form-select-sm">
                      <option value="">Choose a store</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <div className="form-text mb-2">
                      The shelf count drops and the value moves out of Raw Materials as soon as this is added.
                    </div>
                  </div>
                </div>
              </form>

              <form
                data-line-form="labour"
                className={`row g-2 align-items-end ${lineTab === "labour" ? "" : "d-none"}`}
                onSubmit={handleAddLabour}
              >
                <input type="hidden" name="kind" value="labour" />

                <div className="col-md-3">
                  <label className="form-label" htmlFor="labourEmployee">
                    Fitter
                  </label>
                  <select
                    id="labourEmployee"
                    name="employee_id"
                    className="form-select form-select-sm"
                    value={labourForm.employee_id}
                    onChange={(e) => setLabourForm({ ...labourForm, employee_id: e.target.value })}
                  >
                    <option value="">Not on our payroll</option>
                    <option value="MD. GOLAM RABBANY RONY">MD. GOLAM RABBANY RONY</option>
                    <option value="Muhamma Arif Al Imran">Muhamma Arif Al Imran</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label" htmlFor="labourName">
                    Or a name
                  </label>
                  <input
                    type="text"
                    id="labourName"
                    name="worker_name"
                    className="form-control form-control-sm"
                    maxLength={150}
                    value={labourForm.worker_name}
                    onChange={(e) => setLabourForm({ ...labourForm, worker_name: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label" htmlFor="labourDate">
                    Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    id="labourDate"
                    name="work_date"
                    className="form-control form-control-sm"
                    required
                    value={labourForm.work_date}
                    onChange={(e) => setLabourForm({ ...labourForm, work_date: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label" htmlFor="labourHours">
                    Hours <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    id="labourHours"
                    name="hours"
                    className="form-control form-control-sm"
                    required
                    value={labourForm.hours}
                    onChange={(e) => setLabourForm({ ...labourForm, hours: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label" htmlFor="labourRate">
                    Rate <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="labourRate"
                    name="rate"
                    className="form-control form-control-sm"
                    required
                    value={labourForm.rate}
                    onChange={(e) => setLabourForm({ ...labourForm, rate: e.target.value })}
                  />
                </div>
                <div className="col-md-1">
                  <button type="submit" className="btn btn-erp btn-sm w-100" data-submit-button>
                    <i className="fa-solid fa-plus" />
                  </button>
                </div>
              </form>

              <div className="form-text mt-2">
                Record our own fitters&apos; time as well as an outside invoice. Without it an in-house repair looks free,
                and the decision to keep a workshop gets made on a number nobody ever counted.
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="erp-card">
            <div className="erp-card-head">
              <h2>
                <i className="fa-solid fa-bolt me-2" />
                Next step
              </h2>
            </div>

            <div className="erp-card-body">
              <form
                method="POST"
                action={`/equipment/work-orders/${wo.id}/transition`}
                data-transition-form
                onSubmit={(e) => e.preventDefault()}
              >
                <label className="form-label" htmlFor="transitionStatus">
                  Move to
                </label>
                <select
                  id="transitionStatus"
                  name="status"
                  className="form-select mb-3"
                  data-transition-status
                  value={transitionStatus}
                  onChange={(e) => setTransitionStatus(e.target.value)}
                >
                  <option value="approved">Approved</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="verified">Verified</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <div className={transitionStatus === "completed" ? "" : "d-none"} data-for-status="completed">
                  <label className="form-label" htmlFor="workPerformed">
                    What was done
                  </label>
                  <textarea id="workPerformed" name="work_performed" className="form-control mb-2" rows={3} maxLength={4000} />

                  <label className="form-label" htmlFor="diagnosis">
                    Diagnosis
                  </label>
                  <textarea id="diagnosis" name="diagnosis" className="form-control mb-2" rows={2} maxLength={4000} />

                  <label className="form-label" htmlFor="rootCause">
                    Root cause
                  </label>
                  <textarea
                    id="rootCause"
                    name="root_cause"
                    className="form-control mb-2"
                    rows={2}
                    maxLength={2000}
                    placeholder="Why it failed, not just what failed"
                  />
                </div>

                <div className={transitionStatus === "verified" ? "" : "d-none"} data-for-status="verified">
                  <div className="erp-callout mb-2">
                    <i className="fa-solid fa-circle-info me-1" />
                    <span>
                      Verifying closes the job, posts its cost and gives the machine back.
                      Only do it once the machine has actually run again.
                    </span>
                  </div>
                  <label className="form-label" htmlFor="verificationNotes">
                    Verification notes
                  </label>
                  <textarea id="verificationNotes" name="verification_notes" className="form-control mb-2" rows={2} maxLength={2000} />
                </div>

                <label className="form-label" htmlFor="externalCost">
                  Outside workshop invoice
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="externalCost"
                  name="external_cost"
                  className="form-control mb-3"
                  placeholder="0.00"
                />

                <button type="submit" className="btn btn-erp w-100" data-submit-button>
                  <i className="fa-solid fa-arrow-right me-2" />
                  Apply
                </button>
              </form>
            </div>
          </div>

          <div className="erp-card mt-3">
            <div className="erp-card-head">
              <h2>
                <i className="fa-solid fa-receipt me-2" />
                Cost
              </h2>
            </div>
            <div className="erp-card-body">
              <ul className="erp-keyval">
                <li>
                  <span>Parts</span>
                  <strong>0.00</strong>
                </li>
                <li>
                  <span>Labour</span>
                  <strong>0.00</strong>
                </li>
                <li>
                  <span>Outside workshop</span>
                  <strong>0.00</strong>
                </li>
                <li>
                  <span>Total</span>
                  <strong>{totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </li>
              </ul>

              <p className="text-muted small mb-0 mt-2">The cost posts when the job is verified, not before.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EquipmentInspectionDetailClient({
  inspection,
}: {
  inspection: {
    id: number;
    code: string;
    inspectionType: string;
    inspectionDate: string;
    nextInspectionDue: string | null;
    inspectorName: string | null;
    result: string;
    findings: string | null;
    equipment: { id: number; code: string; name: string } | null;
  };
}) {
  const checkpoints = [
    { name: "Tyre tread and pressure, including spare", pass: true, obs: "—", critical: true },
    { name: "Brakes and handbrake", pass: true, obs: "—", critical: true },
    { name: "Steering play", pass: true, obs: "—", critical: true },
    { name: "Lights, indicators, brake lights", pass: true, obs: "—", critical: true },
    { name: "Horn and reversing alarm", pass: inspection.result === "passed" || inspection.result === "pass", obs: inspection.findings ?? "—", critical: false },
    { name: "Mirrors and glass", pass: true, obs: "—", critical: false },
    { name: "Seat belts", pass: true, obs: "—", critical: true },
    { name: "Wipers and washers", pass: true, obs: "—", critical: false },
    { name: "Engine oil and coolant", pass: true, obs: "—", critical: false },
    { name: "Battery and terminals", pass: true, obs: "—", critical: false },
    { name: "Body, tipper hinges and tailgate", pass: true, obs: "—", critical: false },
    { name: "Load securing equipment", pass: true, obs: "—", critical: false },
    { name: "First aid kit and fire extinguisher", pass: true, obs: "—", critical: true },
    { name: "Registration, fitness and insurance in cab", pass: true, obs: "—", critical: true },
  ];

  const isPass = inspection.result === "passed" || inspection.result === "pass";

  return (
    <div className="container ">
      <EquipmentSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-clipboard-check" />
          </div>
          <div>
            <h1>{inspection.code}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/equipment">Equipment</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/equipment/inspections">Inspections</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {inspection.code}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          {inspection.equipment && (
            <Link href={`/equipment/register/${inspection.equipment.id}`} className="btn btn-erp-ghost">
              <i className="fa-solid fa-truck me-2" />
              {inspection.equipment.code}
            </Link>
          )}
          <Link href="/equipment/work-orders" className="btn btn-erp">
            <i className="fa-solid fa-screwdriver-wrench me-2" />
            EWO-2026-0003
          </Link>
        </div>
      </div>

      <div className="erp-statrow">
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-circle-exclamation" />
          </span>
          <span className="erp-stat-body">
            <strong>{isPass ? "Passed" : inspection.result === "conditional" ? "Passed with defects" : "Failed"}</strong>
            <small>{inspection.inspectionDate}</small>
          </span>
        </div>
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-list-check" />
          </span>
          <span className="erp-stat-body">
            <strong>14</strong>
            <small>checks made</small>
          </span>
        </div>
        <div className="erp-stat is-danger">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-circle-xmark" />
          </span>
          <span className="erp-stat-body">
            <strong>{isPass ? 0 : 1}</strong>
            <small>failed</small>
          </span>
        </div>
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-percent" />
          </span>
          <span className="erp-stat-body">
            <strong>{isPass ? "100%" : "92.9%"}</strong>
            <small>pass rate</small>
          </span>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-xl-8">
          <div className="erp-card">
            <div className="erp-card-head">
              <h2>
                <i className="fa-solid fa-list-check me-2" />
                The checklist
              </h2>
            </div>

            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Checkpoint</th>
                      <th>Result</th>
                      <th>Observation</th>
                      <th className="text-center">Critical</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkpoints.map((cp) => (
                      <tr key={cp.name} className="">
                        <td>{cp.name}</td>
                        <td>
                          {cp.pass ? (
                            <span className="erp-pill is-success">
                              <i className="fa-solid fa-check me-1" />
                              Pass
                            </span>
                          ) : (
                            <span className="erp-pill is-danger">
                              <i className="fa-solid fa-xmark me-1" />
                              Fail
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="erp-identity-meta">{cp.obs}</span>
                        </td>
                        <td className="text-center">
                          {cp.critical && (
                            <i className="fa-solid fa-shield-halved text-danger" title="Failing this grounds the machine" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="erp-card-body">
              <h6 className="text-muted">Findings</h6>
              <p className="mb-0">{inspection.findings ?? "Reversing alarm audible."}</p>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="erp-card">
            <div className="erp-card-head">
              <h2>
                <i className="fa-solid fa-circle-info me-2" />
                Details
              </h2>
            </div>
            <div className="erp-card-body">
              <ul className="erp-keyval">
                <li>
                  <span>Machine</span>
                  <strong>
                    {inspection.equipment
                      ? `${inspection.equipment.code} — ${inspection.equipment.name}`
                      : "EQP-0008 — Tata LPK 2518 Tipper (DHAKA-METRO-TA-11-2244)"}
                  </strong>
                </li>
                <li>
                  <span>Kind</span>
                  <strong className="text-capitalize">{inspection.inspectionType || "Routine"}</strong>
                </li>
                <li>
                  <span>Date</span>
                  <strong>{inspection.inspectionDate}</strong>
                </li>
                <li>
                  <span>Inspector</span>
                  <strong>{inspection.inspectorName || "Unrecorded"}</strong>
                </li>
                <li>
                  <span>Project</span>
                  <strong>yard</strong>
                </li>
                <li>
                  <span>Odometer</span>
                  <strong>61,400 km</strong>
                </li>
                <li>
                  <span>Next due</span>
                  <strong>{inspection.nextInspectionDue || "26 Nov 2026"}</strong>
                </li>
              </ul>
            </div>
          </div>

          <div className="erp-card mt-3">
            <div className="erp-card-head">
              <h2>
                <i className="fa-solid fa-screwdriver-wrench me-2" />
                What followed
              </h2>
            </div>
            <div className="erp-card-body">
              <ul className="erp-keyval">
                <li>
                  <span>Rectification</span>
                  <strong>
                    <Link href="/equipment/work-orders" className="erp-plain-link">
                      EWO-2026-0003
                    </Link>
                  </strong>
                </li>
                <li>
                  <span>Status</span>
                  <strong>
                    <span className="erp-pill is-danger">Reported</span>
                  </strong>
                </li>
                <li>
                  <span>Cost so far</span>
                  <strong>0.00</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
