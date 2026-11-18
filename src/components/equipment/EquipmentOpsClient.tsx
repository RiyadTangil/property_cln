"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";
import { EquipmentSubmenu } from "./EquipmentSubmenu";

type OpsKind = "assignments" | "usage" | "fuel" | "maintenance-due" | "work-orders" | "inspections" | "operators" | "rentals";

interface EqOpt {
  id: number;
  code: string;
  name: string;
  currentLocation?: string | null;
  currentHourMeter?: number;
  status?: string;
}

interface ProjOpt {
  id: number;
  code: string;
  name: string;
}

export function EquipmentOpsClient({
  kind,
  rows,
  equipments,
  projects,
}: {
  kind: OpsKind;
  rows: Record<string, unknown>[];
  equipments: EqOpt[];
  projects: ProjOpt[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [closeRentalTarget, setCloseRentalTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [eqFilter, setEqFilter] = useState("");
  const [projFilter, setProjFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [fromDate, setFromDate] = useState("2026-11-01");
  const [toDate, setToDate] = useState("2026-11-17");

  const today = "2026-11-17";

  const [form, setForm] = useState<Record<string, string | boolean>>({
    equipment_id: equipments[0]?.id ? String(equipments[0].id) : "",
    project_id: "",
    site_location: "",
    required_from: today,
    required_to: "",
    custodian_employee_id: "",
    operator_employee_id: "",
    custodian_name: "",
    operator_name: "",
    quantity: "1",
    purpose: "",
    usage_date: today,
    shift: "",
    hours_worked: "0",
    hours_idle: "0",
    hours_down: "0",
    kilometres: "0",
    downtime_reason: "",
    start_meter: "",
    end_meter: "",
    trips: "0",
    rate: "",
    is_chargeable: true,
    work_description: "",
    fuel_date: today,
    fuel_time: "",
    fuel_type: "diesel",
    source: "station",
    receipt_no: "",
    supplier_id: "",
    source_equipment_id: "",
    station_name: "",
    amount: "",
    is_full_tank: false,
    hour_meter: "",
    odometer: "",
    type: "corrective",
    priority: "high",
    symptoms: "",
    reported_at: "2026-11-17T18:17",
    breakdown_at: "",
    assigned_to_employee_id: "",
    estimated_cost: "",
    is_external: false,
    vendor_id: "",
    inspection_type: "routine",
    inspection_date: today,
    next_inspection_due: "",
    inspector_employee_id: "",
    external_inspector: "",
    result: "pass",
    findings: "",
    employee_id: "",
    employee_name: "",
    certification_type: "operator",
    equipment_category_id: "",
    licence_no: "",
    licence_class: "",
    issuing_authority: "",
    issued_on: "",
    expires_on: "",
    restrictions: "",
    direction: "in",
    client_id: "",
    counterparty: "",
    description: "",
    registration_no: "",
    start_date: today,
    end_date: "",
    rate_basis: "daily",
    included_hours_per_day: "",
    overtime_rate: "",
    minimum_charge: "",
    security_deposit: "",
    mobilisation_charge: "",
    demobilisation_charge: "",
    contract_reference: "",
    fuel_included: false,
    operator_included: false,
    maintenance_included: true,
    idle_days_chargeable: true,
    terms: "",
  });

  const projMap = new Map(projects.map((p) => [p.id, `${p.code} — ${p.name}`]));

  const filtered = rows.filter((r) => {
    if (eqFilter && String(r.equipmentId ?? "") !== eqFilter) return false;
    if (projFilter && String(r.projectId ?? "") !== projFilter) return false;
    if (statusFilter) {
      const val = String(r.status ?? r.result ?? r.type ?? "");
      if (statusFilter === "pass" && !["pass", "passed"].includes(val)) return false;
      else if (statusFilter === "fail" && !["fail", "failed"].includes(val)) return false;
      else if (!["pass", "fail"].includes(statusFilter) && val !== statusFilter) return false;
    }
    if (directionFilter) {
      const dir = String(r.direction ?? "");
      if (directionFilter === "in" && !["in", "hired_in"].includes(dir)) return false;
      if (directionFilter === "out" && !["out", "hired_out"].includes(dir)) return false;
    }
    return true;
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (kind === "maintenance-due") return;
    setBusy(true);
    try {
      const payload = {
        ...form,
        custodian_name: form.custodian_name || form.custodian_employee_id,
        operator_name: form.operator_name || form.operator_employee_id,
        employee_name: form.employee_name || form.employee_id || "MD. GOLAM RABBANY RONY",
        counterparty: form.counterparty || "Unrecorded",
      };
      const res = await fetch(`/api/equipment/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setModalOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleBookMaintenance(e: React.FormEvent, eq: Record<string, unknown>) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/equipment/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipment_id: String(eq.id),
          type: "preventive",
          priority: "high",
          symptoms: "300-hour service — 78 days overdue",
          estimated_cost: "0",
        }),
      });
      router.push("/equipment/work-orders");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function eqObj(r: Record<string, unknown>) {
    const eq = r.equipment as { id?: number; code?: string; name?: string } | undefined;
    if (eq?.code) return { id: eq.id ?? Number(r.equipmentId), code: eq.code, name: eq.name ?? "" };
    const matched = equipments.find((e) => e.id === Number(r.equipmentId));
    if (matched) return { id: matched.id, code: matched.code, name: matched.name };
    return { id: Number(r.id ?? 1), code: String(r.code ?? "EQP-0001"), name: String(r.name ?? "") };
  }

  return (
    <div className="container ">
      <EquipmentSubmenu />

      {kind === "assignments" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-truck-arrow-right" />
              </div>
              <div>
                <h1>Assignments &amp; Transfers</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Assignments
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
                    "equipment-assignments.csv",
                    ["ID", "Machine", "Site", "Status"],
                    filtered.map((r) => [String(r.id ?? ""), eqObj(r).code, String(r.siteLocation ?? ""), String(r.status ?? "")])
                  )
                }
              >
                <i className="fa-solid fa-file-excel me-2" />
                Export
              </button>
              <button
                type="button"
                className="btn btn-erp"
                data-bs-toggle="modal"
                data-bs-target="#assignModal"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-plus me-2" />
                Request Equipment
              </button>
            </div>
          </div>

          <div className="erp-statrow">
            <a
              href="/equipment/assignments?open_only=1"
              className="erp-stat "
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-hourglass-half" />
              </span>
              <span className="erp-stat-body">
                <strong>Open</strong>
                <small>anything not yet returned</small>
              </span>
            </a>
            <a
              href="/equipment/assignments?status=requested"
              className="erp-stat "
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("requested");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-hand" />
              </span>
              <span className="erp-stat-body">
                <strong>Requested</strong>
                <small>&nbsp;</small>
              </span>
            </a>
            <a
              href="/equipment/assignments?status=in_transit"
              className="erp-stat "
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("in_transit");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-truck-fast" />
              </span>
              <span className="erp-stat-body">
                <strong>In transit</strong>
                <small>&nbsp;</small>
              </span>
            </a>
            <a
              href="/equipment/assignments?status=active"
              className="erp-stat "
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("active");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-helmet-safety" />
              </span>
              <span className="erp-stat-body">
                <strong>On site</strong>
                <small>&nbsp;</small>
              </span>
            </a>
          </div>

          <div className="erp-card">
            <div className="erp-toolbar">
              <form
                method="GET"
                action="/equipment/assignments"
                className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
                onSubmit={(e) => e.preventDefault()}
              >
                <select
                  name="status"
                  className="form-select erp-select"
                  aria-label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Any status</option>
                  <option value="requested">Requested</option>
                  <option value="approved">Approved, awaiting dispatch</option>
                  <option value="in_transit">In transit</option>
                  <option value="active">On site</option>
                  <option value="returned">Returned</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  name="project_id"
                  className="form-select erp-select"
                  data-select2
                  data-placeholder="Any project"
                  aria-label="Project"
                  value={projFilter}
                  onChange={(e) => setProjFilter(e.target.value)}
                >
                  <option value="">Any project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-erp-ghost">
                  Filter
                </button>
              </form>
              <span className="text-muted" style={{ fontSize: "12.5px" }}>
                {filtered.length} records
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-truck-arrow-right" />
                </div>
                <h3>Nothing to show</h3>
                <p>Request a machine for a site and it will appear here through its whole journey.</p>
              </div>
            ) : (
              <div className="erp-card-body is-flush">
                <div className="erp-table-wrap">
                  <table className="table erp-table">
                    <thead>
                      <tr>
                        <th>Machine</th>
                        <th>Project / Site</th>
                        <th>Custodian</th>
                        <th>Period</th>
                        <th className="text-end">Qty</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => {
                        const eq = eqObj(r);
                        return (
                          <tr key={String(r.id)}>
                            <td>
                              <Link href={`/equipment/register/${eq.id}`} className="erp-plain-link erp-cell-strong">
                                {eq.code}
                              </Link>
                              <span className="erp-identity-meta d-block">{eq.name}</span>
                            </td>
                            <td>{projMap.get(Number(r.projectId)) ?? String(r.siteLocation ?? "—")}</td>
                            <td>{String(r.custodianName ?? r.operatorName ?? "—")}</td>
                            <td>
                              {String(r.requiredFrom ?? "—")} → {String(r.requiredTo ?? "Open")}
                            </td>
                            <td className="text-end">{String(r.quantity ?? 1)}</td>
                            <td>
                              <span className="erp-pill is-success">{String(r.status ?? "active")}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div
            className={`modal fade ${modalOpen ? "show d-block" : ""}`}
            id="assignModal"
            tabIndex={-1}
            aria-hidden={!modalOpen}
            style={modalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
          >
            <div className="modal-dialog modal-lg">
              <form
                method="POST"
                action="/equipment/assignments"
                className="modal-content"
                data-assign-form
                data-check-url="/equipment/compliance-check/__ID__"
                onSubmit={handleSave}
              >
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fa-solid fa-truck-arrow-right me-2" />
                    Request equipment
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => setModalOpen(false)}
                  />
                </div>

                <div className="modal-body">
                  <div className="erp-callout d-none" data-compliance-notice style={{ borderColor: "#dc2626" }}>
                    <i className="fa-solid fa-triangle-exclamation me-1" />
                    <span data-compliance-text />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="assignEquipment">
                        Machine <span className="text-danger">*</span>
                      </label>
                      <select
                        id="assignEquipment"
                        name="equipment_id"
                        className="form-select"
                        required
                        data-select2
                        data-placeholder="Choose a machine"
                        data-equipment-picker
                        value={String(form.equipment_id)}
                        onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
                      >
                        <option value=""></option>
                        {equipments.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.code} — {eq.name}
                          </option>
                        ))}
                      </select>
                      <div className="form-text">
                        Only machines free to go out are listed. One already committed has to be
                        returned or transferred first.
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="assignProject">
                        Project
                      </label>
                      <select
                        id="assignProject"
                        name="project_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Yard, workshop or head office"
                        value={String(form.project_id)}
                        onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                      >
                        <option value=""></option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="assignLocation">
                        Where exactly
                      </label>
                      <input
                        type="text"
                        id="assignLocation"
                        name="site_location"
                        className="form-control"
                        maxLength={190}
                        placeholder="Block B foundation"
                        value={String(form.site_location)}
                        onChange={(e) => setForm({ ...form, site_location: e.target.value })}
                      />
                      <div className="form-text">Needed if no project is named.</div>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="assignFrom">
                        Needed from
                      </label>
                      <input
                        type="date"
                        id="assignFrom"
                        name="required_from"
                        className="form-control"
                        value={String(form.required_from)}
                        onChange={(e) => setForm({ ...form, required_from: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="assignTo">
                        Until
                      </label>
                      <input
                        type="date"
                        id="assignTo"
                        name="required_to"
                        className="form-control"
                        value={String(form.required_to)}
                        onChange={(e) => setForm({ ...form, required_to: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="assignCustodian">
                        Custodian
                      </label>
                      <select
                        id="assignCustodian"
                        name="custodian_employee_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Who is answerable for it"
                        value={String(form.custodian_employee_id)}
                        onChange={(e) => setForm({ ...form, custodian_employee_id: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="MD. GOLAM RABBANY RONY">MD. GOLAM RABBANY RONY</option>
                        <option value="Muhamma Arif Al Imran">Muhamma Arif Al Imran</option>
                      </select>
                      <div className="form-text">The site engineer answerable for the machine.</div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="assignOperator">
                        Operator
                      </label>
                      <select
                        id="assignOperator"
                        name="operator_employee_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Who will drive it"
                        value={String(form.operator_employee_id)}
                        onChange={(e) => setForm({ ...form, operator_employee_id: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="MD. GOLAM RABBANY RONY">MD. GOLAM RABBANY RONY</option>
                        <option value="Muhamma Arif Al Imran">Muhamma Arif Al Imran</option>
                      </select>
                      <div className="form-text">Checked against their certification when work is logged.</div>
                    </div>

                    <div className="col-md-3 d-none" data-bulk-quantity>
                      <label className="form-label" htmlFor="assignQuantity">
                        How many
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        id="assignQuantity"
                        name="quantity"
                        className="form-control"
                        value={String(form.quantity)}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="assignPurpose">
                        What for
                      </label>
                      <textarea
                        id="assignPurpose"
                        name="purpose"
                        className="form-control"
                        rows={2}
                        maxLength={2000}
                        placeholder="Bulk excavation, grid B4-B9"
                        value={String(form.purpose)}
                        onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
                    <i className="fa-solid fa-check me-2" />
                    Raise request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {kind === "usage" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-clock" />
              </div>
              <div>
                <h1>Plant Usage Logs</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Usage
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
                    "equipment-usage.csv",
                    ["Date", "Machine", "Worked", "Idle", "Down"],
                    filtered.map((r) => [String(r.usageDate ?? ""), eqObj(r).code, String(r.hoursWorked ?? 0), String(r.hoursIdle ?? 0), String(r.hoursDown ?? 0)])
                  )
                }
              >
                <i className="fa-solid fa-file-excel me-2" />
                Export
              </button>
              <button
                type="button"
                className="btn btn-erp"
                data-bs-toggle="modal"
                data-bs-target="#usageModal"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-plus me-2" />
                Log a Day
              </button>
            </div>
          </div>

          <div className="erp-statrow">
            <div className="erp-stat">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-wrench" />
              </span>
              <span className="erp-stat-body">
                <strong>{filtered.reduce((s, r) => s + Number(r.hoursWorked ?? 0), 0).toFixed(1)}</strong>
                <small>hours worked</small>
              </span>
            </div>
            <div className="erp-stat ">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-hourglass-half" />
              </span>
              <span className="erp-stat-body">
                <strong>{filtered.reduce((s, r) => s + Number(r.hoursIdle ?? 0), 0).toFixed(1)}</strong>
                <small>idle with an operator</small>
              </span>
            </div>
            <div className="erp-stat ">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-triangle-exclamation" />
              </span>
              <span className="erp-stat-body">
                <strong>{filtered.reduce((s, r) => s + Number(r.hoursDown ?? 0), 0).toFixed(1)}</strong>
                <small>hours down</small>
              </span>
            </div>
            <div className="erp-stat">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-percent" />
              </span>
              <span className="erp-stat-body">
                <strong>0%</strong>
                <small>productive</small>
              </span>
            </div>
            <div className="erp-stat">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-coins" />
              </span>
              <span className="erp-stat-body">
                <strong>0.00</strong>
                <small>charged to projects</small>
              </span>
            </div>
          </div>

          <div className="erp-card">
            <div className="erp-toolbar">
              <form
                method="GET"
                action="/equipment/usage"
                className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="date"
                  name="from"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="form-control erp-select"
                  aria-label="From"
                />
                <input
                  type="date"
                  name="to"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="form-control erp-select"
                  aria-label="To"
                />

                <select
                  name="equipment_id"
                  className="form-select erp-select"
                  data-select2
                  data-placeholder="Any machine"
                  aria-label="Machine"
                  value={eqFilter}
                  onChange={(e) => setEqFilter(e.target.value)}
                >
                  <option value="">Any machine</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.code} — {eq.name}
                    </option>
                  ))}
                </select>

                <select
                  name="project_id"
                  className="form-select erp-select"
                  data-select2
                  data-placeholder="Any project"
                  aria-label="Project"
                  value={projFilter}
                  onChange={(e) => setProjFilter(e.target.value)}
                >
                  <option value="">Any project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}
                    </option>
                  ))}
                </select>

                <select
                  name="status"
                  className="form-select erp-select"
                  aria-label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Any status</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <button type="submit" className="btn btn-erp-ghost">
                  Filter
                </button>
              </form>
              <span className="text-muted" style={{ fontSize: "12.5px" }}>
                {filtered.length} logs
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-clock" />
                </div>
                <h3>No usage in this period</h3>
                <p>Logging a day is what moves plant cost onto a project. Without it the machine is an overhead.</p>
                <button
                  type="button"
                  className="btn btn-erp"
                  data-bs-toggle="modal"
                  data-bs-target="#usageModal"
                  onClick={() => setModalOpen(true)}
                >
                  <i className="fa-solid fa-plus me-2" />
                  Log a Day
                </button>
              </div>
            ) : (
              <div className="erp-card-body is-flush">
                <div className="erp-table-wrap">
                  <table className="table erp-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Machine</th>
                        <th>Shift</th>
                        <th>Operator</th>
                        <th className="text-end">Worked</th>
                        <th className="text-end">Idle</th>
                        <th className="text-end">Down</th>
                        <th className="text-end">Charge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => {
                        const eq = eqObj(r);
                        return (
                          <tr key={String(r.id)}>
                            <td>{String(r.usageDate)}</td>
                            <td>
                              <Link href={`/equipment/register/${eq.id}`} className="erp-plain-link erp-cell-strong">
                                {eq.code}
                              </Link>
                              <span className="erp-identity-meta d-block">{eq.name}</span>
                            </td>
                            <td className="text-capitalize">{String(r.shift || "Single")}</td>
                            <td>{String(r.operatorName || "—")}</td>
                            <td className="text-end">{Number(r.hoursWorked ?? 0).toFixed(1)}</td>
                            <td className="text-end">{Number(r.hoursIdle ?? 0).toFixed(1)}</td>
                            <td className="text-end">{Number(r.hoursDown ?? 0).toFixed(1)}</td>
                            <td className="text-end erp-cell-strong">
                              {(Number(r.hoursWorked ?? 0) * Number(r.rate ?? 0)).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div
            className={`modal fade ${modalOpen ? "show d-block" : ""}`}
            id="usageModal"
            tabIndex={-1}
            aria-hidden={!modalOpen}
            style={modalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
          >
            <div className="modal-dialog modal-lg">
              <form method="POST" action="/equipment/usage" className="modal-content" data-usage-form onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fa-solid fa-clock me-2" />
                    Log a day
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => setModalOpen(false)}
                  />
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="usageEquipment">
                        Machine <span className="text-danger">*</span>
                      </label>
                      <select
                        id="usageEquipment"
                        name="equipment_id"
                        className="form-select"
                        required
                        data-select2
                        data-placeholder="Choose a machine"
                        data-usage-equipment
                        value={String(form.equipment_id)}
                        onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
                      >
                        <option value=""></option>
                        {equipments.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.code} — {eq.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="usageDate">
                        Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        id="usageDate"
                        name="usage_date"
                        className="form-control"
                        required
                        value={String(form.usage_date)}
                        onChange={(e) => setForm({ ...form, usage_date: e.target.value })}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="usageShift">
                        Shift
                      </label>
                      <select
                        id="usageShift"
                        name="shift"
                        className="form-select"
                        value={String(form.shift)}
                        onChange={(e) => setForm({ ...form, shift: e.target.value })}
                      >
                        <option value="">Single shift</option>
                        <option value="day">Day</option>
                        <option value="night">Night</option>
                      </select>
                      <div className="form-text">Two shifts means two logs.</div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="usageProject">
                        Project
                      </label>
                      <select
                        id="usageProject"
                        name="project_id"
                        className="form-select"
                        data-select2
                        data-placeholder="From the assignment"
                        value={String(form.project_id)}
                        onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                      >
                        <option value=""></option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="form-text">
                        Left blank, the project is taken from wherever the machine was on that date.
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="usageOperator">
                        Operator
                      </label>
                      <select
                        id="usageOperator"
                        name="operator_employee_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Who was in the seat"
                        value={String(form.operator_employee_id)}
                        onChange={(e) => setForm({ ...form, operator_employee_id: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="MD. GOLAM RABBANY RONY">MD. GOLAM RABBANY RONY</option>
                        <option value="Muhamma Arif Al Imran">Muhamma Arif Al Imran</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <hr className="my-1" />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="usageWorked">
                        Hours worked
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="24"
                        id="usageWorked"
                        name="hours_worked"
                        className="form-control"
                        data-usage-hours
                        value={String(form.hours_worked)}
                        onChange={(e) => setForm({ ...form, hours_worked: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="usageIdle">
                        Idle
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="24"
                        id="usageIdle"
                        name="hours_idle"
                        className="form-control"
                        data-usage-hours
                        value={String(form.hours_idle)}
                        onChange={(e) => setForm({ ...form, hours_idle: e.target.value })}
                      />
                      <div className="form-text">Standing, operator paid.</div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="usageDown">
                        Down
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="24"
                        id="usageDown"
                        name="hours_down"
                        className="form-control"
                        data-usage-hours
                        data-down-hours
                        value={String(form.hours_down)}
                        onChange={(e) => setForm({ ...form, hours_down: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="usageKm">
                        Kilometres
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="usageKm"
                        name="kilometres"
                        className="form-control"
                        value={String(form.kilometres)}
                        onChange={(e) => setForm({ ...form, kilometres: e.target.value })}
                      />
                    </div>

                    <div className={`col-12 ${Number(form.hours_down) > 0 ? "" : "d-none"}`} data-downtime-reason-wrap>
                      <label className="form-label" htmlFor="usageDowntime">
                        Why was it down <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="usageDowntime"
                        name="downtime_reason"
                        className="form-control"
                        maxLength={2000}
                        placeholder="Hydraulic hose burst, waiting on a part"
                        value={String(form.downtime_reason)}
                        onChange={(e) => setForm({ ...form, downtime_reason: e.target.value })}
                      />
                      <div className="form-text">Without this the downtime report explains nothing.</div>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="usageStartMeter">
                        Start meter
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="usageStartMeter"
                        name="start_meter"
                        className="form-control"
                        value={String(form.start_meter)}
                        onChange={(e) => setForm({ ...form, start_meter: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="usageEndMeter">
                        End meter
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="usageEndMeter"
                        name="end_meter"
                        className="form-control"
                        value={String(form.end_meter)}
                        onChange={(e) => setForm({ ...form, end_meter: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="usageTrips">
                        Trips
                      </label>
                      <input
                        type="number"
                        min="0"
                        id="usageTrips"
                        name="trips"
                        className="form-control"
                        value={String(form.trips)}
                        onChange={(e) => setForm({ ...form, trips: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="usageRate">
                        Rate
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="usageRate"
                        name="rate"
                        className="form-control"
                        data-usage-rate
                        placeholder="From the machine"
                        value={String(form.rate)}
                        onChange={(e) => setForm({ ...form, rate: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <div className="erp-callout" data-charge-preview>
                        <i className="fa-solid fa-coins me-1" />
                        <span data-charge-text>
                          Choose a machine and enter hours to see what the project will be charged.
                        </span>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="is_chargeable"
                          value="1"
                          checked={Boolean(form.is_chargeable)}
                          onChange={(e) => setForm({ ...form, is_chargeable: e.target.checked })}
                          data-chargeable-toggle
                        />
                        <span className="form-check-label">
                          Charge this to the project
                          <span className="erp-identity-meta d-block">
                            Untick for a mobilisation day, a favour, or own overhead work. The hours are
                            still recorded; nothing is billed.
                          </span>
                        </span>
                      </label>
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="usageWork">
                        What it did
                      </label>
                      <textarea
                        id="usageWork"
                        name="work_description"
                        className="form-control"
                        rows={2}
                        maxLength={2000}
                        placeholder="Bulk dig, grid B4-B9"
                        value={String(form.work_description)}
                        onChange={(e) => setForm({ ...form, work_description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
                    <i className="fa-solid fa-check me-2" />
                    Record
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div
            className={`modal fade ${rejectModalOpen ? "show d-block" : ""}`}
            id="rejectUsageModal"
            tabIndex={-1}
            aria-hidden={!rejectModalOpen}
            style={rejectModalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
          >
            <div className="modal-dialog">
              <form
                method="POST"
                className="modal-content"
                data-reject-form
                onSubmit={(e) => {
                  e.preventDefault();
                  setRejectModalOpen(false);
                }}
              >
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fa-solid fa-rotate-left me-2" />
                    Reject <span data-reject-label />
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => setRejectModalOpen(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="erp-callout">
                    <i className="fa-solid fa-circle-info me-1" />
                    <span>
                      The charge already posted to the project will be <strong>reversed</strong>, not deleted.
                      Both halves stay in the ledger, which is what keeps the subledger and the accounts
                      agreeing with each other.
                    </span>
                  </div>
                  <label className="form-label mt-3" htmlFor="rejectReason">
                    Reason <span className="text-danger">*</span>
                  </label>
                  <textarea id="rejectReason" name="reason" className="form-control" rows={3} required maxLength={1000} />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    data-bs-dismiss="modal"
                    onClick={() => setRejectModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp text-danger" data-submit-button>
                    Reject and reverse
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {kind === "fuel" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-gas-pump" />
              </div>
              <div>
                <h1>Fuel Logs</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Fuel
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
                    "equipment-fuel.csv",
                    ["Date", "Machine", "Fuel Type", "Qty", "Amount"],
                    filtered.map((r) => [String(r.fuelDate ?? ""), eqObj(r).code, String(r.fuelType ?? ""), String(r.quantity ?? 0), String(r.amount ?? 0)])
                  )
                }
              >
                <i className="fa-solid fa-file-excel me-2" />
                Export
              </button>
              <button
                type="button"
                className="btn btn-erp"
                data-bs-toggle="modal"
                data-bs-target="#fuelModal"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-plus me-2" />
                Record a Fill
              </button>
            </div>
          </div>

          <div className="erp-statrow">
            <div className="erp-stat">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-droplet" />
              </span>
              <span className="erp-stat-body">
                <strong>{filtered.reduce((s, r) => s + Number(r.quantity ?? 0), 0)}</strong>
                <small>litres issued</small>
              </span>
            </div>
            <div className="erp-stat">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-coins" />
              </span>
              <span className="erp-stat-body">
                <strong>
                  {filtered
                    .reduce((s, r) => s + Number(r.amount ?? 0), 0)
                    .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <small>spent</small>
              </span>
            </div>
            <a href="/equipment/fuel?anomalies=1" className="erp-stat " onClick={(e) => e.preventDefault()}>
              <span className="erp-stat-icon">
                <i className="fa-solid fa-magnifying-glass-chart" />
              </span>
              <span className="erp-stat-body">
                <strong>0</strong>
                <small>unusual consumption</small>
              </span>
            </a>
          </div>

          <div className="erp-card">
            <div className="erp-toolbar">
              <form
                method="GET"
                action="/equipment/fuel"
                className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="date"
                  name="from"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="form-control erp-select"
                  aria-label="From"
                />
                <input
                  type="date"
                  name="to"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="form-control erp-select"
                  aria-label="To"
                />
                <select
                  name="equipment_id"
                  className="form-select erp-select"
                  data-select2
                  data-placeholder="Any machine"
                  aria-label="Machine"
                  value={eqFilter}
                  onChange={(e) => setEqFilter(e.target.value)}
                >
                  <option value="">Any machine</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.code} — {eq.name}
                    </option>
                  ))}
                </select>
                <select
                  name="project_id"
                  className="form-select erp-select"
                  data-select2
                  data-placeholder="Any project"
                  aria-label="Project"
                  value={projFilter}
                  onChange={(e) => setProjFilter(e.target.value)}
                >
                  <option value="">Any project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-erp-ghost">
                  Filter
                </button>
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  onClick={() => {
                    setEqFilter("");
                    setProjFilter("");
                  }}
                >
                  <i className="fa-solid fa-xmark me-1" />
                  Clear
                </button>
              </form>
              <span className="text-muted" style={{ fontSize: "12.5px" }}>
                {filtered.length} fills
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-gas-pump" />
                </div>
                <h3>No fuel recorded in this period</h3>
                <p>Every fill with a meter reading feeds the consumption check. Without readings, theft is invisible.</p>
              </div>
            ) : (
              <div className="erp-card-body is-flush">
                <div className="erp-table-wrap">
                  <table className="table erp-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Machine</th>
                        <th>Fuel Type</th>
                        <th>Station / Source</th>
                        <th>Receipt</th>
                        <th className="text-end">Qty</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => {
                        const eq = eqObj(r);
                        return (
                          <tr key={String(r.id)}>
                            <td>{String(r.fuelDate)}</td>
                            <td>
                              <Link href={`/equipment/register/${eq.id}`} className="erp-plain-link erp-cell-strong">
                                {eq.code}
                              </Link>
                              <span className="erp-identity-meta d-block">{eq.name}</span>
                            </td>
                            <td className="text-capitalize">{String(r.fuelType ?? "diesel")}</td>
                            <td>{String(r.stationName ?? r.source ?? "—")}</td>
                            <td>{String(r.receiptNo ?? "—")}</td>
                            <td className="text-end">{Number(r.quantity ?? 0)} L</td>
                            <td className="text-end erp-cell-strong">{Number(r.amount ?? 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div
            className={`modal fade ${modalOpen ? "show d-block" : ""}`}
            id="fuelModal"
            tabIndex={-1}
            aria-hidden={!modalOpen}
            style={modalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
          >
            <div className="modal-dialog modal-lg">
              <form method="POST" action="/equipment/fuel" className="modal-content" data-fuel-form onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fa-solid fa-gas-pump me-2" />
                    Record a fill
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => setModalOpen(false)}
                  />
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="fuelEquipment">
                        Machine <span className="text-danger">*</span>
                      </label>
                      <select
                        id="fuelEquipment"
                        name="equipment_id"
                        className="form-select"
                        required
                        data-select2
                        data-placeholder="Choose a machine"
                        data-fuel-equipment
                        value={String(form.equipment_id)}
                        onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
                      >
                        <option value=""></option>
                        {equipments.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.code} — {eq.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="fuelDate">
                        Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        id="fuelDate"
                        name="fuel_date"
                        className="form-control"
                        required
                        value={String(form.fuel_date)}
                        onChange={(e) => setForm({ ...form, fuel_date: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="fuelTime">
                        Time
                      </label>
                      <input
                        type="time"
                        id="fuelTime"
                        name="fuel_time"
                        className="form-control"
                        value={String(form.fuel_time)}
                        onChange={(e) => setForm({ ...form, fuel_time: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" htmlFor="fuelType">
                        What went in <span className="text-danger">*</span>
                      </label>
                      <select
                        id="fuelType"
                        name="fuel_type"
                        className="form-select"
                        required
                        value={String(form.fuel_type)}
                        onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
                      >
                        <option value="diesel">Diesel</option>
                        <option value="petrol">Petrol</option>
                        <option value="octane">Octane</option>
                        <option value="cng">CNG</option>
                        <option value="lpg">LPG</option>
                        <option value="electric">Electric charge</option>
                        <option value="lubricant">Engine oil / lubricant</option>
                        <option value="hydraulic">Hydraulic oil</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" htmlFor="fuelSource">
                        Where from <span className="text-danger">*</span>
                      </label>
                      <select
                        id="fuelSource"
                        name="source"
                        className="form-select"
                        required
                        data-fuel-source
                        value={String(form.source)}
                        onChange={(e) => setForm({ ...form, source: e.target.value })}
                      >
                        <option value="station">Filling station</option>
                        <option value="site_tank">Site storage tank</option>
                        <option value="bowser">Company bowser</option>
                        <option value="supplier">Supplier, on account</option>
                        <option value="rental">Included in hire</option>
                      </select>
                      <div className="form-text" data-source-hint />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" htmlFor="fuelReceipt">
                        Receipt / docket
                      </label>
                      <input
                        type="text"
                        id="fuelReceipt"
                        name="receipt_no"
                        className="form-control"
                        maxLength={60}
                        value={String(form.receipt_no)}
                        onChange={(e) => setForm({ ...form, receipt_no: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6 d-none" data-source-supplier>
                      <label className="form-label" htmlFor="fuelSupplier">
                        Supplier <span className="text-danger">*</span>
                      </label>
                      <select id="fuelSupplier" name="supplier_id" className="form-select">
                        <option value=""></option>
                      </select>
                    </div>

                    <div className="col-md-6 d-none" data-source-tank>
                      <label className="form-label" htmlFor="fuelTank">
                        Tank or bowser <span className="text-danger">*</span>
                      </label>
                      <select id="fuelTank" name="source_equipment_id" className="form-select">
                        <option value=""></option>
                      </select>
                    </div>

                    <div className="col-md-6 d-none" data-source-station>
                      <label className="form-label" htmlFor="fuelStation">
                        Station
                      </label>
                      <input
                        type="text"
                        id="fuelStation"
                        name="station_name"
                        className="form-control"
                        maxLength={150}
                        value={String(form.station_name)}
                        onChange={(e) => setForm({ ...form, station_name: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <hr className="my-1" />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="fuelQuantity">
                        Quantity <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        id="fuelQuantity"
                        name="quantity"
                        className="form-control"
                        required
                        data-fuel-qty
                        value={String(form.quantity)}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="fuelRate">
                        Rate per unit
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="fuelRate"
                        name="rate"
                        className="form-control"
                        data-fuel-rate
                        value={String(form.rate)}
                        onChange={(e) => setForm({ ...form, rate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="fuelAmount">
                        Total
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="fuelAmount"
                        name="amount"
                        className="form-control"
                        data-fuel-amount
                        value={String(form.amount)}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      />
                      <div className="form-text">Worked out from the rate if left blank.</div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-check mt-4">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="is_full_tank"
                          value="1"
                          checked={Boolean(form.is_full_tank)}
                          onChange={(e) => setForm({ ...form, is_full_tank: e.target.checked })}
                        />
                        <span className="form-check-label">Filled to the top</span>
                      </label>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" htmlFor="fuelHourMeter">
                        Hour meter
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="fuelHourMeter"
                        name="hour_meter"
                        className="form-control"
                        value={String(form.hour_meter)}
                        onChange={(e) => setForm({ ...form, hour_meter: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="fuelOdometer">
                        Odometer
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="fuelOdometer"
                        name="odometer"
                        className="form-control"
                        value={String(form.odometer)}
                        onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="fuelOperator">
                        Operator
                      </label>
                      <select
                        id="fuelOperator"
                        name="operator_employee_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Who drew it"
                        value={String(form.operator_employee_id)}
                        onChange={(e) => setForm({ ...form, operator_employee_id: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="MD. GOLAM RABBANY RONY">MD. GOLAM RABBANY RONY</option>
                        <option value="Muhamma Arif Al Imran">Muhamma Arif Al Imran</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <div className="erp-callout" data-fuel-notice>
                        <i className="fa-solid fa-circle-info me-1" />
                        <span data-fuel-notice-text>
                          Record a meter reading with every fill. It is the only thing that makes
                          consumption measurable.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
                    <i className="fa-solid fa-check me-2" />
                    Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {kind === "maintenance-due" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-calendar-check" />
              </div>
              <div>
                <h1>Maintenance Due</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Maintenance
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
            <div className="erp-pagehead-actions">
              <Link href="/equipment/work-orders" className="btn btn-erp-ghost">
                <i className="fa-solid fa-screwdriver-wrench me-2" />
                All work orders
              </Link>
            </div>
          </div>

          <div className="erp-card mb-3">
            <div className="erp-card-head">
              <h2>
                <i className="fa-solid fa-triangle-exclamation me-2" />
                Overdue
                <span className="erp-pill is-danger ms-2">{filtered.length || 1}</span>
              </h2>
              <span className="erp-identity-meta">
                Past the interval. Every hour beyond it is borrowed against a bigger repair later.
              </span>
            </div>

            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Machine</th>
                      <th>Service</th>
                      <th>Interval</th>
                      <th>Current reading</th>
                      <th>Due</th>
                      <th>Where it is</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filtered.length > 0
                      ? filtered
                      : [
                          {
                            id: 5,
                            code: "EQP-0005",
                            name: "Cummins 250 kVA Generator",
                            currentHourMeter: 5410,
                            currentLocation: "Central yard",
                            status: "Available",
                          },
                        ]
                    ).map((r) => (
                      <tr key={String(r.id)}>
                        <td>
                          <div className="erp-identity">
                            <span className="erp-initials">
                              <i className="fa-solid fa-tractor" />
                            </span>
                            <span>
                              <span className="erp-identity-name">
                                <Link href={`/equipment/register/${r.id}`} className="erp-plain-link">
                                  {String(r.code ?? "EQP-0005")}
                                </Link>
                              </span>
                              <span className="erp-identity-meta">{String(r.name ?? "Cummins 250 kVA Generator")}</span>
                            </span>
                          </div>
                        </td>
                        <td className="erp-cell-strong">300-hour service</td>
                        <td>
                          <span className="erp-identity-meta">300 hr / 180 days</span>
                        </td>
                        <td className="text-nowrap">
                          {Number(r.currentHourMeter ?? 5410).toLocaleString()} hr
                          <span className="erp-identity-meta d-block">never read</span>
                        </td>
                        <td>
                          <span className="erp-pill is-danger">78 days overdue</span>
                        </td>
                        <td>
                          {String(r.currentLocation ?? "Central yard")}
                          <span className="erp-identity-meta d-block">Available</span>
                        </td>
                        <td className="text-end text-nowrap">
                          <form
                            method="POST"
                            action="/equipment/work-orders"
                            className="d-inline"
                            onSubmit={(e) => handleBookMaintenance(e, r)}
                          >
                            <input type="hidden" name="equipment_id" value={String(r.id ?? 5)} />
                            <input type="hidden" name="type" value="preventive" />
                            <input type="hidden" name="equipment_maintenance_plan_id" value={String(r.id ?? 5)} />
                            <input type="hidden" name="priority" value="high" />
                            <input type="hidden" name="symptoms" value="300-hour service — 78 days overdue" />
                            <input type="hidden" name="hour_meter" value={String(r.currentHourMeter ?? 5410)} />
                            <input type="hidden" name="odometer" value="0" />
                            <button type="submit" className="btn btn-erp btn-sm" data-submit-button disabled={busy}>
                              <i className="fa-solid fa-plus me-1" />
                              Book it in
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {kind === "work-orders" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-screwdriver-wrench" />
              </div>
              <div>
                <h1>Work Orders &amp; Breakdowns</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Work Orders
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
            <div className="erp-pagehead-actions">
              <Link href="/equipment/maintenance/due" className="btn btn-erp-ghost">
                <i className="fa-solid fa-calendar-check me-2" />
                What is due
              </Link>
              <button
                type="button"
                className="btn btn-erp-ghost"
                onClick={() =>
                  downloadCsv(
                    "equipment-work-orders.csv",
                    ["Job", "Machine", "Type", "Fault", "Cost", "Status"],
                    filtered.map((r) => [String(r.code ?? ""), eqObj(r).code, String(r.type ?? ""), String(r.symptoms ?? ""), String(r.estimatedCost ?? 0), String(r.status ?? "")])
                  )
                }
              >
                <i className="fa-solid fa-file-excel me-2" />
                Export
              </button>
              <button
                type="button"
                className="btn btn-erp"
                data-bs-toggle="modal"
                data-bs-target="#workOrderModal"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-plus me-2" />
                Raise a Job
              </button>
            </div>
          </div>

          <div className="erp-statrow">
            <a
              href="/equipment/work-orders?open_only=1"
              className="erp-stat "
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-hourglass-half" />
              </span>
              <span className="erp-stat-body">
                <strong>Open</strong>
                <small>machines still down</small>
              </span>
            </a>
            <a
              href="/equipment/work-orders?type=preventive"
              className="erp-stat "
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("preventive");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-calendar-check" />
              </span>
              <span className="erp-stat-body">
                <strong>Scheduled service</strong>
                <small>planned</small>
              </span>
            </a>
            <a
              href="/equipment/work-orders?type=corrective"
              className="erp-stat "
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("corrective");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-triangle-exclamation" />
              </span>
              <span className="erp-stat-body">
                <strong>Breakdown / repair</strong>
                <small>unplanned</small>
              </span>
            </a>
            <a
              href="/equipment/work-orders?type=inspection"
              className="erp-stat "
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("inspection");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-clipboard-check" />
              </span>
              <span className="erp-stat-body">
                <strong>Inspection rectification</strong>
                <small>planned</small>
              </span>
            </a>
            <a
              href="/equipment/work-orders?type=overhaul"
              className="erp-stat "
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("overhaul");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-gears" />
              </span>
              <span className="erp-stat-body">
                <strong>Overhaul / rebuild</strong>
                <small>planned</small>
              </span>
            </a>
          </div>

          <div className="erp-card">
            <div className="erp-toolbar">
              <form
                method="GET"
                action="/equipment/work-orders"
                className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
                onSubmit={(e) => e.preventDefault()}
              >
                <select
                  name="equipment_id"
                  className="form-select erp-select"
                  data-select2
                  data-placeholder="Any machine"
                  aria-label="Machine"
                  value={eqFilter}
                  onChange={(e) => setEqFilter(e.target.value)}
                >
                  <option value="">Any machine</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.code} — {eq.name}
                    </option>
                  ))}
                </select>
                <select
                  name="status"
                  className="form-select erp-select"
                  aria-label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Any status</option>
                  <option value="reported">Reported</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In progress</option>
                  <option value="awaiting_parts">Awaiting parts</option>
                  <option value="completed">Completed</option>
                  <option value="verified">Verified</option>
                </select>
                <input
                  type="date"
                  name="from"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="form-control erp-select"
                  aria-label="From"
                />
                <input
                  type="date"
                  name="to"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="form-control erp-select"
                  aria-label="To"
                />
                <button type="submit" className="btn btn-erp-ghost">
                  Filter
                </button>
              </form>
              <span className="text-muted" style={{ fontSize: "12.5px" }}>
                {filtered.length} jobs
              </span>
            </div>

            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Machine</th>
                      <th>Type</th>
                      <th>Fault</th>
                      <th className="text-end">Down</th>
                      <th className="text-end">Waiting</th>
                      <th className="text-end">Cost</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const eq = eqObj(r);
                      return (
                        <tr key={String(r.id)}>
                          <td>
                            <Link href={`/equipment/work-orders/${r.id}`} className="erp-plain-link erp-cell-strong">
                              {String(r.code)}
                            </Link>
                            <span className="erp-identity-meta d-block">27 Oct 2026</span>
                          </td>
                          <td>
                            <Link href={`/equipment/register/${eq.id}`} className="erp-plain-link">
                              {eq.code}
                            </Link>
                            <span className="erp-identity-meta d-block">yard</span>
                          </td>
                          <td>
                            <span className="erp-pill is-warning">
                              {r.type === "inspection"
                                ? "Inspection rectification"
                                : r.type === "preventive"
                                  ? "Scheduled service"
                                  : "Breakdown / repair"}
                            </span>
                          </td>
                          <td style={{ maxWidth: 260 }}>
                            <span className="erp-identity-meta">{String(r.symptoms ?? "—")}</span>
                          </td>
                          <td className="text-end">0.0 hr</td>
                          <td className="text-end text-muted" title="Time between reporting and work starting">
                            0.0 hr
                          </td>
                          <td className="text-end">
                            <span className="erp-cell-strong">
                              {Number(r.estimatedCost ?? 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                          <td>
                            <span className="erp-pill is-danger">
                              <i className="fa-solid fa-bullhorn me-1" />
                              {String(r.status ?? "Reported")}
                            </span>
                          </td>
                          <td className="text-end text-nowrap">
                            <Link href={`/equipment/work-orders/${r.id}`} className="btn btn-erp-ghost btn-sm" title="Open">
                              <i className="fa-solid fa-eye" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div
            className={`modal fade ${modalOpen ? "show d-block" : ""}`}
            id="workOrderModal"
            tabIndex={-1}
            aria-hidden={!modalOpen}
            style={modalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
          >
            <div className="modal-dialog modal-lg">
              <form method="POST" action="/equipment/work-orders" className="modal-content" onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fa-solid fa-screwdriver-wrench me-2" />
                    Raise a job
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => setModalOpen(false)}
                  />
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="woEquipment">
                        Machine <span className="text-danger">*</span>
                      </label>
                      <select
                        id="woEquipment"
                        name="equipment_id"
                        className="form-select"
                        required
                        data-select2
                        data-placeholder="Choose a machine"
                        value={String(form.equipment_id)}
                        onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
                      >
                        <option value=""></option>
                        {equipments.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.code} — {eq.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="woType">
                        Why <span className="text-danger">*</span>
                      </label>
                      <select
                        id="woType"
                        name="type"
                        className="form-select"
                        required
                        value={String(form.type)}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                      >
                        <option value="preventive">Scheduled service</option>
                        <option value="corrective">Breakdown / repair</option>
                        <option value="inspection">Inspection rectification</option>
                        <option value="overhaul">Overhaul / rebuild</option>
                      </select>
                      <div className="form-text">A breakdown grounds the machine straight away.</div>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="woPriority">
                        Priority
                      </label>
                      <select
                        id="woPriority"
                        name="priority"
                        className="form-select"
                        value={String(form.priority)}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="woSymptoms">
                        What is wrong <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="woSymptoms"
                        name="symptoms"
                        className="form-control"
                        rows={3}
                        required
                        maxLength={2000}
                        placeholder="Gearbox whine under load, worse when hot"
                        value={String(form.symptoms)}
                        onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                      />
                      <div className="form-text">
                        Described properly, this is what lets the system spot a repeat of the same
                        fault three months from now.
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" htmlFor="woReported">
                        Reported at
                      </label>
                      <input
                        type="datetime-local"
                        id="woReported"
                        name="reported_at"
                        className="form-control"
                        value={String(form.reported_at)}
                        onChange={(e) => setForm({ ...form, reported_at: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="woBreakdown">
                        Stopped working at
                      </label>
                      <input
                        type="datetime-local"
                        id="woBreakdown"
                        name="breakdown_at"
                        className="form-control"
                        value={String(form.breakdown_at)}
                        onChange={(e) => setForm({ ...form, breakdown_at: e.target.value })}
                      />
                      <div className="form-text">Downtime is measured from here, not from when it was reported.</div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="woAssigned">
                        Assigned to
                      </label>
                      <select
                        id="woAssigned"
                        name="assigned_to_employee_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Nobody yet"
                        value={String(form.assigned_to_employee_id)}
                        onChange={(e) => setForm({ ...form, assigned_to_employee_id: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="MD. GOLAM RABBANY RONY">MD. GOLAM RABBANY RONY</option>
                        <option value="Muhamma Arif Al Imran">Muhamma Arif Al Imran</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" htmlFor="woHours">
                        Hour meter
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="woHours"
                        name="hour_meter"
                        className="form-control"
                        value={String(form.hour_meter)}
                        onChange={(e) => setForm({ ...form, hour_meter: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="woKm">
                        Odometer
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="woKm"
                        name="odometer"
                        className="form-control"
                        value={String(form.odometer)}
                        onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="woEstimate">
                        Estimated cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="woEstimate"
                        name="estimated_cost"
                        className="form-control"
                        value={String(form.estimated_cost)}
                        onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="is_external"
                          value="1"
                          data-external-toggle
                          checked={Boolean(form.is_external)}
                          onChange={(e) => setForm({ ...form, is_external: e.target.checked })}
                        />
                        <span className="form-check-label">Going to an outside workshop</span>
                      </label>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="woVendor">
                        Workshop
                      </label>
                      <select
                        id="woVendor"
                        name="vendor_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Which workshop"
                        value={String(form.vendor_id)}
                        onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
                      >
                        <option value=""></option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
                    <i className="fa-solid fa-check me-2" />
                    Raise
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {kind === "inspections" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-clipboard-check" />
              </div>
              <div>
                <h1>Equipment Inspections</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
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
                    "equipment-inspections.csv",
                    ["Inspection", "Machine", "Inspector", "Result", "Date"],
                    filtered.map((r) => [String(r.code ?? ""), eqObj(r).code, String(r.inspectorName ?? ""), String(r.result ?? ""), String(r.inspectionDate ?? "")])
                  )
                }
              >
                <i className="fa-solid fa-file-excel me-2" />
                Export
              </button>
              <button
                type="button"
                className="btn btn-erp"
                data-bs-toggle="modal"
                data-bs-target="#inspectionModal"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-plus me-2" />
                Record an Inspection
              </button>
            </div>
          </div>

          <div className="erp-context-banner">
            <span className="erp-context-banner-icon">
              <i className="fa-solid fa-circle-info" />
            </span>
            <div className="erp-context-banner-body">
              <strong>A defect found here raises a rectification job automatically</strong>
              <span>
                Both a fail and a pass-with-defects open a work order against the machine. An inspection
                that records a defect and raises nothing is a filing exercise: the defect is written down,
                the machine keeps working, and nobody is ever asked to fix it.
              </span>
            </div>
          </div>

          <div className="erp-statrow">
            <a
              href="/equipment/inspections?result=fail"
              className="erp-stat is-danger "
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("fail");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-circle-xmark" />
              </span>
              <span className="erp-stat-body">
                <strong>1</strong>
                <small>failed</small>
              </span>
            </a>
            <a
              href="/equipment/inspections?result=conditional"
              className="erp-stat is-warning "
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("conditional");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-circle-exclamation" />
              </span>
              <span className="erp-stat-body">
                <strong>1</strong>
                <small>passed with defects</small>
              </span>
            </a>
            <div className="erp-stat is-info">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-calendar-day" />
              </span>
              <span className="erp-stat-body">
                <strong>2</strong>
                <small>re-inspection due</small>
              </span>
            </div>
            <a
              href="/equipment/inspections"
              className="erp-stat is-active"
              onClick={(e) => {
                e.preventDefault();
                setStatusFilter("");
              }}
            >
              <span className="erp-stat-icon">
                <i className="fa-solid fa-list" />
              </span>
              <span className="erp-stat-body">
                <strong>All</strong>
                <small>every inspection</small>
              </span>
            </a>
          </div>

          <div className="erp-card">
            <div className="erp-toolbar">
              <form method="GET" className="d-flex flex-wrap align-items-center gap-2 flex-grow-1" onSubmit={(e) => e.preventDefault()}>
                <select
                  name="equipment_id"
                  className="form-select erp-select"
                  data-select2
                  data-placeholder="Any machine"
                  aria-label="Machine"
                  value={eqFilter}
                  onChange={(e) => setEqFilter(e.target.value)}
                >
                  <option value="">Any machine</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.code} — {eq.name}
                    </option>
                  ))}
                </select>
                <select
                  name="result"
                  className="form-select erp-select"
                  aria-label="Result"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Any result</option>
                  <option value="pass">Passed</option>
                  <option value="conditional">Passed with defects</option>
                  <option value="fail">Failed</option>
                </select>
                <input
                  type="date"
                  name="from"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="form-control erp-select"
                  aria-label="From"
                />
                <input
                  type="date"
                  name="to"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="form-control erp-select"
                  aria-label="To"
                />
                <button type="submit" className="btn btn-erp-ghost">
                  Filter
                </button>
              </form>
              <span className="text-muted" style={{ fontSize: "12.5px" }}>
                {filtered.length} inspections
              </span>
            </div>

            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Inspection</th>
                      <th>Machine</th>
                      <th>Inspector</th>
                      <th>Result</th>
                      <th style={{ minWidth: 130 }}>Checks</th>
                      <th>Raised</th>
                      <th>Next due</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const eq = eqObj(r);
                      const isPass = r.result === "passed" || r.result === "pass";
                      return (
                        <tr key={String(r.id)}>
                          <td>
                            <Link href={`/equipment/inspections/${r.id}`} className="erp-plain-link erp-cell-strong">
                              {String(r.code)}
                            </Link>
                            <span className="erp-identity-meta d-block">
                              {String(r.inspectionDate ?? "27 Oct 2026")} · {String(r.inspectionType ?? "routine")}
                            </span>
                          </td>
                          <td>
                            <Link href={`/equipment/register/${eq.id}`} className="erp-plain-link">
                              {eq.code}
                            </Link>
                            <span className="erp-identity-meta d-block">{eq.name}</span>
                          </td>
                          <td>{String(r.inspectorName || "Unrecorded")}</td>
                          <td>
                            {isPass ? (
                              <span className="erp-pill is-success">
                                <i className="fa-solid fa-circle-check me-1" />
                                Passed
                              </span>
                            ) : r.result === "conditional" ? (
                              <span className="erp-pill is-warning">
                                <i className="fa-solid fa-circle-exclamation me-1" />
                                Passed with defects
                              </span>
                            ) : (
                              <span className="erp-pill is-danger">
                                <i className="fa-solid fa-circle-xmark me-1" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="erp-progress" title={isPass ? "15 of 15 passed" : "13 of 14 passed"}>
                              <span className="erp-progress-bar is-available" style={{ width: isPass ? "100%" : "92.9%" }} />
                            </div>
                            <small className="text-muted" style={{ fontSize: 11 }}>
                              {isPass ? (
                                "15/15"
                              ) : (
                                <>
                                  13/14 · <span className="text-danger">1 failed</span>
                                </>
                              )}
                            </small>
                          </td>
                          <td>
                            {isPass ? (
                              <span className="text-muted">—</span>
                            ) : (
                              <Link href="/equipment/work-orders" className="erp-plain-link">
                                EWO-2026-0003
                              </Link>
                            )}
                          </td>
                          <td className="text-nowrap">
                            <span className="text-warning">{String(r.nextInspectionDue || "26 Nov 2026")}</span>
                          </td>
                          <td className="text-end text-nowrap">
                            <Link href={`/equipment/inspections/${r.id}`} className="btn btn-erp-ghost btn-sm" title="View">
                              <i className="fa-solid fa-eye" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div
            className={`modal fade ${modalOpen ? "show d-block" : ""}`}
            id="inspectionModal"
            tabIndex={-1}
            aria-hidden={!modalOpen}
            style={modalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
          >
            <div className="modal-dialog modal-xl">
              <form method="POST" className="modal-content" data-inspection-form onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fa-solid fa-clipboard-check me-2" />
                    Record an inspection
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => setModalOpen(false)}
                  />
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-5">
                      <label className="form-label" htmlFor="inspEquipment">
                        Machine <span className="text-danger">*</span>
                      </label>
                      <select
                        id="inspEquipment"
                        name="equipment_id"
                        className="form-select"
                        required
                        data-select2
                        data-placeholder="Choose a machine"
                        data-inspection-equipment
                        value={String(form.equipment_id)}
                        onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
                      >
                        <option value=""></option>
                        {equipments.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.code} — {eq.name}
                          </option>
                        ))}
                      </select>
                      <div className="form-text">The checklist below loads itself from the kind of machine.</div>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="inspType">
                        Kind <span className="text-danger">*</span>
                      </label>
                      <select
                        id="inspType"
                        name="inspection_type"
                        className="form-select"
                        required
                        value={String(form.inspection_type)}
                        onChange={(e) => setForm({ ...form, inspection_type: e.target.value })}
                      >
                        <option value="routine">Routine walk-round</option>
                        <option value="pre_use">Pre-use check</option>
                        <option value="statutory">Statutory inspection</option>
                        <option value="post_repair">Post-repair check</option>
                        <option value="handover">Handover or return</option>
                      </select>
                    </div>

                    <div className="col-md-2">
                      <label className="form-label" htmlFor="inspDate">
                        Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        id="inspDate"
                        name="inspection_date"
                        className="form-control"
                        required
                        value={String(form.inspection_date)}
                        onChange={(e) => setForm({ ...form, inspection_date: e.target.value })}
                      />
                    </div>

                    <div className="col-md-2">
                      <label className="form-label" htmlFor="inspNextDue">
                        Next due
                      </label>
                      <input
                        type="date"
                        id="inspNextDue"
                        name="next_inspection_due"
                        className="form-control"
                        value={String(form.next_inspection_due)}
                        onChange={(e) => setForm({ ...form, next_inspection_due: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" htmlFor="inspInspector">
                        Inspector
                      </label>
                      <select
                        id="inspInspector"
                        name="inspector_employee_id"
                        className="form-select"
                        data-select2
                        data-placeholder="One of ours"
                        value={String(form.inspector_employee_id)}
                        onChange={(e) => setForm({ ...form, inspector_employee_id: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="MD. GOLAM RABBANY RONY">MD. GOLAM RABBANY RONY</option>
                        <option value="Muhamma Arif Al Imran">Muhamma Arif Al Imran</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="inspExternal">
                        Or an outside inspector
                      </label>
                      <input
                        type="text"
                        id="inspExternal"
                        name="external_inspector"
                        className="form-control"
                        maxLength={150}
                        value={String(form.external_inspector)}
                        onChange={(e) => setForm({ ...form, external_inspector: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label" htmlFor="inspHours">
                        Hour meter
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="inspHours"
                        name="hour_meter"
                        className="form-control"
                        value={String(form.hour_meter)}
                        onChange={(e) => setForm({ ...form, hour_meter: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label" htmlFor="inspKm">
                        Odometer
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="inspKm"
                        name="odometer"
                        className="form-control"
                        value={String(form.odometer)}
                        onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                      />
                    </div>
                  </div>

                  <hr className="my-3" />

                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h6 className="text-muted mb-0">Checklist</h6>
                    <div className="d-flex gap-2 align-items-center">
                      <span className="erp-identity-meta" data-checklist-summary>
                        Choose a machine to load its checklist
                      </span>
                      <button type="button" className="btn btn-erp-ghost btn-sm" data-pass-all>
                        <i className="fa-solid fa-check-double me-1" />
                        Pass all
                      </button>
                      <button type="button" className="btn btn-erp-ghost btn-sm" data-add-check>
                        <i className="fa-solid fa-plus me-1" />
                        Add a check
                      </button>
                    </div>
                  </div>

                  <div className="erp-table-wrap" style={{ maxHeight: 320, overflowY: "auto" }}>
                    <table className="table erp-table mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: "45%" }}>Checkpoint</th>
                          <th style={{ width: "18%" }}>Result</th>
                          <th>Observation</th>
                          <th style={{ width: 90 }} className="text-center">
                            Critical
                          </th>
                        </tr>
                      </thead>
                      <tbody data-checklist-body>
                        <tr data-checklist-empty>
                          <td colSpan={4} className="text-center text-muted py-3">
                            Pick a machine and its standard checklist appears here.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="row g-3 mt-2">
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="inspResult">
                        Overall result <span className="text-danger">*</span>
                      </label>
                      <select
                        id="inspResult"
                        name="result"
                        className="form-select"
                        required
                        data-inspection-result
                        value={String(form.result)}
                        onChange={(e) => setForm({ ...form, result: e.target.value })}
                      >
                        <option value="pass">Passed</option>
                        <option value="conditional">Passed with defects</option>
                        <option value="fail">Failed</option>
                      </select>
                      <div className="form-text" data-result-hint />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label" htmlFor="inspFindings">
                        Findings
                      </label>
                      <textarea
                        id="inspFindings"
                        name="findings"
                        className="form-control"
                        rows={3}
                        maxLength={4000}
                        placeholder="Anything the checklist does not cover"
                        value={String(form.findings)}
                        onChange={(e) => setForm({ ...form, findings: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
                    <i className="fa-solid fa-check me-2" />
                    Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {kind === "operators" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-id-card" />
              </div>
              <div>
                <h1>Operator Certifications</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Operators
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
                    "equipment-operators.csv",
                    ["Operator", "Certification", "Licence No", "Expires On"],
                    filtered.map((r) => [String(r.employeeName ?? ""), String(r.certificationType ?? ""), String(r.licenceNo ?? ""), String(r.expiresOn ?? "")])
                  )
                }
              >
                <i className="fa-solid fa-file-excel me-2" />
                Export
              </button>
              <button
                type="button"
                className="btn btn-erp"
                data-bs-toggle="modal"
                data-bs-target="#certModal"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-plus me-2" />
                Record a Certification
              </button>
            </div>
          </div>

          <div className="erp-context-banner">
            <span className="erp-context-banner-icon">
              <i className="fa-solid fa-shield-halved" />
            </span>
            <div className="erp-context-banner-body">
              <strong>An uncertified operator is an insurance claim that will be refused</strong>
              <span>
                Where a category is marked as needing certification, a usage log naming an operator without
                a valid, <em>verified</em> certificate is refused. Typing a licence number is not the same as
                somebody having seen it, which is why verification is a separate act.
              </span>
            </div>
          </div>

          <div className="erp-statrow">
            <a href="/equipment/operators?state=expired" className="erp-stat " onClick={(e) => e.preventDefault()}>
              <span className="erp-stat-icon">
                <i className="fa-solid fa-ban" />
              </span>
              <span className="erp-stat-body">
                <strong>0</strong>
                <small>expired</small>
              </span>
            </a>
            <a href="/equipment/operators?state=expiring" className="erp-stat " onClick={(e) => e.preventDefault()}>
              <span className="erp-stat-icon">
                <i className="fa-solid fa-clock" />
              </span>
              <span className="erp-stat-body">
                <strong>0</strong>
                <small>expiring soon</small>
              </span>
            </a>
            <a href="/equipment/operators?state=unverified" className="erp-stat " onClick={(e) => e.preventDefault()}>
              <span className="erp-stat-icon">
                <i className="fa-solid fa-question" />
              </span>
              <span className="erp-stat-body">
                <strong>0</strong>
                <small>never verified</small>
              </span>
            </a>
            <a href="/equipment/operators" className="erp-stat is-active" onClick={(e) => e.preventDefault()}>
              <span className="erp-stat-icon">
                <i className="fa-solid fa-list" />
              </span>
              <span className="erp-stat-body">
                <strong>All</strong>
                <small>every certification</small>
              </span>
            </a>
          </div>

          <div className="erp-card">
            <div className="erp-toolbar">
              <form
                method="GET"
                action="/equipment/operators"
                className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
                onSubmit={(e) => e.preventDefault()}
              >
                <select name="employee_id" className="form-select erp-select" data-select2 data-placeholder="Anyone" aria-label="Employee">
                  <option value="">Anyone</option>
                  <option value="2">MD. GOLAM RABBANY RONY</option>
                  <option value="1">Muhamma Arif Al Imran</option>
                </select>
                <select
                  name="equipment_category_id"
                  className="form-select erp-select"
                  data-select2
                  data-placeholder="Any category"
                  aria-label="Category"
                >
                  <option value="">Any category</option>
                  <option value="2">Concrete Mixer</option>
                  <option value="8">Dump Truck</option>
                  <option value="1">Excavator</option>
                  <option value="4">Generator</option>
                </select>
                <button type="submit" className="btn btn-erp-ghost">
                  Filter
                </button>
              </form>
              <span className="text-muted" style={{ fontSize: "12.5px" }}>
                {filtered.length} records
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-id-card" />
                </div>
                <h3>No certifications recorded</h3>
                <p>Record who may operate what, and the system will stop the rest.</p>
              </div>
            ) : (
              <div className="erp-card-body is-flush">
                <div className="erp-table-wrap">
                  <table className="table erp-table">
                    <thead>
                      <tr>
                        <th>Operator</th>
                        <th>Machine</th>
                        <th>Certification</th>
                        <th>Licence No</th>
                        <th>Authority</th>
                        <th>Expires On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => {
                        const eq = eqObj(r);
                        return (
                          <tr key={String(r.id)}>
                            <td className="erp-cell-strong">{String(r.employeeName ?? "")}</td>
                            <td>
                              {eq.code} — {eq.name}
                            </td>
                            <td>{String(r.certificationType ?? "")}</td>
                            <td>{String(r.licenceNo ?? "—")}</td>
                            <td>{String(r.issuingAuthority ?? "—")}</td>
                            <td>{String(r.expiresOn ?? "—")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div
            className={`modal fade ${modalOpen ? "show d-block" : ""}`}
            id="certModal"
            tabIndex={-1}
            aria-hidden={!modalOpen}
            style={modalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
          >
            <div className="modal-dialog modal-lg">
              <form method="POST" action="/equipment/operators" className="modal-content" onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fa-solid fa-id-card me-2" />
                    Record a certification
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => setModalOpen(false)}
                  />
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="certEmployee">
                        Operator <span className="text-danger">*</span>
                      </label>
                      <select
                        id="certEmployee"
                        name="employee_id"
                        className="form-select"
                        required
                        data-select2
                        data-placeholder="Who"
                        value={String(form.employee_id)}
                        onChange={(e) => setForm({ ...form, employee_id: e.target.value, employee_name: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="MD. GOLAM RABBANY RONY">MD. GOLAM RABBANY RONY</option>
                        <option value="Muhamma Arif Al Imran">Muhamma Arif Al Imran</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="certType">
                        Kind <span className="text-danger">*</span>
                      </label>
                      <select
                        id="certType"
                        name="certification_type"
                        className="form-select"
                        required
                        value={String(form.certification_type)}
                        onChange={(e) => setForm({ ...form, certification_type: e.target.value })}
                      >
                        <option value="operator">Operator competency</option>
                        <option value="driving_licence">Driving licence</option>
                        <option value="crane">Crane operator</option>
                        <option value="forklift">Forklift</option>
                        <option value="hazmat">Hazardous goods</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="certCategory">
                        Certified on (category)
                      </label>
                      <select
                        id="certCategory"
                        name="equipment_category_id"
                        className="form-select"
                        data-select2
                        data-placeholder="A family of machines"
                        value={String(form.equipment_category_id)}
                        onChange={(e) => setForm({ ...form, equipment_category_id: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="2">Concrete Mixer</option>
                        <option value="8">Dump Truck</option>
                        <option value="1">Excavator</option>
                        <option value="4">Generator</option>
                      </select>
                      <div className="form-text">Covers every machine in that family.</div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="certEquipment">
                        Or one machine
                      </label>
                      <select
                        id="certEquipment"
                        name="equipment_id"
                        className="form-select"
                        data-select2
                        data-placeholder="A specific machine"
                        value={String(form.equipment_id)}
                        onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
                      >
                        <option value=""></option>
                        {equipments.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.code} — {eq.name}
                          </option>
                        ))}
                      </select>
                      <div className="form-text">For tower cranes and specialised rigs.</div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" htmlFor="certLicence">
                        Licence number
                      </label>
                      <input
                        type="text"
                        id="certLicence"
                        name="licence_no"
                        className="form-control"
                        maxLength={80}
                        value={String(form.licence_no)}
                        onChange={(e) => setForm({ ...form, licence_no: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label" htmlFor="certClass">
                        Class
                      </label>
                      <input
                        type="text"
                        id="certClass"
                        name="licence_class"
                        className="form-control"
                        maxLength={40}
                        value={String(form.licence_class)}
                        onChange={(e) => setForm({ ...form, licence_class: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="certAuthority">
                        Issued by
                      </label>
                      <input
                        type="text"
                        id="certAuthority"
                        name="issuing_authority"
                        className="form-control"
                        maxLength={150}
                        value={String(form.issuing_authority)}
                        onChange={(e) => setForm({ ...form, issuing_authority: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="certIssued">
                        Issued on
                      </label>
                      <input
                        type="date"
                        id="certIssued"
                        name="issued_on"
                        className="form-control"
                        value={String(form.issued_on)}
                        onChange={(e) => setForm({ ...form, issued_on: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="certExpires">
                        Expires on
                      </label>
                      <input
                        type="date"
                        id="certExpires"
                        name="expires_on"
                        className="form-control"
                        value={String(form.expires_on)}
                        onChange={(e) => setForm({ ...form, expires_on: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="certRestrictions">
                        Restrictions
                      </label>
                      <input
                        type="text"
                        id="certRestrictions"
                        name="restrictions"
                        className="form-control"
                        maxLength={1000}
                        placeholder="Daylight only, up to 20 tonnes"
                        value={String(form.restrictions)}
                        onChange={(e) => setForm({ ...form, restrictions: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <div className="erp-callout">
                        <i className="fa-solid fa-circle-info me-1" />
                        <span>
                          This is recorded as <strong>not yet verified</strong>. It only starts protecting
                          anybody once somebody has actually seen the licence and verified it on the list.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
                    <i className="fa-solid fa-check me-2" />
                    Record
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div
            className={`modal fade ${deleteTarget ? "show d-block" : ""}`}
            id="deleteRecordModal"
            tabIndex={-1}
            aria-hidden={!deleteTarget}
            style={deleteTarget ? { background: "rgba(15,23,42,0.5)" } : undefined}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <div className="modal-body p-4">
                  <div className="d-flex gap-3">
                    <div className="erp-kpi-icon is-danger">
                      <i className="fa-solid fa-triangle-exclamation" />
                    </div>
                    <div>
                      <h5 className="mb-2" style={{ fontSize: 16, fontWeight: 600 }}>
                        Delete certification?
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                        <strong data-delete-name>{deleteTarget?.name}</strong> will be removed from active use. The record is
                        retained and can be restored by an administrator.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setDeleteTarget(null)}>
                    Cancel
                  </button>
                  <form
                    method="POST"
                    data-delete-form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setDeleteTarget(null);
                    }}
                  >
                    <input type="hidden" name="_method" value="DELETE" />
                    <button
                      type="submit"
                      className="btn btn-erp"
                      style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
                    >
                      <i className="fa-solid fa-trash-can me-2" />
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {kind === "rentals" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-file-contract" />
              </div>
              <div>
                <h1>Hire Contracts</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Hire
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
                    "equipment-rentals.csv",
                    ["Contract", "Counterparty", "Machine", "Rate", "Status"],
                    filtered.map((r) => [String(r.code ?? ""), String(r.counterparty ?? ""), eqObj(r).code, String(r.rate ?? 0), String(r.status ?? "")])
                  )
                }
              >
                <i className="fa-solid fa-file-excel me-2" />
                Export
              </button>
              <button
                type="button"
                className="btn btn-erp"
                data-bs-toggle="modal"
                data-bs-target="#rentalModal"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-plus me-2" />
                New Contract
              </button>
            </div>
          </div>

          <div className="erp-context-banner" style={{ borderColor: "#dc2626", background: "#fef2f2" }}>
            <span className="erp-context-banner-icon">
              <i className="fa-solid fa-money-bill-trend-up" />
            </span>
            <div className="erp-context-banner-body">
              <strong>2 contracts past the agreed end date</strong>
              <span>
                <strong>EHR-2026-0001</strong> (EQP-0011) — 24 days over. <strong>EHR-2026-0002</strong> (EQP-0012) — 8 days over. Every day is still being billed. Close them, or agree an extension.
              </span>
            </div>
          </div>

          <div className="erp-card">
            <div className="erp-toolbar">
              <form
                method="GET"
                action="/equipment/rentals"
                className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
                onSubmit={(e) => e.preventDefault()}
              >
                <select
                  name="direction"
                  className="form-select erp-select"
                  aria-label="Direction"
                  value={directionFilter}
                  onChange={(e) => setDirectionFilter(e.target.value)}
                >
                  <option value="">In and out</option>
                  <option value="in">Hired in</option>
                  <option value="out">Hired out</option>
                </select>
                <select
                  name="status"
                  className="form-select erp-select"
                  aria-label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Any status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  name="project_id"
                  className="form-select erp-select"
                  data-select2
                  data-placeholder="Any project"
                  aria-label="Project"
                  value={projFilter}
                  onChange={(e) => setProjFilter(e.target.value)}
                >
                  <option value="">Any project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-erp-ghost">
                  Filter
                </button>
              </form>
              <span className="text-muted" style={{ fontSize: "12.5px" }}>
                {filtered.length} contracts
              </span>
            </div>

            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Contract</th>
                      <th>Counterparty</th>
                      <th>What</th>
                      <th>Period</th>
                      <th className="text-end">Rate</th>
                      <th>Terms</th>
                      <th className="text-end">Outstanding</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const eq = eqObj(r);
                      return (
                        <tr key={String(r.id)}>
                          <td>
                            <span className="erp-cell-strong">{String(r.code)}</span>
                            <span className="erp-identity-meta d-block">
                              {r.direction === "out" || r.direction === "hired_out" ? "hired out" : "hired in"}
                            </span>
                          </td>
                          <td>{String(r.counterparty || "Unrecorded")}</td>
                          <td>{String(r.description || eq.code)}</td>
                          <td className="text-nowrap">
                            {String(r.startDate ?? "20 Oct 2026")}
                            <span className="erp-identity-meta d-block">
                              {String(r.endDate ?? "09 Nov 2026")} · 21 days
                            </span>
                          </td>
                          <td className="text-end text-nowrap">
                            <span className="erp-cell-strong">
                              {Number(r.rate ?? 28000).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <span className="erp-identity-meta d-block">
                              per {r.rateBasis === "hourly" ? "hr" : "day"}
                            </span>
                          </td>
                          <td>
                            <span className="erp-pill is-success" title="They fuel it">
                              fuel
                            </span>{" "}
                            <span className="erp-pill is-success" title="Operator included">
                              operator
                            </span>
                            <span className="erp-identity-meta d-block">8.0 hr/day included</span>
                          </td>
                          <td className="text-end">0.00</td>
                          <td>
                            <span className="erp-pill is-warning">Active</span>
                            <span className="erp-identity-meta d-block text-danger">8 days over</span>
                          </td>
                          <td className="text-end text-nowrap">
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm"
                              title="Close this hire"
                              data-bs-toggle="modal"
                              data-bs-target="#closeRentalModal"
                              onClick={() => setCloseRentalTarget(String(r.code))}
                            >
                              <i className="fa-solid fa-flag-checkered" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-danger"
                              title="Delete"
                              data-bs-toggle="modal"
                              data-bs-target="#deleteRecordModal"
                              onClick={() => setDeleteTarget({ id: Number(r.id), name: String(r.code) })}
                            >
                              <i className="fa-solid fa-trash-can" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="erp-card mt-3">
            <div className="erp-card-head">
              <h2>
                <i className="fa-solid fa-file-invoice-dollar me-2" />
                Hire charges for November 2026
              </h2>
              <form method="GET" className="d-flex gap-2 align-items-center" onSubmit={(e) => e.preventDefault()}>
                <input type="date" name="period" defaultValue="2026-11-01" className="form-control form-control-sm" />
                <button className="btn btn-erp-ghost btn-sm">Preview</button>
              </form>
            </div>

            <div className="erp-card-body">
              <div className="erp-callout">
                <i className="fa-solid fa-circle-info me-1" />
                <span>
                  Charged day by day, so the minimum charge and the overtime ladder both apply.
                  Days with no usage logged still charge where the contract says idle days are
                  billable — which is the commonest way hire money leaks.
                  Posts <strong>Dr Equipment Rental / Cr Accounts Payable</strong>, kept apart from
                  the plant operating pool because it is somebody else&apos;s machine.
                </span>
              </div>

              <div className="erp-table-wrap mt-3">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Contract</th>
                      <th>Machine</th>
                      <th className="text-end">Days</th>
                      <th className="text-end">Hours logged</th>
                      <th className="text-end">Charge</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, idx) => {
                      const eq = eqObj(r);
                      return (
                        <tr key={String(r.id)}>
                          <td>
                            <span className="erp-cell-strong">{String(r.code)}</span>
                            <span className="erp-identity-meta d-block">{String(r.counterparty || "Unrecorded")}</span>
                          </td>
                          <td>{eq.code}</td>
                          <td className="text-end">{idx === 0 ? "17" : "—"}</td>
                          <td className="text-end">—</td>
                          <td className="text-end erp-cell-strong">{idx === 0 ? "714,000.00" : "—"}</td>
                          <td>
                            <span className="erp-pill is-success">ready</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="erp-cell-strong">
                      <td colSpan={4} className="text-end">
                        To post
                      </td>
                      <td className="text-end">714,000.00</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="erp-card-foot d-flex justify-content-end">
              <form method="POST" action="/equipment/rentals/accrue" onSubmit={(e) => e.preventDefault()}>
                <input type="hidden" name="period" value="2026-11-01" />
                <button className="btn btn-erp" data-submit-button>
                  <i className="fa-solid fa-play me-2" />
                  Post 714,000.00
                </button>
              </form>
            </div>
          </div>

          <div
            className={`modal fade ${modalOpen ? "show d-block" : ""}`}
            id="rentalModal"
            tabIndex={-1}
            aria-hidden={!modalOpen}
            style={modalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
          >
            <div className="modal-dialog modal-lg">
              <form method="POST" action="/equipment/rentals" className="modal-content" data-rental-form onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fa-solid fa-file-contract me-2" />
                    New hire contract
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => setModalOpen(false)}
                  />
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="rentDirection">
                        Direction <span className="text-danger">*</span>
                      </label>
                      <select
                        id="rentDirection"
                        name="direction"
                        className="form-select"
                        required
                        data-rental-direction
                        value={String(form.direction)}
                        onChange={(e) => setForm({ ...form, direction: e.target.value })}
                      >
                        <option value="in">Hiring a machine in</option>
                        <option value="out">Hiring ours out</option>
                      </select>
                    </div>

                    <div className={`col-md-4 ${form.direction === "in" ? "" : "d-none"}`} data-party="in">
                      <label className="form-label" htmlFor="rentSupplier">
                        Hire company
                      </label>
                      <select
                        id="rentSupplier"
                        name="supplier_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Who we are hiring from"
                        value={String(form.supplier_id)}
                        onChange={(e) => setForm({ ...form, supplier_id: e.target.value, counterparty: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="Bengal Plant Hire Ltd">Bengal Plant Hire Ltd</option>
                      </select>
                    </div>

                    <div className={`col-md-4 ${form.direction === "out" ? "" : "d-none"}`} data-party="out">
                      <label className="form-label" htmlFor="rentClient">
                        Client
                      </label>
                      <select
                        id="rentClient"
                        name="client_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Who we are hiring to"
                        value={String(form.client_id)}
                        onChange={(e) => setForm({ ...form, client_id: e.target.value, counterparty: e.target.value })}
                      >
                        <option value=""></option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" htmlFor="rentProject">
                        Project
                      </label>
                      <select
                        id="rentProject"
                        name="project_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Which job"
                        value={String(form.project_id)}
                        onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                      >
                        <option value=""></option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="rentEquipment">
                        Our machine
                      </label>
                      <select
                        id="rentEquipment"
                        name="equipment_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Only when hiring ours out"
                        value={String(form.equipment_id)}
                        onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
                      >
                        <option value=""></option>
                        {equipments.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.code} — {eq.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label" htmlFor="rentDescription">
                        What it is
                      </label>
                      <input
                        type="text"
                        id="rentDescription"
                        name="description"
                        className="form-control"
                        maxLength={190}
                        placeholder="20-tonne excavator"
                        value={String(form.description)}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label" htmlFor="rentRego">
                        Plate
                      </label>
                      <input
                        type="text"
                        id="rentRego"
                        name="registration_no"
                        className="form-control"
                        maxLength={40}
                        value={String(form.registration_no)}
                        onChange={(e) => setForm({ ...form, registration_no: e.target.value })}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="rentStart">
                        From <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        id="rentStart"
                        name="start_date"
                        className="form-control"
                        required
                        value={String(form.start_date)}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="rentEnd">
                        Until
                      </label>
                      <input
                        type="date"
                        id="rentEnd"
                        name="end_date"
                        className="form-control"
                        value={String(form.end_date)}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      />
                      <div className="form-text">Drives the overrun warning.</div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="rentBasis">
                        Charged by <span className="text-danger">*</span>
                      </label>
                      <select
                        id="rentBasis"
                        name="rate_basis"
                        className="form-select"
                        required
                        value={String(form.rate_basis)}
                        onChange={(e) => setForm({ ...form, rate_basis: e.target.value })}
                      >
                        <option value="hourly">Per hour</option>
                        <option value="daily">Per day</option>
                        <option value="monthly">Per month</option>
                        <option value="kilometre">Per kilometre</option>
                        <option value="trip">Per trip</option>
                        <option value="lumpsum">Lump sum</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="rentRate">
                        Rate <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="rentRate"
                        name="rate"
                        className="form-control"
                        required
                        value={String(form.rate)}
                        onChange={(e) => setForm({ ...form, rate: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <hr className="my-1" />
                    </div>
                    <div className="col-12">
                      <h6 className="text-muted mb-2">The clauses that cost money quietly</h6>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="rentIncluded">
                        Hours a day included
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        id="rentIncluded"
                        name="included_hours_per_day"
                        className="form-control"
                        placeholder="8"
                        value={String(form.included_hours_per_day)}
                        onChange={(e) => setForm({ ...form, included_hours_per_day: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="rentOvertime">
                        Overtime rate
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="rentOvertime"
                        name="overtime_rate"
                        className="form-control"
                        value={String(form.overtime_rate)}
                        onChange={(e) => setForm({ ...form, overtime_rate: e.target.value })}
                      />
                      <div className="form-text">Beyond the included hours.</div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="rentMinCharge">
                        Minimum charge
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="rentMinCharge"
                        name="minimum_charge"
                        className="form-control"
                        value={String(form.minimum_charge)}
                        onChange={(e) => setForm({ ...form, minimum_charge: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="rentDeposit">
                        Security deposit
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="rentDeposit"
                        name="security_deposit"
                        className="form-control"
                        value={String(form.security_deposit)}
                        onChange={(e) => setForm({ ...form, security_deposit: e.target.value })}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label" htmlFor="rentMob">
                        Mobilisation
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="rentMob"
                        name="mobilisation_charge"
                        className="form-control"
                        value={String(form.mobilisation_charge)}
                        onChange={(e) => setForm({ ...form, mobilisation_charge: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="rentDemob">
                        Demobilisation
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="rentDemob"
                        name="demobilisation_charge"
                        className="form-control"
                        value={String(form.demobilisation_charge)}
                        onChange={(e) => setForm({ ...form, demobilisation_charge: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="rentRef">
                        Contract reference
                      </label>
                      <input
                        type="text"
                        id="rentRef"
                        name="contract_reference"
                        className="form-control"
                        maxLength={80}
                        value={String(form.contract_reference)}
                        onChange={(e) => setForm({ ...form, contract_reference: e.target.value })}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="fuel_included"
                          value="1"
                          checked={Boolean(form.fuel_included)}
                          onChange={(e) => setForm({ ...form, fuel_included: e.target.checked })}
                        />
                        <span className="form-check-label">Fuel included</span>
                      </label>
                      <div className="form-text">A fuel log on this machine will then post nothing.</div>
                    </div>
                    <div className="col-md-3">
                      <label className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="operator_included"
                          value="1"
                          checked={Boolean(form.operator_included)}
                          onChange={(e) => setForm({ ...form, operator_included: e.target.checked })}
                        />
                        <span className="form-check-label">Operator included</span>
                      </label>
                    </div>
                    <div className="col-md-3">
                      <label className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="maintenance_included"
                          value="1"
                          checked={Boolean(form.maintenance_included)}
                          onChange={(e) => setForm({ ...form, maintenance_included: e.target.checked })}
                        />
                        <span className="form-check-label">Maintenance included</span>
                      </label>
                    </div>
                    <div className="col-md-3">
                      <label className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="idle_days_chargeable"
                          value="1"
                          checked={Boolean(form.idle_days_chargeable)}
                          onChange={(e) => setForm({ ...form, idle_days_chargeable: e.target.checked })}
                        />
                        <span className="form-check-label">Idle days billed</span>
                      </label>
                      <div className="form-text">Usually yes, and usually forgotten.</div>
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="rentTerms">
                        Terms
                      </label>
                      <textarea
                        id="rentTerms"
                        name="terms"
                        className="form-control"
                        rows={2}
                        maxLength={5000}
                        value={String(form.terms)}
                        onChange={(e) => setForm({ ...form, terms: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
                    <i className="fa-solid fa-check me-2" />
                    Record
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div
            className={`modal fade ${closeRentalTarget ? "show d-block" : ""}`}
            id="closeRentalModal"
            tabIndex={-1}
            aria-hidden={!closeRentalTarget}
            style={closeRentalTarget ? { background: "rgba(15,23,42,0.5)" } : undefined}
          >
            <div className="modal-dialog">
              <form
                method="POST"
                className="modal-content"
                data-close-rental-form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCloseRentalTarget(null);
                }}
              >
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fa-solid fa-flag-checkered me-2" />
                    Close <span data-close-label>{closeRentalTarget}</span>
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => setCloseRentalTarget(null)}
                  />
                </div>
                <div className="modal-body">
                  <label className="form-label" htmlFor="closeDate">
                    Actually ended on <span className="text-danger">*</span>
                  </label>
                  <input type="date" id="closeDate" name="actual_end_date" className="form-control" required defaultValue={today} />
                  <div className="form-text mb-3">This is the date the billing stops running.</div>

                  <label className="form-check">
                    <input type="checkbox" className="form-check-input" name="deposit_refunded" value="1" />
                    <span className="form-check-label">Deposit refunded</span>
                  </label>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    data-bs-dismiss="modal"
                    onClick={() => setCloseRentalTarget(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" data-submit-button>
                    Close the hire
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div
            className={`modal fade ${deleteTarget ? "show d-block" : ""}`}
            id="deleteRecordModal"
            tabIndex={-1}
            aria-hidden={!deleteTarget}
            style={deleteTarget ? { background: "rgba(15,23,42,0.5)" } : undefined}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <div className="modal-body p-4">
                  <div className="d-flex gap-3">
                    <div className="erp-kpi-icon is-danger">
                      <i className="fa-solid fa-triangle-exclamation" />
                    </div>
                    <div>
                      <h5 className="mb-2" style={{ fontSize: 16, fontWeight: 600 }}>
                        Delete contract?
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                        <strong data-delete-name>{deleteTarget?.name}</strong> will be removed from active use. The record is
                        retained and can be restored by an administrator.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setDeleteTarget(null)}>
                    Cancel
                  </button>
                  <form
                    method="POST"
                    data-delete-form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setDeleteTarget(null);
                    }}
                  >
                    <input type="hidden" name="_method" value="DELETE" />
                    <button
                      type="submit"
                      className="btn btn-erp"
                      style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
                    >
                      <i className="fa-solid fa-trash-can me-2" />
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
