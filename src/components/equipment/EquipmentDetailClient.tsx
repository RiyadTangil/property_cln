"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EquipmentSubmenu } from "./EquipmentSubmenu";

interface EquipmentDetail {
  id: number;
  code: string;
  name: string;
  equipmentClass: string;
  make: string | null;
  model: string | null;
  yearOfManufacture: number | null;
  serialNo: string | null;
  fuelType: string;
  registrationNo: string | null;
  ownershipType: string;
  acquiredOn: string | null;
  acquisitionCost: number;
  depreciationMethod: string;
  usefulLifeYears: number;
  salvageValue: number;
  rateBasis: string;
  internalHourlyRate: number;
  internalDailyRate: number;
  meterType: string;
  currentHourMeter: number;
  currentOdometer: number;
  custodianName: string | null;
  operatorName: string | null;
  currentLocation: string | null;
  status: string;
  remarks: string | null;
  category: { name: string } | null;
  assignments: { id: number; siteLocation: string | null; requiredFrom: string | null; requiredTo: string | null; status: string; custodianName: string | null }[];
  usageLogs: { id: number; usageDate: string; shift: string; hoursWorked: number; hoursIdle: number; hoursDown: number; operatorName: string | null }[];
  fuelLogs: { id: number; fuelDate: string; fuelType: string; quantity: number; amount: number; stationName: string | null }[];
  workOrders: { id: number; code: string; type: string; priority: string; symptoms: string; estimatedCost: number; status: string }[];
  inspections: { id: number; code: string; inspectionDate: string; inspectionType: string; inspectorName: string | null; result: string }[];
  certifications: { id: number; employeeName: string; certificationType: string; licenceNo: string | null; expiresOn: string | null }[];
}

