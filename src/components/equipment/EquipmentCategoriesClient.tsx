"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";
import { EquipmentSubmenu } from "./EquipmentSubmenu";

interface CategoryRow {
  id: number;
  code: string;
  name: string;
  equipmentClass: string;
  requiresOperatorCertification: boolean;
  defaultHourlyRate: number;
  defaultDailyRate: number;
  defaultRateBasis: string;
  usefulLifeYears: number;
  serviceIntervalHours: number;
  serviceIntervalKm?: number | null;
  serviceIntervalDays?: number | null;
  salvagePercent: number;
  description: string | null;
  isActive: boolean;
  _count: { equipments: number };
}

function classLabel(cls: string) {
  if (cls === "vehicle" || cls === "transport") return "Vehicle";
  if (cls === "tool" || cls === "light_tools") return "Tools & Scaffolding";
  return "Plant & Machinery";
}

function classIcon(cls: string) {
  if (cls === "vehicle" || cls === "transport") return "fa-solid fa-truck";
  if (cls === "tool" || cls === "light_tools") return "fa-solid fa-screwdriver-wrench";
  return "fa-solid fa-tractor";
}

export function EquipmentCategoriesClient({ initialCategories }: { initialCategories: CategoryRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    equipment_class: "plant",
    parent_id: "",
    requires_operator_certification: false,
    default_hourly_rate: "",
    default_daily_rate: "",
    default_rate_basis: "hourly",
    useful_life_years: "8",
    service_interval_hours: "250",
    service_interval_km: "",
    service_interval_days: "180",
    salvage_percent: "10",
    asset_account_code: "",
    depreciation_account_code: "",
    description: "",
    is_active: true,
  });

  const rows = initialCategories.filter((c) => {
    const q = search.trim().toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q)) return false;
    if (classFilter) {
      if (classFilter === "plant" && !["plant", "heavy_plant", "lifting", "concrete", "power"].includes(c.equipmentClass)) return false;
      if (classFilter === "vehicle" && !["vehicle", "transport"].includes(c.equipmentClass)) return false;
      if (classFilter === "tool" && !["tool", "light_tools"].includes(c.equipmentClass)) return false;
    }
    return true;
  });

  function openCreate() {
    setEditingId(null);
    setForm({
      code: "",
      name: "",
      equipment_class: "plant",
      parent_id: "",
      requires_operator_certification: false,
      default_hourly_rate: "",
      default_daily_rate: "",
      default_rate_basis: "hourly",
      useful_life_years: "8",
      service_interval_hours: "250",
      service_interval_km: "",
      service_interval_days: "180",
      salvage_percent: "10",
      asset_account_code: "",
      depreciation_account_code: "",
      description: "",
      is_active: true,
    });
    setModalOpen(true);
  }

  function openEdit(cat: CategoryRow) {
    setEditingId(cat.id);
    setForm({
      code: cat.code,
      name: cat.name,
      equipment_class: ["vehicle", "transport"].includes(cat.equipmentClass)
        ? "vehicle"
        : ["tool", "light_tools"].includes(cat.equipmentClass)
          ? "tool"
          : "plant",
      parent_id: "",
      requires_operator_certification: cat.requiresOperatorCertification,
      default_hourly_rate: cat.defaultHourlyRate ? String(cat.defaultHourlyRate) : "",
      default_daily_rate: cat.defaultDailyRate ? String(cat.defaultDailyRate) : "",
      default_rate_basis: cat.defaultRateBasis || "hourly",
      useful_life_years: String(cat.usefulLifeYears || 8),
      service_interval_hours: cat.serviceIntervalHours ? String(cat.serviceIntervalHours) : "",
      service_interval_km: cat.serviceIntervalKm ? String(cat.serviceIntervalKm) : "",
      service_interval_days: cat.serviceIntervalDays ? String(cat.serviceIntervalDays) : "180",
      salvage_percent: String(cat.salvagePercent ?? 10),
      asset_account_code: "",
      depreciation_account_code: "",
      description: cat.description ?? "",
      is_active: cat.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const url = editingId ? `/api/equipment/categories/${editingId}` : "/api/equipment/categories";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save category");
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await fetch(`/api/equipment/categories/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container ">
      <EquipmentSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-folder-tree" />
          </div>
          <div>
            <h1>Equipment Categories</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/equipment">Equipment</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Categories
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
                "equipment-categories.csv",
                ["Code", "Name", "Class", "Machines", "Hourly Rate", "Daily Rate", "Service Interval (h)", "Life (yrs)", "Operator Cert"],
                rows.map((r) => [
                  r.code,
                  r.name,
                  classLabel(r.equipmentClass),
                  r._count.equipments,
                  r.defaultHourlyRate,
                  r.defaultDailyRate,
                  r.serviceIntervalHours,
                  r.usefulLifeYears,
                  r.requiresOperatorCertification ? "Certified" : "Anyone",
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
            data-bs-target="#categoryModal"
            data-mode="create"
            onClick={openCreate}
          >
            <i className="fa-solid fa-plus me-2" />
            New Category
          </button>
        </div>
      </div>

      <div className="erp-context-banner">
        <span className="erp-context-banner-icon">
          <i className="fa-solid fa-lightbulb" />
        </span>
        <div className="erp-context-banner-body">
          <strong>A category states what a machine IS</strong>
          <span>
            Charge-out rate, service intervals, useful life and the ledger account it capitalises to.
            Every machine created under it inherits these, so adding the twelfth tipper is a short
            form rather than twelve decisions taken again. Anything set on the machine itself wins.
          </span>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/equipment/categories"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or code…"
                aria-label="Search categories"
              />
            </div>
            <select
              name="equipment_class"
              className="form-select erp-select"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              aria-label="Class"
            >
              <option value="">All classes</option>
              <option value="plant">Plant &amp; Machinery</option>
              <option value="vehicle">Vehicle</option>
              <option value="tool">Tools &amp; Scaffolding</option>
            </select>
            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {rows.length} categories
          </span>
        </div>

        <div className="erp-card-body is-flush">
          <div className="erp-table-wrap">
            <table className="table erp-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Class</th>
                  <th className="text-end">Machines</th>
                  <th className="text-end">Default rate</th>
                  <th>Service interval</th>
                  <th>Life</th>
                  <th>Operator</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((cat) => (
                  <tr key={cat.id} className="">
                    <td>
                      <div className="erp-identity">
                        <span className="erp-initials">
                          <i className={classIcon(cat.equipmentClass)} />
                        </span>
                        <span>
                          <span className="erp-identity-name">{cat.name}</span>
                          <span className="erp-identity-meta">{cat.code}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="erp-pill is-neutral">{classLabel(cat.equipmentClass)}</span>
                    </td>
                    <td className="text-end erp-cell-strong">
                      <Link href={`/equipment/register?equipment_category_id=${cat.id}`} className="erp-plain-link">
                        {cat._count.equipments}
                      </Link>
                    </td>
                    <td className="text-end text-nowrap">
                      {cat.defaultRateBasis === "daily" && cat.defaultDailyRate
                        ? `${cat.defaultDailyRate.toLocaleString()}/day`
                        : cat.defaultHourlyRate
                          ? `${cat.defaultHourlyRate.toLocaleString()}/hr`
                          : "—"}
                    </td>
                    <td>
                      <span className="erp-identity-meta">
                        {cat.serviceIntervalHours ? `${cat.serviceIntervalHours} hr ` : ""}
                        {cat.serviceIntervalKm ? `${cat.serviceIntervalKm.toLocaleString()} km ` : ""}
                        {cat.serviceIntervalDays ? `${cat.serviceIntervalDays} days` : "180 days"}
                      </span>
                    </td>
                    <td>{cat.usefulLifeYears} yr</td>
                    <td>
                      {cat.requiresOperatorCertification ? (
                        <span className="erp-pill is-warning" title="An uncertified operator will be refused">
                          <i className="fa-solid fa-id-card me-1" />
                          Certified
                        </span>
                      ) : (
                        <span className="text-muted">Anyone</span>
                      )}
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        title="Edit"
                        data-bs-toggle="modal"
                        data-bs-target="#categoryModal"
                        onClick={() => openEdit(cat)}
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm text-danger"
                        title="Delete"
                        data-bs-toggle="modal"
                        data-bs-target="#deleteRecordModal"
                        data-record-name={cat.name}
                        onClick={() => setDeleteTarget(cat)}
                      >
                        <i className="fa-solid fa-trash-can" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        className={`modal fade ${modalOpen ? "show d-block" : ""}`}
        id="categoryModal"
        tabIndex={-1}
        aria-hidden={!modalOpen}
        style={modalOpen ? { background: "rgba(15,23,42,0.5)" } : undefined}
      >
        <div className="modal-dialog modal-lg">
          <form method="POST" action="/equipment/categories" className="modal-content" data-category-form onSubmit={handleSave}>
            <input type="hidden" name="_method" value={editingId ? "PUT" : "POST"} data-method-field />

            <div className="modal-header">
              <h5 className="modal-title" data-modal-title>
                <i className="fa-solid fa-folder-tree me-2" />
                {editingId ? "Edit Category" : "New Category"}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setModalOpen(false)} />
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label" htmlFor="catCode">
                    Code <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="catCode"
                    name="code"
                    className="form-control"
                    required
                    maxLength={30}
                    placeholder="EXC"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label" htmlFor="catName">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="catName"
                    name="name"
                    className="form-control"
                    required
                    maxLength={120}
                    placeholder="Excavator"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="catClass">
                    Class <span className="text-danger">*</span>
                  </label>
                  <select
                    id="catClass"
                    name="equipment_class"
                    className="form-select"
                    required
                    value={form.equipment_class}
                    onChange={(e) => setForm({ ...form, equipment_class: e.target.value })}
                  >
                    <option value="plant">Plant &amp; Machinery</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="tool">Tools &amp; Scaffolding</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="catParent">
                    Sits under
                  </label>
                  <select
                    id="catParent"
                    name="parent_id"
                    className="form-select"
                    data-select2
                    data-placeholder="Top level"
                    value={form.parent_id}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                  >
                    <option value=""></option>
                    {initialCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-check mt-4">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="requires_operator_certification"
                      value="1"
                      checked={form.requires_operator_certification}
                      onChange={(e) => setForm({ ...form, requires_operator_certification: e.target.checked })}
                    />
                    <span className="form-check-label">
                      Needs a certified operator
                      <span className="erp-identity-meta d-block">
                        Usage logged with an uncertified or lapsed operator will be refused.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <hr className="my-3" />

              <h6 className="text-muted mb-3">What machines here inherit</h6>

              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label" htmlFor="catHourly">
                    Hourly rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="catHourly"
                    name="default_hourly_rate"
                    className="form-control"
                    value={form.default_hourly_rate}
                    onChange={(e) => setForm({ ...form, default_hourly_rate: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="catDaily">
                    Daily rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="catDaily"
                    name="default_daily_rate"
                    className="form-control"
                    value={form.default_daily_rate}
                    onChange={(e) => setForm({ ...form, default_daily_rate: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="catBasis">
                    Charged by
                  </label>
                  <select
                    id="catBasis"
                    name="default_rate_basis"
                    className="form-select"
                    value={form.default_rate_basis}
                    onChange={(e) => setForm({ ...form, default_rate_basis: e.target.value })}
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
                  <label className="form-label" htmlFor="catLife">
                    Useful life
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      id="catLife"
                      name="useful_life_years"
                      className="form-control"
                      value={form.useful_life_years}
                      onChange={(e) => setForm({ ...form, useful_life_years: e.target.value })}
                    />
                    <span className="input-group-text">yr</span>
                  </div>
                </div>

                <div className="col-md-3">
                  <label className="form-label" htmlFor="catHours">
                    Service every
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      min="1"
                      id="catHours"
                      name="service_interval_hours"
                      className="form-control"
                      value={form.service_interval_hours}
                      onChange={(e) => setForm({ ...form, service_interval_hours: e.target.value })}
                    />
                    <span className="input-group-text">hr</span>
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="catKm">
                    Service every
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      min="1"
                      id="catKm"
                      name="service_interval_km"
                      className="form-control"
                      value={form.service_interval_km}
                      onChange={(e) => setForm({ ...form, service_interval_km: e.target.value })}
                    />
                    <span className="input-group-text">km</span>
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="catDays">
                    Service every
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      min="1"
                      id="catDays"
                      name="service_interval_days"
                      className="form-control"
                      value={form.service_interval_days}
                      onChange={(e) => setForm({ ...form, service_interval_days: e.target.value })}
                    />
                    <span className="input-group-text">days</span>
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="catSalvage">
                    Residual
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="99"
                      id="catSalvage"
                      name="salvage_percent"
                      className="form-control"
                      value={form.salvage_percent}
                      onChange={(e) => setForm({ ...form, salvage_percent: e.target.value })}
                    />
                    <span className="input-group-text">%</span>
                  </div>
                </div>

                <div className="col-12">
                  <div className="form-text mb-2">
                    Whichever service interval falls due <strong>first</strong> wins. Leave all three
                    blank and nothing will ever come due for these machines.
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="catAsset">
                    Capitalises to
                  </label>
                  <select
                    id="catAsset"
                    name="asset_account_code"
                    className="form-select"
                    data-select2
                    data-placeholder="Use the class default"
                    value={form.asset_account_code}
                    onChange={(e) => setForm({ ...form, asset_account_code: e.target.value })}
                  >
                    <option value=""></option>
                    <option value="1111">1111 — Petty Cash</option>
                    <option value="1112">1112 — Cash in Hand</option>
                    <option value="1113">1113 — Cash at Site Office</option>
                    <option value="1121">1121 — Operating Bank Account</option>
                    <option value="1520">1520 — Plant &amp; Machinery</option>
                    <option value="1530">1530 — Motor Vehicles</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="catDep">
                    Accumulated depreciation
                  </label>
                  <select
                    id="catDep"
                    name="depreciation_account_code"
                    className="form-select"
                    data-select2
                    data-placeholder="Use the class default"
                    value={form.depreciation_account_code}
                    onChange={(e) => setForm({ ...form, depreciation_account_code: e.target.value })}
                  >
                    <option value=""></option>
                    <option value="1111">1111 — Petty Cash</option>
                    <option value="1112">1112 — Cash in Hand</option>
                    <option value="1113">1113 — Cash at Site Office</option>
                    <option value="1121">1121 — Operating Bank Account</option>
                    <option value="5240">5240 — Depreciation — Plant</option>
                    <option value="5245">5245 — Depreciation — Vehicles</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="catDescription">
                    Description
                  </label>
                  <textarea
                    id="catDescription"
                    name="description"
                    className="form-control"
                    rows={2}
                    maxLength={2000}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="is_active"
                      value="1"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                    <span className="form-check-label">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-erp-ghost" data-bs-dismiss="modal" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
                <i className="fa-solid fa-check me-2" />
                <span data-submit-label>{editingId ? "Save" : "Create"}</span>
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
                    Delete category?
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
              <form method="POST" data-delete-form onSubmit={handleDelete}>
                <input type="hidden" name="_method" value="DELETE" />
                <button
                  type="submit"
                  className="btn btn-erp"
                  style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
                  disabled={busy}
                >
                  <i className="fa-solid fa-trash-can me-2" />
                  Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
