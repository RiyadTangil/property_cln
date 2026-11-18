"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal } from "@/components/ui";
import { downloadCsv } from "@/lib/csv-client";

interface BoqRow {
  id: number;
  projectId: number | null;
  scopeId: number | null;
  version: string;
  title: string;
  effectiveDate: string | null;
  measurementStandard: string;
  currency: string;
  status: string;
  totalAmount: number;
  scope: { code: string; name: string } | null;
}

const TRADE_GROUPS: { prefix: string; label: string }[] = [
  { prefix: "PRE", label: "Preliminaries & Site Works" },
  { prefix: "SUB", label: "Substructure & Foundation" },
  { prefix: "STR", label: "Structure" },
  { prefix: "ARC", label: "Architectural & Finishes" },
  { prefix: "INT", label: "Interior Fit-Out" },
  { prefix: "PLB", label: "Plumbing & Public Health" },
  { prefix: "ELE", label: "Electrical" },
  { prefix: "ELV", label: "Extra-Low Voltage & ICT" },
  { prefix: "FIR", label: "Fire Protection" },
  { prefix: "MEC", label: "Mechanical & HVAC" },
  { prefix: "VTR", label: "Vertical Transportation" },
  { prefix: "EXT", label: "External Works & Infrastructure" },
  { prefix: "SPC", label: "Specialist Systems" },
  { prefix: "TST", label: "Testing, Commissioning & Handover" },
];

const MEASUREMENT_STANDARDS = [
  {
    value: "nrm2",
    label: "NRM2 — New Rules of Measurement 2",
    hint: "Building work. The current UK standard and the usual default.",
  },
  {
    value: "smm7",
    label: "SMM7 — Standard Method of Measurement 7",
    hint: "Building work, superseded by NRM2 but still in wide use.",
  },
  {
    value: "cesmm4",
    label: "CESMM4 — Civil Engineering SMM 4",
    hint: "Civil engineering — roads, drainage, structures.",
  },
  {
    value: "pomi",
    label: "POMI — Principles of Measurement (International)",
    hint: "International contracts, common on donor-funded work.",
  },
  {
    value: "pwd_schedule",
    label: "PWD Schedule of Rates",
    hint: "Government work measured to the public works schedule.",
  },
  {
    value: "custom",
    label: "Custom — measured to the project preamble",
    hint: "The bill carries its own preamble defining the rules.",
  },
];

const CURRENCIES = [
  "AED", "AUD", "BDT", "BHD", "BRL", "CAD", "CHF", "CNY", "DKK", "EGP",
  "EUR", "GBP", "HKD", "IDR", "ILS", "INR", "JPY", "KES", "KRW", "KWD",
  "LKR", "MAD", "MVR", "MYR", "NGN", "NOK", "NPR", "NZD", "OMR", "PHP",
  "PKR", "PLN", "QAR", "RUB", "SAR", "SEK", "SGD", "THB", "TRY", "TWD",
  "USD", "VND", "ZAR",
];

const AREA_BASIS_HINTS: Record<string, string> = {
  "": "Optional. Leave this blank and the bill simply shows no rate per square foot.",
  saleable:
    "What is sold to buyers. Compares directly against the selling price per sft, so this is the basis to use when the question is margin.",
  built_up:
    "Everything constructed, including common areas, cores and services. The honest denominator for a construction cost, and always the larger area — so it gives the lower, more conservative rate.",
  land: "The plot itself. For land cost and FAR arithmetic rather than construction.",
  custom:
    "A figure agreed for this bill alone — a podium, a phase, or the part of a tower this package covers.",
};

