"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal } from "@/components/ui";
import { downloadCsv } from "@/lib/csv-client";

interface ResourceRow {
  id: number;
  code: string;
  name: string;
  kind: string;
  trade: string | null;
  uom: string;
  standardRate: number;
  description: string | null;
  isActive: boolean;
}

const UOM_OPTIONS = [
  { id: "1", label: "Piece — PCS", short: "PCS" },
  { id: "2", label: "Number — NOS", short: "NOS" },
  { id: "3", label: "Unit — UNIT", short: "UNIT" },
  { id: "4", label: "Set — SET", short: "SET" },
  { id: "5", label: "Pair — PAIR", short: "PAIR" },
  { id: "6", label: "Dozen — DOZ", short: "DOZ" },
  { id: "7", label: "Gross — GROSS", short: "GROSS" },
  { id: "8", label: "Hundred — HUND", short: "HUND" },
  { id: "9", label: "Thousand — THOU", short: "THOU" },
  { id: "10", label: "Box — BOX", short: "BOX" },
  { id: "11", label: "Carton — CTN", short: "CTN" },
  { id: "12", label: "Packet — PKT", short: "PKT" },
  { id: "13", label: "Bundle — BDL", short: "BDL" },
  { id: "14", label: "Roll — ROLL", short: "ROLL" },
  { id: "15", label: "Coil — COIL", short: "COIL" },
  { id: "16", label: "Sheet — SHEET", short: "SHEET" },
  { id: "17", label: "Panel — PANEL", short: "PANEL" },
  { id: "18", label: "Leaf — LEAF", short: "LEAF" },
  { id: "19", label: "Drum — DRUM", short: "DRUM" },
  { id: "20", label: "Can — CAN", short: "CAN" },
  { id: "21", label: "Tin — TIN", short: "TIN" },
  { id: "22", label: "Tube — TUBE", short: "TUBE" },
  { id: "23", label: "Pail — PAIL", short: "PAIL" },
  { id: "24", label: "Sack — SACK", short: "SACK" },
  { id: "25", label: "Bag — BAG", short: "BAG" },
  { id: "26", label: "Lot — LOT", short: "LOT" },
  { id: "27", label: "Job — JOB", short: "JOB" },
  { id: "28", label: "Trip — TRIP", short: "TRIP" },
  { id: "29", label: "Truck Load — TRUCK", short: "TRUCK" },
  { id: "30", label: "Metre — M", short: "M" },
  { id: "31", label: "Millimetre — MM", short: "MM" },
  { id: "32", label: "Centimetre — CM", short: "CM" },
  { id: "33", label: "Kilometre — KM", short: "KM" },
  { id: "34", label: "Inch — IN", short: "IN" },
  { id: "35", label: "Foot — FT", short: "FT" },
  { id: "36", label: "Yard — YD", short: "YD" },
  { id: "37", label: "Running Foot — RFT", short: "RFT" },
  { id: "38", label: "Running Metre — RM", short: "RM" },
  { id: "39", label: "Square Metre — SQM", short: "SQM" },
  { id: "40", label: "Square Foot — SQFT", short: "SQFT" },
  { id: "41", label: "Square Yard — SQYD", short: "SQYD" },
  { id: "42", label: "Square Inch — SQIN", short: "SQIN" },
  { id: "43", label: "Square Millimetre — SQMM", short: "SQMM" },
  { id: "44", label: "Katha — KATHA", short: "KATHA" },
  { id: "45", label: "Bigha — BIGHA", short: "BIGHA" },
  { id: "46", label: "Decimal (Shotok) — DECIMAL", short: "DECIMAL" },
  { id: "47", label: "Acre — ACRE", short: "ACRE" },
  { id: "48", label: "Hectare — HECTARE", short: "HECTARE" },
  { id: "49", label: "Kani — KANI", short: "KANI" },
  { id: "50", label: "Cubic Metre — CUM", short: "CUM" },
  { id: "51", label: "Cubic Foot — CFT", short: "CFT" },
  { id: "52", label: "Cubic Yard — CUYD", short: "CUYD" },
  { id: "53", label: "Brass (100 CFT) — BRASS", short: "BRASS" },
  { id: "54", label: "Litre — LTR", short: "LTR" },
  { id: "55", label: "Millilitre — ML", short: "ML" },
  { id: "56", label: "Gallon (US) — GAL", short: "GAL" },
  { id: "57", label: "Kilogram — KG", short: "KG" },
  { id: "58", label: "Gram — G", short: "G" },
  { id: "59", label: "Metric Ton — MT", short: "MT" },
  { id: "60", label: "Quintal — QTL", short: "QTL" },
  { id: "61", label: "Pound — LB", short: "LB" },
  { id: "62", label: "Maund — MAUND", short: "MAUND" },
  { id: "63", label: "Seer — SEER", short: "SEER" },
  { id: "64", label: "Day — DAY", short: "DAY" },
  { id: "65", label: "Hour — HR", short: "HR" },
  { id: "66", label: "Man-Day — MANDAY", short: "MANDAY" },
  { id: "67", label: "Man-Hour — MANHR", short: "MANHR" },
  { id: "68", label: "Week — WEEK", short: "WEEK" },
  { id: "69", label: "Month — MONTH", short: "MONTH" },
  { id: "70", label: "Shift — SHIFT", short: "SHIFT" },
  { id: "71", label: "Lump Sum — LS", short: "LS" },
  { id: "72", label: "Percent — PCT", short: "PCT" },
  { id: "73", label: "Kilowatt Hour — KWH", short: "KWH" },
  { id: "74", label: "KVA — KVA", short: "KVA" },
];