export function EquipmentDetailClient({ equipment }: { equipment: EquipmentDetail }) {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "cost" | "maintenance" | "deployment" | "fuel" | "papers">("overview");
  const [openAccordion, setOpenAccordion] = useState<string>("insurance");
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docViewOpen, setDocViewOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [disposeOpen, setDisposeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(String(equipment.currentHourMeter || ""));

  const [disposeForm, setDisposeForm] = useState({
    disposal_amount: "0",
    disposed_on: new Date().toISOString().slice(0, 10),
    disposal_reference: "",
  });

  async function handleMeterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch(`/api/equipment/register/${equipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_hour_meter: reading,
        }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDispose(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch(`/api/equipment/register/${equipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "retired",
          remarks: `Disposed on ${disposeForm.disposed_on} for ৳${disposeForm.disposal_amount} (${disposeForm.disposal_reference})`,
        }),
      });
      setDisposeOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const classLabel =
    equipment.equipmentClass === "vehicle" || equipment.equipmentClass === "transport"
      ? "Vehicle"
      : equipment.equipmentClass === "tool" || equipment.equipmentClass === "light_tools"
        ? "Tools & Scaffolding"
        : "Plant & Machinery";

  return (
    <div className="container ">
      <EquipmentSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-tractor" />
          </div>
          <div>
            <h1>{equipment.name}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/equipment">Equipment</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/equipment/register">Register</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {equipment.code}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href={`/equipment/assignments?equipment_id=${equipment.id}`} className="btn btn-erp-ghost">
            <i className="fa-solid fa-truck-arrow-right me-2" />
            Assign
          </Link>
          <Link href={`/equipment/inspections?equipment_id=${equipment.id}`} className="btn btn-erp-ghost">
            <i className="fa-solid fa-clipboard-check me-2" />
            Inspections
          </Link>
          <Link href={`/equipment/register/${equipment.id}/edit`} className="btn btn-erp-ghost">
            <i className="fa-solid fa-pen me-2" />
            Edit
          </Link>
          <button
            type="button"
            className="btn btn-erp-ghost text-danger"
            data-bs-toggle="modal"
            data-bs-target="#disposeModal"
            onClick={() => setDisposeOpen(true)}
          >
            <i className="fa-solid fa-box-archive me-2" />
            Dispose
          </button>
        </div>
      </div>

      <div className="erp-statrow">
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-circle-check" />
          </span>
          <span className="erp-stat-body">
            <strong className="text-capitalize">{equipment.status}</strong>
            <small>{equipment.currentLocation ?? "Central yard"}</small>
          </span>
        </div>
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-gauge" />
          </span>
          <span className="erp-stat-body">
            <strong>
              {equipment.meterType === "odometer"
                ? `${equipment.currentOdometer.toLocaleString()} km`
                : `${equipment.currentHourMeter.toLocaleString()} hr`}
            </strong>
            <small>never read</small>
          </span>
        </div>
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-coins" />
          </span>
          <span className="erp-stat-body">
            <strong>—</strong>
            <small>cost per hour this month</small>
          </span>
        </div>
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-building-columns" />
          </span>
          <span className="erp-stat-body">
            <strong>{equipment.acquisitionCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <small>net book value</small>
          </span>
        </div>
      </div>

      <div className="erp-detail" data-fill-viewport="24" data-equipment-tabs>
        <div className="erp-tabs is-glass" role="tablist" aria-label={`${equipment.code} sections`}>
          <button
            type="button"
            className={`erp-tab ${tab === "overview" ? "is-active" : ""}`}
            role="tab"
            aria-selected={tab === "overview"}
            aria-controls="tab-overview"
            data-tab="overview"
            data-equipment-tab="overview"
            onClick={() => setTab("overview")}
          >
            <i className="fa-solid fa-circle-info" />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${tab === "cost" ? "is-active" : ""}`}
            role="tab"
            aria-selected={tab === "cost"}
            aria-controls="tab-cost"
            data-tab="cost"
            data-equipment-tab="cost"
            onClick={() => setTab("cost")}
          >
            <i className="fa-solid fa-coins" />
            <span>Cost</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${tab === "maintenance" ? "is-active" : ""}`}
            role="tab"
            aria-selected={tab === "maintenance"}
            aria-controls="tab-maintenance"
            data-tab="maintenance"
            data-equipment-tab="maintenance"
            onClick={() => setTab("maintenance")}
          >
            <i className="fa-solid fa-screwdriver-wrench" />
            <span>Maintenance</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${tab === "deployment" ? "is-active" : ""}`}
            role="tab"
            aria-selected={tab === "deployment"}
            aria-controls="tab-deployment"
            data-tab="deployment"
            data-equipment-tab="deployment"
            onClick={() => setTab("deployment")}
          >
            <i className="fa-solid fa-truck-arrow-right" />
            <span>Deployment</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${tab === "fuel" ? "is-active" : ""}`}
            role="tab"
            aria-selected={tab === "fuel"}
            aria-controls="tab-fuel"
            data-tab="fuel"
            data-equipment-tab="fuel"
            onClick={() => setTab("fuel")}
          >
            <i className="fa-solid fa-gas-pump" />
            <span>Fuel</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${tab === "papers" ? "is-active" : ""}`}
            role="tab"
            aria-selected={tab === "papers"}
            aria-controls="tab-papers"
            data-tab="papers"
            data-equipment-tab="papers"
            onClick={() => setTab("papers")}
          >
            <i className="fa-solid fa-shield-halved" />
            <span>Papers</span>
          </button>
        </div>

        <div className="erp-detail-body">
          <section
            id="tab-overview"
            role="tabpanel"
            className={`erp-detail-panel ${tab === "overview" ? "" : "d-none"}`}
            data-equipment-panel="overview"
          >
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
                    <span>Code</span>
                    <strong>{equipment.code}</strong>
                  </li>
                  <li>
                    <span>Class</span>
                    <strong>{classLabel}</strong>
                  </li>
                  <li>
                    <span>Category</span>
                    <strong>{equipment.category?.name ?? "Excavator"}</strong>
                  </li>
                  <li>
                    <span>Make &amp; model</span>
                    <strong>{[equipment.make, equipment.model].filter(Boolean).join(" ") || equipment.name}</strong>
                  </li>
                  <li>
                    <span>Serial</span>
                    <strong>{equipment.serialNo ?? "EXC-43224"}</strong>
                  </li>
                  <li>
                    <span>Ownership</span>
                    <strong className="text-capitalize">{equipment.ownershipType}</strong>
                  </li>
                  <li>
                    <span>Custodian</span>
                    <strong>{equipment.custodianName || "—"}</strong>
                  </li>
                  <li>
                    <span>Operator</span>
                    <strong>{equipment.operatorName || "—"}</strong>
                  </li>
                  <li>
                    <span>Charge-out</span>
                    <strong>
                      {equipment.internalHourlyRate.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      / hr
                    </strong>
                  </li>
                  <li>
                    <span>Acquired</span>
                    <strong>{equipment.acquiredOn ?? "01 Jul 2022"}</strong>
                  </li>
                  <li>
                    <span>Cost</span>
                    <strong>
                      {equipment.acquisitionCost.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </li>
                  <li>
                    <span>Depreciated</span>
                    <strong>0.00</strong>
                  </li>
                </ul>
              </div>
            </div>

            <div className="erp-card mt-3">
              <div className="erp-card-head">
                <h2>
                  <i className="fa-solid fa-gauge me-2" />
                  Record a reading
                </h2>
              </div>
              <div className="erp-card-body">
                <form
                  data-meter-form
                  data-url={`/equipment/register/${equipment.id}/meter`}
                  className="d-flex gap-2 align-items-end"
                  onSubmit={handleMeterSubmit}
                >
                  <div className="flex-grow-1">
                    <label className="form-label" htmlFor="meterReading">
                      Current hour meter
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="meterReading"
                        name="reading"
                        className="form-control"
                        required
                        placeholder={equipment.currentHourMeter.toLocaleString()}
                        value={reading}
                        onChange={(e) => setReading(e.target.value)}
                      />
                      <span className="input-group-text">hr</span>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
                    Save
                  </button>
                </form>
                <div className="form-text mt-2">
                  Readings only ever go forward. If the meter was replaced, record a reset so the
                  old reading is carried forward.
                </div>
              </div>
            </div>
          </section>

          <section
            id="tab-cost"
            role="tabpanel"
            className={`erp-detail-panel ${tab === "cost" ? "" : "d-none"}`}
            data-equipment-panel="cost"
          >
            <div className="erp-card">
              <div className="erp-card-head">
                <h2>
                  <i className="fa-solid fa-coins me-2" />
                  Cost this month
                </h2>
                <span className="erp-identity-meta">2026-11-01 to 2026-11-17</span>
              </div>
              <div className="erp-card-body">
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="erp-metric">
                      <small>Operating cost</small>
                      <strong>0.00</strong>
                      <span className="erp-identity-meta">0.00 variable</span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-metric">
                      <small>Charged to projects</small>
                      <strong className="text-success">0.00</strong>
                      <span className="erp-identity-meta">0.0 hr worked</span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-metric">
                      <small>Not recovered</small>
                      <strong className="text-success">0.00</strong>
                      <span className="erp-identity-meta">cost less recovery</span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-metric">
                      <small>Idle / down</small>
                      <strong>0.0 hr</strong>
                      <span className="erp-identity-meta">0.0 idle, 0.0 down</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="tab-maintenance"
            role="tabpanel"
            className={`erp-detail-panel ${tab === "maintenance" ? "" : "d-none"}`}
            data-equipment-panel="maintenance"
          >
            <div className="erp-card mt-3">
              <div className="erp-card-head">
                <h2>
                  <i className="fa-solid fa-screwdriver-wrench me-2" />
                  Maintenance
                </h2>
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#planModal"
                  onClick={() => setPlanOpen(true)}
                >
                  <i className="fa-solid fa-plus me-1" />
                  Schedule
                </button>
              </div>
              <div className="erp-card-body">
                <ul className="erp-keyval">
                  <li>
                    <span>
                      <strong>250-hour service</strong>
                      <span className="erp-identity-meta d-block">every 250 hr / 180 days</span>
                    </span>
                    <strong>In 143 hr</strong>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section
            id="tab-deployment"
            role="tabpanel"
            className={`erp-detail-panel ${tab === "deployment" ? "" : "d-none"}`}
            data-equipment-panel="deployment"
          >
            <div className="erp-card mt-3">
              <div className="erp-card-head">
                <h2>
                  <i className="fa-solid fa-truck-arrow-right me-2" />
                  Recent assignments
                </h2>
              </div>
              <div className="erp-card-body">
                <p className="text-muted mb-0">This machine has never been assigned.</p>
              </div>
            </div>

            <div className="erp-card mt-3">
              <div className="erp-card-head">
                <h2>
                  <i className="fa-solid fa-clock me-2" />
                  Recent work
                </h2>
                <Link href={`/equipment/usage?equipment_id=${equipment.id}`} className="btn btn-erp-ghost btn-sm">
                  All logs
                </Link>
              </div>

              <div className="erp-card-body">
                <p className="text-muted mb-0">
                  No work logged against this machine. Hours are what move its cost onto a project —
                  without them it is an overhead wherever it stands.
                </p>
              </div>
            </div>
          </section>

          <section
            id="tab-fuel"
            role="tabpanel"
            className={`erp-detail-panel ${tab === "fuel" ? "" : "d-none"}`}
            data-equipment-panel="fuel"
          >
            <div className="erp-card">
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-gas-pump" />
                </div>
                <h3>No fuel recorded</h3>
                <p>
                  Every fill with a meter reading feeds the consumption check. Without readings,
                  fuel loss on this machine is invisible.
                </p>
                <Link href={`/equipment/fuel?equipment_id=${equipment.id}`} className="btn btn-erp">
                  <i className="fa-solid fa-plus me-2" />
                  Record a Fill
                </Link>
              </div>
            </div>
          </section>

          <section
            id="tab-papers"
            role="tabpanel"
            className={`erp-detail-panel ${tab === "papers" ? "" : "d-none"}`}
            data-equipment-panel="papers"
          >
            <div className="erp-card mt-3">
              <div className="erp-card-head">
                <h2>
                  <i className="fa-solid fa-shield-halved me-2" />
                  Papers
                </h2>
                <span className="erp-pill is-success">all current</span>
              </div>

              <div className="erp-card-body">
                <div className="accordion" id="paperAccordion">
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className={`accordion-button ${openAccordion === "insurance" ? "" : "collapsed"}`}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#paper-insurance"
                        aria-expanded={openAccordion === "insurance"}
                        aria-controls="paper-insurance"
                        onClick={() => setOpenAccordion(openAccordion === "insurance" ? "" : "insurance")}
                      >
                        <i className="fa-solid fa-shield-halved me-2" />
                        <span className="flex-grow-1">Insurance</span>
                        <span className="erp-pill is-success me-2">to 30 Sep 2027</span>
                      </button>
                    </h2>

                    <div
                      id="paper-insurance"
                      className={`accordion-collapse collapse ${openAccordion === "insurance" ? "show" : ""}`}
                      data-bs-parent="#paperAccordion"
                    >
                      <div className="accordion-body">
                        <div className="form-text mb-2">
                          Set the <strong>expiry date</strong> when you upload. Once it lapses this machine cannot be dispatched without an override.
                        </div>

                        <div className="erp-docm" data-doc-manager data-type="equipment" data-id={equipment.id} data-collection="insurance">
                          <div className="d-flex justify-content-end mb-2">
                            <button
                              type="button"
                              className="btn btn-erp btn-sm"
                              data-docm-add
                              onClick={() => setDocModalOpen(true)}
                            >
                              <i className="fa-solid fa-upload me-1" />
                              Add Document
                            </button>
                          </div>

                          <div data-docm-list>
                            <div className="erp-table-wrap">
                              <table className="table erp-table">
                                <thead>
                                  <tr>
                                    <th>Document</th>
                                    <th>Doc No</th>
                                    <th>Issued By</th>
                                    <th>Issue</th>
                                    <th>Expiry</th>
                                    <th>Visibility</th>
                                    <th className="text-end">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="erp-cell-strong">
                                      <button
                                        type="button"
                                        className="erp-link erp-link-plain"
                                        data-docview
                                        onClick={() => setDocViewOpen(true)}
                                      >
                                        <i className="fa-solid fa-file-pdf me-1" />
                                        Insurance — {equipment.code}
                                      </button>
                                      <span className="erp-identity-meta d-block" />
                                    </td>
                                    <td>INS-138570</td>
                                    <td>—</td>
                                    <td>30 Sep 2026</td>
                                    <td>
                                      <span className="erp-pill is-available">30 Sep 2027</span>
                                    </td>
                                    <td>
                                      <span className="erp-pill is-neutral">Internal</span>
                                    </td>
                                    <td className="text-end text-nowrap">
                                      <button
                                        type="button"
                                        className="btn btn-erp-ghost btn-sm"
                                        title="Preview"
                                        data-docview
                                        onClick={() => setDocViewOpen(true)}
                                      >
                                        <i className="fa-solid fa-eye" />
                                      </button>
                                      <a
                                        href={`/storage/demo/equipment/${equipment.code}-insurance.pdf`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-erp-ghost btn-sm"
                                        title="Open in a new tab"
                                      >
                                        <i className="fa-solid fa-up-right-from-square" />
                                      </a>
                                      <button
                                        type="button"
                                        className="btn btn-erp-ghost btn-sm"
                                        title="Edit details"
                                        data-docm-edit
                                        onClick={() => setDocModalOpen(true)}
                                      >
                                        <i className="fa-solid fa-pen" />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-erp-ghost btn-sm text-danger"
                                        title="Remove"
                                        data-docm-delete
                                      >
                                        <i className="fa-solid fa-trash-can" />
                                      </button>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`modal fade ${docModalOpen ? "show d-block" : ""}`}
                          id="docmModal"
                          tabIndex={-1}
                          aria-hidden={!docModalOpen}
                          style={docModalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
                        >
                          <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                              <form
                                data-docm-form
                                encType="multipart/form-data"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  setDocModalOpen(false);
                                }}
                              >
                                <div className="modal-header border-0 px-4 pt-4 pb-0">
                                  <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>
                                    <i className="fa-solid fa-paperclip me-2 text-muted" />
                                    <span data-docm-modal-title>Add Document</span>
                                  </h5>
                                  <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                    onClick={() => setDocModalOpen(false)}
                                  />
                                </div>
                                <div className="modal-body p-4">
                                  <div data-docm-file-field className="erp-field mb-3">
                                    <label className="form-label">
                                      File <span className="erp-required">*</span>
                                    </label>
                                    <input
                                      type="file"
                                      name="documents[]"
                                      className="form-control"
                                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.zip,.txt,.csv,.dwg"
                                      data-docm-file
                                    />
                                  </div>
                                  <div className="row">
                                    <div className="col-md-8">
                                      <div className="erp-field">
                                        <label className="form-label">Title</label>
                                        <input
                                          type="text"
                                          className="form-control"
                                          data-docm-field="title"
                                          maxLength={190}
                                          placeholder="e.g. Development Agreement Deed"
                                        />
                                      </div>
                                    </div>
                                    <div className="col-md-4">
                                      <div className="erp-field">
                                        <label className="form-label">Document No</label>
                                        <input type="text" className="form-control" data-docm-field="document_no" maxLength={100} />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="row">
                                    <div className="col-md-4">
                                      <div className="erp-field">
                                        <label className="form-label">Issued By</label>
                                        <input type="text" className="form-control" data-docm-field="issued_by" maxLength={190} />
                                      </div>
                                    </div>
                                    <div className="col-md-4">
                                      <div className="erp-field">
                                        <label className="form-label">Issue Date</label>
                                        <input type="date" className="form-control" data-docm-field="issue_date" />
                                      </div>
                                    </div>
                                    <div className="col-md-4">
                                      <div className="erp-field">
                                        <label className="form-label">Expiry Date</label>
                                        <input type="date" className="form-control" data-docm-field="expiry_date" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="erp-field">
                                    <label className="form-label d-block">
                                      Visibility{" "}
                                      <span className="text-muted" style={{ fontWeight: 400 }}>
                                        — leave all unticked for every staff member
                                      </span>
                                    </label>
                                    <div className="d-flex flex-wrap gap-3">
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          value="management"
                                          id="docm-vis-management"
                                          data-docm-visibility
                                        />
                                        <label className="form-check-label" htmlFor="docm-vis-management">
                                          Management
                                        </label>
                                      </div>
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          value="accounts"
                                          id="docm-vis-accounts"
                                          data-docm-visibility
                                        />
                                        <label className="form-check-label" htmlFor="docm-vis-accounts">
                                          Accounts
                                        </label>
                                      </div>
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          value="legal"
                                          id="docm-vis-legal"
                                          data-docm-visibility
                                        />
                                        <label className="form-check-label" htmlFor="docm-vis-legal">
                                          Legal
                                        </label>
                                      </div>
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          value="general"
                                          id="docm-vis-general"
                                          data-docm-visibility
                                        />
                                        <label className="form-check-label" htmlFor="docm-vis-general">
                                          General Staff
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="modal-footer border-0 px-4 pb-4 pt-0">
                                  <button
                                    type="button"
                                    className="btn btn-erp-ghost"
                                    data-bs-dismiss="modal"
                                    onClick={() => setDocModalOpen(false)}
                                  >
                                    Cancel
                                  </button>
                                  <button type="submit" className="btn btn-erp" data-docm-submit>
                                    Save
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`modal fade ${docViewOpen ? "show d-block" : ""}`}
                          id="docViewerModal"
                          tabIndex={-1}
                          aria-hidden={!docViewOpen}
                          aria-labelledby="docViewerTitle"
                          style={docViewOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
                        >
                          <div className="modal-dialog modal-xl modal-dialog-centered">
                            <div className="modal-content erp-docview">
                              <div className="modal-header">
                                <div className="erp-docview-head">
                                  <i className="fa-solid fa-file-lines" data-docview-icon />
                                  <div>
                                    <h5 id="docViewerTitle" data-docview-title>
                                      Document
                                    </h5>
                                    <span className="erp-docview-sub" data-docview-meta />
                                  </div>
                                </div>

                                <div className="erp-docview-tools">
                                  <a href="#" className="btn btn-erp-ghost btn-sm" target="_blank" rel="noopener noreferrer" data-docview-open>
                                    <i className="fa-solid fa-up-right-from-square me-1" />
                                    New tab
                                  </a>
                                  <a href="#" className="btn btn-erp-ghost btn-sm" download data-docview-download>
                                    <i className="fa-solid fa-download me-1" />
                                    Download
                                  </a>
                                  <button
                                    type="button"
                                    className="btn-close ms-1"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                    onClick={() => setDocViewOpen(false)}
                                  />
                                </div>
                              </div>

                              <div className="modal-body p-0">
                                <div className="erp-docview-stage" data-docview-stage />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {[
                    { key: "calibration", icon: "fa-solid fa-ruler", label: "Calibration certificate", hasExpiryHint: true },
                    { key: "load_test", icon: "fa-solid fa-weight-hanging", label: "Load test certificate", hasExpiryHint: true },
                    { key: "warranty", icon: "fa-solid fa-award", label: "Warranty", hasExpiryHint: true },
                    { key: "purchase_document", icon: "fa-solid fa-file-invoice", label: "Purchase document", hasExpiryHint: false },
                  ].map((paper) => (
                    <div key={paper.key} className="accordion-item">
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${openAccordion === paper.key ? "" : "collapsed"}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#paper-${paper.key}`}
                          aria-expanded={openAccordion === paper.key}
                          aria-controls={`paper-${paper.key}`}
                          onClick={() => setOpenAccordion(openAccordion === paper.key ? "" : paper.key)}
                        >
                          <i className={`${paper.icon} me-2`} />
                          <span className="flex-grow-1">{paper.label}</span>
                          <span className="erp-identity-meta me-2">nothing on file</span>
                        </button>
                      </h2>

                      <div
                        id={`paper-${paper.key}`}
                        className={`accordion-collapse collapse ${openAccordion === paper.key ? "show" : ""}`}
                        data-bs-parent="#paperAccordion"
                      >
                        <div className="accordion-body">
                          {paper.hasExpiryHint && (
                            <div className="form-text mb-2">
                              Set the <strong>expiry date</strong> when you upload. It will appear on the expiry report 30 days before it lapses.
                            </div>
                          )}

                          <div className="erp-docm" data-doc-manager data-type="equipment" data-id={equipment.id} data-collection={paper.key}>
                            <div className="d-flex justify-content-end mb-2">
                              <button
                                type="button"
                                className="btn btn-erp btn-sm"
                                data-docm-add
                                onClick={() => setDocModalOpen(true)}
                              >
                                <i className="fa-solid fa-upload me-1" />
                                Add Document
                              </button>
                            </div>

                            <div data-docm-list>
                              <p className="erp-cv-empty mb-0">No documents yet.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div
        className={`modal fade ${planOpen ? "show d-block" : ""}`}
        id="planModal"
        tabIndex={-1}
        aria-hidden={!planOpen}
        style={planOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
      >
        <div className="modal-dialog modal-lg">
          <form
            method="POST"
            action={`/equipment/register/${equipment.id}/maintenance-plans`}
            className="modal-content"
            onSubmit={(e) => {
              e.preventDefault();
              setPlanOpen(false);
            }}
          >
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fa-solid fa-calendar-check me-2" />
                Schedule a service
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setPlanOpen(false)}
              />
            </div>
            <div className="modal-body">
              <div className="erp-callout">
                <i className="fa-solid fa-circle-info me-1" />
                <span>
                  Set any of the three intervals. Whichever falls due <strong>first</strong> wins —
                  a machine on double shifts needs its hours service in a fortnight, and one parked
                  in salt air needs its annual whether it moved or not.
                </span>
              </div>

              <div className="row g-3 mt-1">
                <div className="col-md-8">
                  <label className="form-label" htmlFor="planName">
                    What it is <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="planName"
                    name="name"
                    className="form-control"
                    required
                    maxLength={150}
                    placeholder="250-hour service"
                    defaultValue=""
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="planType">
                    Kind
                  </label>
                  <select id="planType" name="service_type" className="form-select" defaultValue="routine">
                    <option value="routine">Routine service</option>
                    <option value="major">Major service</option>
                    <option value="statutory">Statutory inspection</option>
                    <option value="calibration">Calibration</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label" htmlFor="intervalHours">
                    Every (hours)
                  </label>
                  <input type="number" min="1" id="intervalHours" name="interval_hours" className="form-control" defaultValue="250" />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="intervalKm">
                    Every (km)
                  </label>
                  <input type="number" min="1" id="intervalKm" name="interval_km" className="form-control" defaultValue="" />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="intervalDays">
                    Every (days)
                  </label>
                  <input type="number" min="1" id="intervalDays" name="interval_days" className="form-control" defaultValue="180" />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="lastServiceDate">
                    Last done on
                  </label>
                  <input type="date" id="lastServiceDate" name="last_service_date" className="form-control" defaultValue="2026-11-17" />
                  <div className="form-text">
                    The clock starts here. A machine bought at 1,200 hours does not want its first
                    service at 250.
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="planCost">
                    Expected cost
                  </label>
                  <input type="number" step="0.01" min="0" id="planCost" name="estimated_cost" className="form-control" />
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="planDowntime">
                    Expected downtime
                  </label>
                  <div className="input-group">
                    <input type="number" min="0" id="planDowntime" name="estimated_downtime_hours" className="form-control" />
                    <span className="input-group-text">hr</span>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="planChecklist">
                    Checklist
                  </label>
                  <textarea
                    id="planChecklist"
                    name="checklist"
                    className="form-control"
                    rows={3}
                    placeholder="Oil and filter, grease all points, check track tension…"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setPlanOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" data-submit-button>
                <i className="fa-solid fa-check me-2" />
                Schedule
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className={`modal fade ${disposeOpen ? "show d-block" : ""}`}
        id="disposeModal"
        tabIndex={-1}
        aria-hidden={!disposeOpen}
        style={disposeOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
      >
        <div className="modal-dialog">
          <form method="POST" action={`/equipment/register/${equipment.id}/dispose`} className="modal-content" onSubmit={handleDispose}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fa-solid fa-box-archive me-2" />
                Dispose of {equipment.code}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setDisposeOpen(false)}
              />
            </div>
            <div className="modal-body">
              <div className="erp-callout">
                <i className="fa-solid fa-circle-info me-1" />
                <span>
                  The books currently say this machine is worth{" "}
                  <strong>{equipment.acquisitionCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
                  The difference between that and what it sells for is posted as a gain or loss — it is the only honest feedback
                  a depreciation policy ever gets.
                </span>
              </div>

              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="disposalAmount">
                    Sold for <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="disposalAmount"
                    name="disposal_amount"
                    className="form-control"
                    required
                    value={disposeForm.disposal_amount}
                    onChange={(e) => setDisposeForm({ ...disposeForm, disposal_amount: e.target.value })}
                    data-nbv={equipment.acquisitionCost}
                    data-disposal-amount
                  />
                  <div className="form-text" data-disposal-result />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="disposedOn">
                    Disposed on <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    id="disposedOn"
                    name="disposed_on"
                    className="form-control"
                    required
                    value={disposeForm.disposed_on}
                    onChange={(e) => setDisposeForm({ ...disposeForm, disposed_on: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="disposalReference">
                    Reference
                  </label>
                  <input
                    type="text"
                    id="disposalReference"
                    name="disposal_reference"
                    className="form-control"
                    maxLength={120}
                    placeholder="Sale invoice or scrap note"
                    value={disposeForm.disposal_reference}
                    onChange={(e) => setDisposeForm({ ...disposeForm, disposal_reference: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setDisposeOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
                <i className="fa-solid fa-check me-2" />
                Dispose and write off
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