export function BoqsClient({
  boqs: initial,
  projects,
  scopes,
}: {
  boqs: BoqRow[];
  projects: { id: number; code: string; name: string }[];
  scopes: { id: number; code: string; name: string }[];
}) {
  const router = useRouter();
  const [boqs, setBoqs] = useState(initial);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [standardInfoOpen, setStandardInfoOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BoqRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copySearch, setCopySearch] = useState("");
  const [copyFromBoqId, setCopyFromBoqId] = useState("");

  const [form, setForm] = useState({
    project_id: "",
    scope_id: "",
    version: "",
    title: "",
    effective_date: "2026-11-17",
    measurement_standard: "nrm2",
    currency: "BDT",
    tax_percent: "",
    contingency_percent: "",
    area_basis: "",
    area_value: "",
    area_uom: "sft",
    start_from: "blank",
    notes: "",
  });

  const filtered = boqs.filter((b) => {
    if (projectFilter && String(b.projectId ?? "") !== projectFilter) return false;
    if (scopeFilter && String(b.scopeId ?? "") !== scopeFilter) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    if (
      search &&
      !b.title.toLowerCase().includes(search.toLowerCase()) &&
      !b.version.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const groupedScopes = TRADE_GROUPS.map((g) => ({
    label: g.label,
    items: scopes.filter((s) => s.code.toUpperCase().startsWith(g.prefix)),
  })).filter((g) => g.items.length > 0);

  const ungroupedScopes = scopes.filter(
    (s) => !TRADE_GROUPS.some((g) => s.code.toUpperCase().startsWith(g.prefix))
  );

  const selectedStandardObj =
    MEASUREMENT_STANDARDS.find((s) => s.value === form.measurement_standard) ??
    MEASUREMENT_STANDARDS[0];

  const areaHint = AREA_BASIS_HINTS[form.area_basis] ?? AREA_BASIS_HINTS[""];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setBusy(true);
    try {
      const effectiveTitle =
        form.title.trim() ||
        (form.project_id
          ? `${projects.find((p) => String(p.id) === form.project_id)?.name ?? "Project"} — ${form.version || "v1.0"}`
          : "Main Works — Tender Issue");
      const res = await fetch("/api/construction/boqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title: effectiveTitle,
          version: form.version.trim() || "v1.0",
          project_id: form.project_id ? Number(form.project_id) : null,
          scope_id: form.scope_id ? Number(form.scope_id) : null,
          tax_percent: Number(form.tax_percent) || 0,
          contingency_percent: Number(form.contingency_percent) || 0,
          area_value: form.area_value ? Number(form.area_value) : null,
          copy_from_boq_id: copyFromBoqId ? Number(copyFromBoqId) : null,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        const matchedScope = scopes.find((s) => String(s.id) === form.scope_id) ?? null;
        setBoqs((prev) => [{ ...d.boq, scope: matchedScope }, ...prev]);
        setModalOpen(false);
        setStandardInfoOpen(false);
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || "Failed to create bill of quantities.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/construction/boqs/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBoqs((prev) => prev.filter((x) => x.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const renderScopeOptions = () => (
    <>
      {groupedScopes.map((grp) => (
        <optgroup key={grp.label} label={grp.label}>
          {grp.items.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name}
            </option>
          ))}
        </optgroup>
      ))}
      {ungroupedScopes.map((s) => (
        <option key={s.id} value={s.id}>
          {s.code} — {s.name}
        </option>
      ))}
    </>
  );

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-list-check" />
          </div>
          <div>
            <h1>Bills of Quantities</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="/dashboard">Home</a>
                </li>
                <li className="breadcrumb-item">Procurement</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Bills of Quantities
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
                "boqs.csv",
                ["Title", "Version", "Standard", "Currency", "Total", "Status"],
                filtered.map((b) => [
                  b.title,
                  b.version,
                  b.measurementStandard,
                  b.currency,
                  b.totalAmount,
                  b.status,
                ])
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
            data-bs-target="#boqCreateModal"
            onClick={() => setModalOpen(true)}
          >
            <i className="fa-solid fa-plus me-2" />
            New Bill
          </button>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-card-head">
          <form
            method="GET"
            action="/boqs"
            className="erp-filter-grid"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-search erp-search-sm erp-filter-wide">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by version or title…"
                aria-label="Search"
              />
            </div>
            <select
              name="project_id"
              className="erp-select"
              data-select2
              data-placeholder="Project"
              aria-label="Project"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="">Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              name="scope_id"
              className="erp-select"
              data-select2
              data-placeholder="Work package"
              aria-label="Work package"
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
            >
              <option value="">Work package</option>
              {renderScopeOptions()}
            </select>
            <select
              name="status"
              className="erp-select"
              data-select2
              data-placeholder="Status"
              aria-label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="active">Approved</option>
              <option value="superseded">Superseded</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="erp-filter-actions">
              <button type="submit" className="btn btn-erp btn-sm">
                <i className="fa-solid fa-filter me-1" />
                Filter
              </button>
            </div>
          </form>
        </div>

        {filtered.length === 0 ? (
          <div className="erp-card-body">
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-list-check" />
              </div>
              <h3>No bills yet</h3>
              <p>
                A bill of quantities is what a project was estimated to need. It is the figure that
                consumption on site is measured against.
              </p>
              <button
                type="button"
                className="btn btn-erp"
                data-bs-toggle="modal"
                data-bs-target="#boqCreateModal"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-plus me-2" />
                Create the first one
              </button>
            </div>
          </div>
        ) : (
          <div className="erp-table-wrap">
            <table className="table erp-table mb-0">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Name</th>
                  <th>Project</th>
                  <th>Work package</th>
                  <th>Standard</th>
                  <th className="text-end">Total</th>
                  <th>Status</th>
                  <th style={{ width: 90 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const proj = projects.find((p) => p.id === b.projectId);
                  return (
                    <tr key={b.id}>
                      <td className="erp-cell-strong">{b.version}</td>
                      <td>{b.title}</td>
                      <td>{proj ? proj.name : "—"}</td>
                      <td>{b.scope ? `${b.scope.code} — ${b.scope.name}` : "—"}</td>
                      <td className="text-uppercase">{b.measurementStandard}</td>
                      <td className="text-end">
                        {b.currency} {b.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className="erp-pill is-neutral text-capitalize">{b.status}</span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(b)}
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
        )}
      </div>

      <div
        className={`modal fade ${modalOpen ? "show d-block" : ""}`}
        id="boqCreateModal"
        tabIndex={-1}
        aria-hidden={!modalOpen}
        style={modalOpen ? { background: "rgba(0,0,0,0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <form
            className="modal-content erp-form"
            data-boq-create
            action="/boqs"
            data-version-url="/boqs/suggest-version"
            data-sources-url="/boqs/copy-sources"
            data-documents-url="/boqs/project-documents"
            data-areas-url="/boqs/project-areas"
            noValidate
            onSubmit={handleCreate}
          >
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fa-solid fa-list-check me-2" />
                New Bill of Quantities
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  setModalOpen(false);
                  setStandardInfoOpen(false);
                }}
              />
            </div>

            <div className="modal-body">
              <div className="erp-formgroup-head">The bill</div>

              <div className="row">
                <div className="col-md-7">
                  <div className="erp-field">
                    <label htmlFor="boq_project" className="form-label">
                      Project <span className="erp-required">*</span>
                    </label>
                    <select
                      id="boq_project"
                      name="project_id"
                      className="form-select"
                      required
                      data-select2
                      data-placeholder="Select project"
                      data-dropdown-parent="#boqCreateModal"
                      data-boq-project
                      value={form.project_id}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const count = boqs.filter((b) => String(b.projectId ?? "") === pid).length;
                        setForm({
                          ...form,
                          project_id: pid,
                          version: pid && !form.version ? `R${count}` : form.version,
                        });
                      }}
                    >
                      <option value="">Select project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <span className="erp-help">
                      Preselected when you open this from inside a project, and still changeable.
                    </span>
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="erp-field">
                    <label htmlFor="boq_version" className="form-label">
                      Version <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="boq_version"
                      name="version"
                      className="form-control"
                      maxLength={20}
                      required
                      data-boq-version
                      placeholder="Pick a project first"
                      value={form.version}
                      onChange={(e) => setForm({ ...form, version: e.target.value })}
                    />
                    <span className="erp-help" data-boq-version-hint>
                      Suggested from this project&apos;s existing bills.
                    </span>
                  </div>
                </div>

                <div className="col-md-8">
                  <div className="erp-field">
                    <label htmlFor="boq_title" className="form-label">
                      Name
                    </label>
                    <input
                      type="text"
                      id="boq_title"
                      name="title"
                      className="form-control"
                      maxLength={190}
                      placeholder="Main Works — Tender Issue"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                    <span className="erp-help">
                      What this bill is for, in the words a tender letter would use.
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="boq_effective" className="form-label">
                      Effective date
                    </label>
                    <input
                      type="date"
                      id="boq_effective"
                      name="effective_date"
                      className="form-control"
                      value={form.effective_date}
                      onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="erp-formgroup-head">Measurement &amp; pricing</div>

              <div className="row">
                <div className="col-md-12">
                  <div className="erp-field">
                    <label
                      htmlFor="boq_standard"
                      className="form-label tw:flex tw:items-center tw:gap-1.5"
                    >
                      <span>
                        Measurement standard <span className="erp-required">*</span>
                      </span>
                      <button
                        type="button"
                        className="erp-infobtn"
                        data-standard-info-open
                        aria-controls="boqStandardInfo"
                        aria-expanded={standardInfoOpen}
                        aria-label="About the measurement standards"
                        title="Which standard should I pick?"
                        onClick={() => setStandardInfoOpen(true)}
                      >
                        <i className="fa-solid fa-circle-info" />
                      </button>
                    </label>
                    <select
                      id="boq_standard"
                      name="measurement_standard"
                      className="form-select"
                      required
                      data-select2
                      data-dropdown-parent="#boqCreateModal"
                      value={form.measurement_standard}
                      onChange={(e) => setForm({ ...form, measurement_standard: e.target.value })}
                    >
                      {MEASUREMENT_STANDARDS.map((s) => (
                        <option key={s.value} value={s.value} data-hint={s.hint}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <span className="erp-help" data-boq-standard-hint>
                      {selectedStandardObj.hint}
                    </span>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="boq_currency" className="form-label">
                      Currency <span className="erp-required">*</span>
                    </label>
                    <select
                      id="boq_currency"
                      name="currency"
                      className="form-select"
                      required
                      data-select2
                      data-dropdown-parent="#boqCreateModal"
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="boq_tax" className="form-label">
                      Tax / VAT %
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="100"
                      id="boq_tax"
                      name="tax_percent"
                      className="form-control"
                      placeholder="0"
                      value={form.tax_percent}
                      onChange={(e) => setForm({ ...form, tax_percent: e.target.value })}
                    />
                    <span className="erp-help">The rate in force for this bill.</span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="boq_contingency" className="form-label">
                      Contingency %
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="100"
                      id="boq_contingency"
                      name="contingency_percent"
                      className="form-control"
                      placeholder="0"
                      value={form.contingency_percent}
                      onChange={(e) => setForm({ ...form, contingency_percent: e.target.value })}
                    />
                    <span className="erp-help">Added on the summary, not into the rates.</span>
                  </div>
                </div>

                <div className="col-md-5">
                  <div className="erp-field">
                    <label htmlFor="boq_area_basis" className="form-label">
                      Cost per sft is divided by
                    </label>
                    <select
                      id="boq_area_basis"
                      name="area_basis"
                      className="form-select"
                      data-boq-area-basis
                      data-select2
                      data-dropdown-parent="#boqCreateModal"
                      value={form.area_basis}
                      onChange={(e) => setForm({ ...form, area_basis: e.target.value })}
                    >
                      <option value="">— no rate per sft —</option>
                      <option value="saleable" data-hint={AREA_BASIS_HINTS.saleable}>
                        Saleable area
                      </option>
                      <option value="built_up" data-hint={AREA_BASIS_HINTS.built_up}>
                        Built-up area
                      </option>
                      <option value="land" data-hint={AREA_BASIS_HINTS.land}>
                        Land area
                      </option>
                      <option value="custom" data-hint={AREA_BASIS_HINTS.custom}>
                        Custom area
                      </option>
                    </select>
                    <span className="erp-help" data-boq-area-hint>
                      {areaHint}
                    </span>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="boq_area_value" className="form-label">
                      Area
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="boq_area_value"
                        name="area_value"
                        className="form-control"
                        placeholder="0.00"
                        data-boq-area-value
                        value={form.area_value}
                        onChange={(e) => setForm({ ...form, area_value: e.target.value })}
                      />
                      <select
                        name="area_uom"
                        className="form-select"
                        style={{ maxWidth: 86 }}
                        data-boq-area-uom
                        aria-label="Area unit"
                        value={form.area_uom}
                        onChange={(e) => setForm({ ...form, area_uom: e.target.value })}
                      >
                        <option value="sft">sft</option>
                        <option value="sqm">sqm</option>
                      </select>
                    </div>
                    <span className="erp-help" data-boq-area-source>
                      Picked up from the project&apos;s building design once you choose a project.
                    </span>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">Suggested</label>
                    <div className="erp-boq-areahints" data-boq-area-suggestions>
                      <span className="erp-help">—</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="erp-formgroup-head">Start from</div>

              <div className="erp-startfrom" data-boq-startfrom>
                <label className="erp-startfrom-opt">
                  <input
                    type="radio"
                    name="start_from"
                    value="blank"
                    checked={form.start_from === "blank"}
                    onChange={(e) => setForm({ ...form, start_from: e.target.value })}
                  />
                  <span className="erp-startfrom-body">
                    <strong>
                      <i className="fa-regular fa-file me-1" />
                      Blank
                    </strong>
                    <span>Build the sections yourself.</span>
                  </span>
                </label>
                <label className="erp-startfrom-opt">
                  <input
                    type="radio"
                    name="start_from"
                    value="template"
                    checked={form.start_from === "template"}
                    onChange={(e) => setForm({ ...form, start_from: e.target.value })}
                  />
                  <span className="erp-startfrom-body">
                    <strong>
                      <i className="fa-solid fa-layer-group me-1" />
                      Template
                    </strong>
                    <span>Open with a work package as the first section.</span>
                  </span>
                </label>
                <label className="erp-startfrom-opt">
                  <input
                    type="radio"
                    name="start_from"
                    value="copy"
                    checked={form.start_from === "copy"}
                    onChange={(e) => setForm({ ...form, start_from: e.target.value })}
                  />
                  <span className="erp-startfrom-body">
                    <strong>
                      <i className="fa-solid fa-clone me-1" />
                      Copy a bill
                    </strong>
                    <span>Every line and its rate build-up, from any project.</span>
                  </span>
                </label>
                <label className="erp-startfrom-opt">
                  <input
                    type="radio"
                    name="start_from"
                    value="import"
                    checked={form.start_from === "import"}
                    onChange={(e) => setForm({ ...form, start_from: e.target.value })}
                  />
                  <span className="erp-startfrom-body">
                    <strong>
                      <i className="fa-solid fa-file-excel me-1" />
                      Import a takeoff sheet
                    </strong>
                    <span>
                      Save your sheet as CSV. Columns can be in any order — you confirm the mapping
                      before anything is written.
                    </span>
                  </span>
                </label>
              </div>

              <div
                className="erp-field mt-2"
                data-boq-pane="template"
                hidden={form.start_from !== "template"}
              >
                <label htmlFor="boq_scope" className="form-label">
                  Work package
                </label>
                <select
                  id="boq_scope"
                  name="scope_id"
                  className="form-select"
                  data-select2
                  data-placeholder="Whole project — all packages"
                  data-dropdown-parent="#boqCreateModal"
                  data-allow-clear="1"
                  value={form.scope_id}
                  onChange={(e) => setForm({ ...form, scope_id: e.target.value })}
                >
                  <option value="">Whole project — all packages</option>
                  {renderScopeOptions()}
                </select>
                <span className="erp-help">Its name becomes the bill&apos;s opening section.</span>
              </div>

              <div
                className="erp-field mt-2"
                data-boq-pane="copy"
                hidden={form.start_from !== "copy"}
              >
                <label htmlFor="boq_copy_search" className="form-label">
                  Bill to copy <span className="erp-required">*</span>
                </label>
                <input
                  type="search"
                  id="boq_copy_search"
                  className="form-control mb-2"
                  placeholder="Search by version, name or project…"
                  autoComplete="off"
                  data-boq-copy-search
                  value={copySearch}
                  onChange={(e) => setCopySearch(e.target.value)}
                />
                <div className="erp-boq-sources" data-boq-sources>
                  {boqs.length === 0 ? (
                    <p className="erp-help mb-0">No existing bills found.</p>
                  ) : (
                    boqs
                      .filter(
                        (b) =>
                          !copySearch ||
                          b.title.toLowerCase().includes(copySearch.toLowerCase()) ||
                          b.version.toLowerCase().includes(copySearch.toLowerCase())
                      )
                      .map((b) => (
                        <div
                          key={b.id}
                          className={`p-2 border-bottom ${String(b.id) === copyFromBoqId ? "bg-light fw-semibold" : ""}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => setCopyFromBoqId(String(b.id))}
                        >
                          {b.version} — {b.title}
                        </div>
                      ))
                  )}
                </div>
                <input type="hidden" name="copy_from_boq_id" data-boq-copy-id value={copyFromBoqId} />
                <span className="erp-help">
                  Copied as a new bill on the project above — not as a revision of the one it came
                  from.
                </span>
              </div>

              <div className="erp-formgroup-head">Based on</div>

              <div className="erp-field">
                <label className="form-label">Drawings &amp; specifications</label>
                <div className="erp-boq-docs" data-boq-documents>
                  <p className="erp-help mb-0">
                    {form.project_id
                      ? "No documents uploaded for this project yet."
                      : "Pick a project to list its documents."}
                  </p>
                </div>
                <span className="erp-help">
                  Cited, not copied — they stay the project&apos;s documents. This records which of
                  them the quantities were measured from.
                </span>
              </div>

              <div className="erp-field mb-0">
                <label htmlFor="boq_notes" className="form-label">
                  Notes
                </label>
                <textarea
                  id="boq_notes"
                  name="notes"
                  className="form-control"
                  rows={2}
                  maxLength={2000}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div
                className="alert alert-danger mt-2 mb-0"
                data-boq-error
                hidden={!errorMsg}
                style={{ fontSize: "12.5px" }}
              >
                {errorMsg}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => {
                  setModalOpen(false);
                  setStandardInfoOpen(false);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
                <i className="fa-solid fa-arrow-right me-2" />
                Create &amp; add lines
              </button>
            </div>
          </form>
        </div>

        <div
          className="erp-sidenote-scrim"
          data-standard-info-scrim
          hidden={!standardInfoOpen}
          onClick={() => setStandardInfoOpen(false)}
        />

        <aside
          className="erp-sidenote"
          id="boqStandardInfo"
          data-standard-info
          role="dialog"
          aria-modal="true"
          aria-labelledby="boqStandardInfoTitle"
          tabIndex={-1}
          hidden={!standardInfoOpen}
        >
          <header className="erp-sidenote-head">
            <div className="tw:min-w-0">
              <strong
                id="boqStandardInfoTitle"
                className="tw:block tw:text-[14px] tw:leading-tight tw:text-ink"
              >
                Which measurement standard?
              </strong>
              <span className="tw:text-[11.5px] tw:text-muted">
                It decides what every quantity in this bill means. Pick it before measuring, not
                after.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-erp-ghost btn-sm"
              data-standard-info-close
              aria-label="Close"
              title="Close (Esc)"
              onClick={() => setStandardInfoOpen(false)}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </header>

          <div className="erp-sidenote-body">
            <section className="tw:mb-3 tw:rounded-erp tw:border tw:border-brand-ring tw:bg-brand-soft tw:px-3 tw:py-2.5">
              <h6 className="tw:mb-1.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-muted">
                What to choose
              </h6>
              <dl className="tw:m-0 tw:grid tw:grid-cols-[1fr_auto] tw:gap-x-3 tw:gap-y-1">
                <dt className="tw:text-[12px] tw:text-ink">Residential building</dt>
                <dd className="tw:m-0 tw:text-right tw:text-[12px] tw:font-semibold tw:text-ink">
                  NRM2
                </dd>
                <dt className="tw:text-[12px] tw:text-ink">Commercial building</dt>
                <dd className="tw:m-0 tw:text-right tw:text-[12px] tw:font-semibold tw:text-ink">
                  NRM2
                </dd>
                <dt className="tw:text-[12px] tw:text-ink">Government building work</dt>
                <dd className="tw:m-0 tw:text-right tw:text-[12px] tw:font-semibold tw:text-ink">
                  PWD SoR
                </dd>
                <dt className="tw:text-[12px] tw:text-ink">Roads and drainage</dt>
                <dd className="tw:m-0 tw:text-right tw:text-[12px] tw:font-semibold tw:text-ink">
                  CESMM4
                </dd>
                <dt className="tw:text-[12px] tw:text-ink">International contracts</dt>
                <dd className="tw:m-0 tw:text-right tw:text-[12px] tw:font-semibold tw:text-ink">
                  POMI
                </dd>
                <dt className="tw:text-[12px] tw:text-ink">Older contracts</dt>
                <dd className="tw:m-0 tw:text-right tw:text-[12px] tw:font-semibold tw:text-ink">
                  SMM7
                </dd>
                <dt className="tw:text-[12px] tw:text-ink">Developer’s own BOQ rules</dt>
                <dd className="tw:m-0 tw:text-right tw:text-[12px] tw:font-semibold tw:text-ink">
                  Custom
                </dd>
              </dl>
            </section>

            <h6 className="tw:mb-1.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-muted">
              The standards in full
            </h6>

            <article
              className="tw:mb-2 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:px-3 tw:py-2.5"
              data-standard-card="nrm2"
            >
              <div className="tw:mb-1 tw:flex tw:items-start tw:justify-between tw:gap-2">
                <strong className="tw:text-[12.5px] tw:leading-snug tw:text-ink">
                  NRM2 — New Rules of Measurement 2
                </strong>
                <span className="tw:shrink-0 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:whitespace-nowrap tw:bg-good-soft tw:text-good">
                  Recommended for building work
                </span>
              </div>
              <p className="tw:mb-1.5 tw:text-[11px] tw:text-muted">
                RICS (Royal Institution of Chartered Surveyors)
              </p>
              <ul className="tw:mb-1.5 tw:list-disc tw:space-y-0.5 tw:pl-4 tw:text-[11.5px] tw:text-ink">
                <li>Detailed measurement of building work.</li>
                <li>Excavation, concrete, masonry, finishes and services.</li>
                <li>Consistent rules for preparing a detailed bill of quantities.</li>
              </ul>
              <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
                <span className="tw:text-[11.5px] tw:font-medium tw:text-ink">
                  Best for residential and commercial buildings.
                </span>
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm tw:shrink-0"
                  data-standard-pick="nrm2"
                  onClick={() => {
                    setForm({ ...form, measurement_standard: "nrm2" });
                    setStandardInfoOpen(false);
                  }}
                >
                  Use this
                </button>
              </div>
            </article>

            <article
              className="tw:mb-2 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:px-3 tw:py-2.5"
              data-standard-card="smm7"
            >
              <div className="tw:mb-1 tw:flex tw:items-start tw:justify-between tw:gap-2">
                <strong className="tw:text-[12.5px] tw:leading-snug tw:text-ink">
                  SMM7 — Standard Method of Measurement 7
                </strong>
                <span className="tw:shrink-0 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:whitespace-nowrap tw:bg-warn-soft tw:text-warn">
                  Legacy
                </span>
              </div>
              <p className="tw:mb-1.5 tw:text-[11px] tw:text-muted">
                RICS (Royal Institution of Chartered Surveyors)
              </p>
              <ul className="tw:mb-1.5 tw:list-disc tw:space-y-0.5 tw:pl-4 tw:text-[11.5px] tw:text-ink">
                <li>The previous standard for measuring building work.</li>
                <li>Traditional construction bills of quantities.</li>
                <li>Still appears in older contracts and running projects.</li>
              </ul>
              <p className="tw:mb-1.5 tw:flex tw:gap-1.5 tw:rounded tw:bg-warn-soft tw:px-2 tw:py-1.5 tw:text-[11px] tw:text-ink">
                <i className="fa-solid fa-triangle-exclamation tw:mt-0.5 tw:shrink-0 tw:text-warn" />
                <span>NRM2 replaced SMM7 in 2013. Keep it only for legacy compatibility.</span>
              </p>
              <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
                <span className="tw:text-[11.5px] tw:font-medium tw:text-ink">
                  Pick it to stay compatible with a legacy project or contract.
                </span>
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm tw:shrink-0"
                  data-standard-pick="smm7"
                  onClick={() => {
                    setForm({ ...form, measurement_standard: "smm7" });
                    setStandardInfoOpen(false);
                  }}
                >
                  Use this
                </button>
              </div>
            </article>

            <article
              className="tw:mb-2 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:px-3 tw:py-2.5"
              data-standard-card="cesmm4"
            >
              <div className="tw:mb-1 tw:flex tw:items-start tw:justify-between tw:gap-2">
                <strong className="tw:text-[12.5px] tw:leading-snug tw:text-ink">
                  CESMM4 — Civil Engineering SMM 4
                </strong>
                <span className="tw:shrink-0 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:whitespace-nowrap tw:bg-info-soft tw:text-info">
                  Civil engineering
                </span>
              </div>
              <p className="tw:mb-1.5 tw:text-[11px] tw:text-muted">
                ICE (Institution of Civil Engineers)
              </p>
              <ul className="tw:mb-1.5 tw:list-disc tw:space-y-0.5 tw:pl-4 tw:text-[11.5px] tw:text-ink">
                <li>Roads and highways.</li>
                <li>Drainage and sewerage.</li>
                <li>Earthworks and excavation.</li>
                <li>Bridges and civil structures.</li>
              </ul>
              <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
                <span className="tw:text-[11.5px] tw:font-medium tw:text-ink">
                  Pick it for infrastructure and civil engineering work.
                </span>
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm tw:shrink-0"
                  data-standard-pick="cesmm4"
                  onClick={() => {
                    setForm({ ...form, measurement_standard: "cesmm4" });
                    setStandardInfoOpen(false);
                  }}
                >
                  Use this
                </button>
              </div>
            </article>

            <article
              className="tw:mb-2 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:px-3 tw:py-2.5"
              data-standard-card="pomi"
            >
              <div className="tw:mb-1 tw:flex tw:items-start tw:justify-between tw:gap-2">
                <strong className="tw:text-[12.5px] tw:leading-snug tw:text-ink">
                  POMI — Principles of Measurement (International)
                </strong>
                <span className="tw:shrink-0 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:whitespace-nowrap tw:bg-info-soft tw:text-info">
                  International contracts
                </span>
              </div>
              <p className="tw:mb-1.5 tw:text-[11px] tw:text-muted">
                RICS, for internationally comparable measurement
              </p>
              <ul className="tw:mb-1.5 tw:list-disc tw:space-y-0.5 tw:pl-4 tw:text-[11.5px] tw:text-ink">
                <li>Measurement that is comparable across countries.</li>
                <li>Work by international contractors and consultants.</li>
                <li>International tendering and donor-funded contracts.</li>
              </ul>
              <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
                <span className="tw:text-[11.5px] tw:font-medium tw:text-ink">
                  Pick it when the contract specifies POMI.
                </span>
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm tw:shrink-0"
                  data-standard-pick="pomi"
                  onClick={() => {
                    setForm({ ...form, measurement_standard: "pomi" });
                    setStandardInfoOpen(false);
                  }}
                >
                  Use this
                </button>
              </div>
            </article>

            <article
              className="tw:mb-2 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:px-3 tw:py-2.5"
              data-standard-card="pwd_schedule"
            >
              <div className="tw:mb-1 tw:flex tw:items-start tw:justify-between tw:gap-2">
                <strong className="tw:text-[12.5px] tw:leading-snug tw:text-ink">
                  PWD Schedule of Rates
                </strong>
                <span className="tw:shrink-0 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:whitespace-nowrap tw:bg-good-soft tw:text-good">
                  Bangladesh government work
                </span>
              </div>
              <p className="tw:mb-1.5 tw:text-[11px] tw:text-muted">
                Public Works Department, Government of Bangladesh
              </p>
              <ul className="tw:mb-1.5 tw:list-disc tw:space-y-0.5 tw:pl-4 tw:text-[11.5px] tw:text-ink">
                <li>Standard construction item descriptions.</li>
                <li>Government reference rates for material and labour.</li>
                <li>Unit rates for RCC, masonry, plaster, tiles and similar work.</li>
                <li>Government estimates and tender pricing.</li>
              </ul>
              <p className="tw:mb-1.5 tw:flex tw:gap-1.5 tw:rounded tw:bg-warn-soft tw:px-2 tw:py-1.5 tw:text-[11px] tw:text-ink">
                <i className="fa-solid fa-triangle-exclamation tw:mt-0.5 tw:shrink-0 tw:text-warn" />
                <span>
                  PWD SoR is primarily a schedule of items and rates, not purely a measurement
                  methodology. Quantities may still need a measurement rule stated in the preamble.
                </span>
              </p>
              <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
                <span className="tw:text-[11.5px] tw:font-medium tw:text-ink">
                  Pick it for government estimates and tender pricing.
                </span>
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm tw:shrink-0"
                  data-standard-pick="pwd_schedule"
                  onClick={() => {
                    setForm({ ...form, measurement_standard: "pwd_schedule" });
                    setStandardInfoOpen(false);
                  }}
                >
                  Use this
                </button>
              </div>
            </article>

            <article
              className="tw:mb-2 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:px-3 tw:py-2.5"
              data-standard-card="custom"
            >
              <div className="tw:mb-1 tw:flex tw:items-start tw:justify-between tw:gap-2">
                <strong className="tw:text-[12.5px] tw:leading-snug tw:text-ink">
                  Custom — measured to the project preamble
                </strong>
              </div>
              <ul className="tw:mb-1.5 tw:list-disc tw:space-y-0.5 tw:pl-4 tw:text-[11.5px] tw:text-ink">
                <li>Your own measurement rules.</li>
                <li>Your own units, deductions and inclusions.</li>
                <li>How each activity on this project is measured.</li>
              </ul>
              <p className="tw:mb-1.5 tw:flex tw:gap-1.5 tw:rounded tw:bg-warn-soft tw:px-2 tw:py-1.5 tw:text-[11px] tw:text-ink">
                <i className="fa-solid fa-triangle-exclamation tw:mt-0.5 tw:shrink-0 tw:text-warn" />
                <span>
                  Nothing validates a custom bill for you. State the rules in the project preamble
                  or the quantities cannot be checked.
                </span>
              </p>
              <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
                <span className="tw:text-[11.5px] tw:font-medium tw:text-ink">
                  Pick it when the contract or project defines its own rules.
                </span>
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm tw:shrink-0"
                  data-standard-pick="custom"
                  onClick={() => {
                    setForm({ ...form, measurement_standard: "custom" });
                    setStandardInfoOpen(false);
                  }}
                >
                  Use this
                </button>
              </div>
            </article>
          </div>
        </aside>
      </div>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete BOQ?"
        description={
          <>
            <strong>{deleteTarget?.title ?? ""}</strong> will be deleted.
          </>
        }
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