function getKindIcon(kind: string) {
  const k = kind.toLowerCase();
  if (k === "equipment" || k === "plant") return "fa-solid fa-truck-monster me-1";
  if (k === "subcontract") return "fa-solid fa-handshake me-1";
  if (k === "other") return "fa-solid fa-ellipsis me-1";
  return "fa-solid fa-helmet-safety me-1";
}

function getKindLabel(kind: string) {
  const k = kind.toLowerCase();
  if (k === "equipment" || k === "plant") return "Equipment";
  if (k === "subcontract") return "Subcontract";
  if (k === "other") return "Other";
  return "Labour";
}

export function ResourcesClient({ resources: initial }: { resources: ResourceRow[] }) {
  const router = useRouter();
  const [resources, setResources] = useState(initial);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResourceRow | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    code: "",
    name: "",
    kind: "labour",
    trade: "",
    uom_id: "64",
    standard_rate: "0",
    description: "",
    is_active: true,
  });

  const filtered = resources.filter((r) => {
    const normalizedKind =
      r.kind.toLowerCase() === "plant" ? "equipment" : r.kind.toLowerCase();
    if (kindFilter && normalizedKind !== kindFilter) return false;
    if (
      search &&
      !r.code.toLowerCase().includes(search.toLowerCase()) &&
      !r.name.toLowerCase().includes(search.toLowerCase()) &&
      !(r.trade ?? "").toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  function openAddModal() {
    setEditingResource(null);
    setForm({
      code: "",
      name: "",
      kind: "labour",
      trade: "",
      uom_id: "64",
      standard_rate: "0",
      description: "",
      is_active: true,
    });
    setModalOpen(true);
  }

  function openEditModal(r: ResourceRow) {
    setEditingResource(r);
    const matchedUom =
      UOM_OPTIONS.find((u) => u.short.toLowerCase() === r.uom.toLowerCase())?.id ?? "64";
    setForm({
      code: r.code,
      name: r.name,
      kind: r.kind.toLowerCase() === "plant" ? "equipment" : r.kind.toLowerCase(),
      trade: r.trade ?? "",
      uom_id: matchedUom,
      standard_rate: String(r.standardRate),
      description: r.description ?? "",
      is_active: r.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const uomShort =
        UOM_OPTIONS.find((u) => u.id === form.uom_id)?.short ?? "DAY";
      if (editingResource) {
        setResources((prev) =>
          prev.map((x) =>
            x.id === editingResource.id
              ? {
                  ...x,
                  code: form.code.trim(),
                  name: form.name.trim(),
                  kind: form.kind,
                  trade: form.trade.trim() || null,
                  uom: uomShort,
                  standardRate: Number(form.standard_rate) || 0,
                  description: form.description.trim() || null,
                  isActive: form.is_active,
                }
              : x
          )
        );
        setModalOpen(false);
      } else {
        const res = await fetch("/api/construction/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: form.code.trim(),
            name: form.name.trim(),
            kind: form.kind,
            trade: form.trade.trim() || null,
            uom: uomShort,
            standard_rate: Number(form.standard_rate) || 0,
            description: form.description.trim() || null,
            is_active: form.is_active,
          }),
        });
        if (res.ok) {
          const d = await res.json();
          setResources((prev) => [d.resource, ...prev]);
          setModalOpen(false);
          router.refresh();
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/construction/resources/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setResources((prev) => prev.filter((x) => x.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-helmet-safety" />
          </div>
          <div>
            <h1>Labour &amp; Plant</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="/dashboard">Home</a>
                </li>
                <li className="breadcrumb-item">Procurement</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Labour &amp; Plant
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
                "resources.csv",
                ["Code", "Name", "Kind", "Trade", "Unit", "Rate"],
                filtered.map((r) => [r.code, r.name, r.kind, r.trade, r.uom, r.standardRate])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2" />
            Export
          </button>
          <button
            type="button"
            className="btn btn-erp"
            data-resource-add
            data-bs-toggle="modal"
            data-bs-target="#resourceModal"
            onClick={openAddModal}
          >
            <i className="fa-solid fa-plus me-2" />
            New Resource
          </button>
        </div>
      </div>

      <div className="erp-note mb-3">
        <i className="fa-solid fa-circle-info me-2" />
        These are the things work consumes that a store never holds.{" "}
        <strong>Materials are not here</strong> — they live in the product catalogue, where a
        purchase history already says what they cost.
      </div>

      <div className="erp-card">
        <div className="erp-card-head">
          <form
            method="GET"
            action="/resources"
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
                placeholder="Search by code, name or trade…"
                aria-label="Search"
              />
            </div>
            <select
              name="kind"
              className="erp-select"
              data-select2
              data-placeholder="Kind"
              aria-label="Kind"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
            >
              <option value="">All kinds</option>
              <option value="labour">Labour</option>
              <option value="equipment">Equipment</option>
              <option value="subcontract">Subcontract</option>
              <option value="other">Other</option>
            </select>
            <div className="erp-filter-actions">
              <button type="submit" className="btn btn-erp btn-sm">
                <i className="fa-solid fa-filter me-1" />
                Filter
              </button>
            </div>
          </form>
        </div>

        <div className="erp-table-wrap">
          <table className="table erp-table mb-0">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Kind</th>
                <th>Trade</th>
                <th>Unit</th>
                <th className="text-end">Standard Rate</th>
                <th>Status</th>
                <th>Created By</th>
                <th style={{ width: 110 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="erp-cell-strong">{r.code}</td>
                  <td>{r.name}</td>
                  <td>
                    <span className="erp-pill is-neutral">
                      <i className={getKindIcon(r.kind)} />
                      {getKindLabel(r.kind)}
                    </span>
                  </td>
                  <td>{r.trade || "—"}</td>
                  <td>{r.uom}</td>
                  <td className="text-end">
                    BDT{" "}
                    {r.standardRate.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    <span className={`erp-pill ${r.isActive ? "is-available" : "is-neutral"}`}>
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <span className="erp-created-by">
                      <span className="erp-cell-strong">—</span>
                      <span className="erp-identity-meta d-block">30 Oct 2026</span>
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm"
                      title="Edit"
                      data-bs-toggle="modal"
                      data-bs-target="#resourceModal"
                      data-resource-edit={`/resources/${r.id}`}
                      onClick={() => openEditModal(r)}
                    >
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm text-danger"
                      title="Delete"
                      onClick={() => setDeleteTarget(r)}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="erp-card-foot">
          <nav className="d-flex justify-items-center justify-content-between">
            <div className="d-none flex-sm-fill d-sm-flex align-items-sm-center justify-content-sm-between">
              <div className="small text-muted">
                Showing <span className="fw-semibold">{filtered.length > 0 ? 1 : 0}</span> to{" "}
                <span className="fw-semibold">{filtered.length}</span> of{" "}
                <span className="fw-semibold">{resources.length}</span> results
              </div>

              <div>
                <ul className="pagination mb-0">
                  <li className="page-item disabled" aria-disabled="true" aria-label="« Previous">
                    <span className="page-link" aria-hidden="true">
                      &lsaquo;
                    </span>
                  </li>
                  <li className="page-item active" aria-current="page">
                    <span className="page-link">1</span>
                  </li>
                  <li className="page-item disabled" aria-disabled="true" aria-label="Next »">
                    <span className="page-link" aria-hidden="true">
                      &rsaquo;
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </div>
      </div>

      <div
        className={`modal fade ${modalOpen ? "show d-block" : ""}`}
        id="resourceModal"
        tabIndex={-1}
        aria-hidden={!modalOpen}
        style={modalOpen ? { background: "rgba(0,0,0,0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            action="/resources"
            className="modal-content"
            data-resource-form
            onSubmit={handleSave}
          >
            <input type="hidden" name="_method" value="POST" data-resource-method />
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fa-solid fa-helmet-safety me-2" />
                <span data-resource-title>
                  {editingResource ? "Edit Resource" : "New Resource"}
                </span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                onClick={() => setModalOpen(false)}
              />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">
                      Code <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      className="form-control"
                      maxLength={40}
                      required
                      placeholder="LAB-MASON"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="erp-field">
                    <label className="form-label">
                      Name <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      maxLength={190}
                      required
                      placeholder="Mason"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">
                      Kind <span className="erp-required">*</span>
                    </label>
                    <select
                      name="kind"
                      className="form-select"
                      data-select2
                      data-dropdown-parent="#resourceModal"
                      required
                      value={form.kind}
                      onChange={(e) => setForm({ ...form, kind: e.target.value })}
                    >
                      <option value="labour">Labour</option>
                      <option value="equipment">Equipment</option>
                      <option value="subcontract">Subcontract</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Unit</label>
                    <select
                      name="uom_id"
                      className="form-select"
                      data-select2
                      data-dropdown-parent="#resourceModal"
                      data-placeholder="Day, Hour, …"
                      value={form.uom_id}
                      onChange={(e) => setForm({ ...form, uom_id: e.target.value })}
                    >
                      <option value="">—</option>
                      {UOM_OPTIONS.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Standard rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      name="standard_rate"
                      className="form-control text-end"
                      value={form.standard_rate}
                      onChange={(e) => setForm({ ...form, standard_rate: e.target.value })}
                    />
                    <span className="erp-help">
                      Fills a new analysis line. Editing it later does not rewrite analyses already
                      written.
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Trade</label>
                    <input
                      type="text"
                      name="trade"
                      className="form-control"
                      maxLength={60}
                      placeholder="Civil, Finishing, …"
                      value={form.trade}
                      onChange={(e) => setForm({ ...form, trade: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-12">
                  <div className="erp-field">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows={2}
                      maxLength={1000}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input type="hidden" name="is_active" value="0" />
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="is_active"
                      value="1"
                      id="resourceActive"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="resourceActive">
                      Active — offered when writing an analysis
                    </label>
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
              <button type="submit" className="btn btn-erp" data-loading disabled={busy}>
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name ?? "resource"}?`}
        description={
          <>
            Delete <strong>{deleteTarget?.name ?? ""}</strong>? If an analysis uses it, it will be
            deactivated instead.
          </>
        }
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
