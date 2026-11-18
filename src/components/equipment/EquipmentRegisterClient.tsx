"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";
import { EquipmentSubmenu } from "./EquipmentSubmenu";

interface EqRow {
  id: number;
  code: string;
  name: string;
  equipmentClass: string;
  categoryId: number | null;
  category: { id: number; name: string } | null;
  make: string | null;
  model: string | null;
  ownershipType: string;
  meterType: string;
  currentHourMeter: number;
  currentOdometer: number;
  currentLocation: string | null;
  projectId: number | null;
  status: string;
  registrationNo: string | null;
  internalHourlyRate: number;
  internalDailyRate: number;
  rateBasis: string;
}

export function EquipmentRegisterClient({
  equipments,
  categories,
  projects,
}: {
  equipments: EqRow[];
  categories: { id: number; name: string }[];
  projects: { id: number; code: string; name: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [equipmentClass, setEquipmentClass] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [ownershipType, setOwnershipType] = useState("");
  const [projectId, setProjectId] = useState("");
  const [includeRetired, setIncludeRetired] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EqRow | null>(null);
  const [busy, setBusy] = useState(false);

  const projectMap = new Map(projects.map((p) => [p.id, `${p.code} — ${p.name}`]));

  const rows = equipments.filter((e) => {
    if (!includeRetired && e.status === "retired") return false;
    if (equipmentClass) {
      if (equipmentClass === "plant" && !["plant", "heavy_plant", "lifting", "concrete", "power"].includes(e.equipmentClass)) return false;
      if (equipmentClass === "vehicle" && !["vehicle", "transport"].includes(e.equipmentClass)) return false;
      if (equipmentClass === "tool" && !["tool", "light_tools"].includes(e.equipmentClass)) return false;
    }
    if (categoryId && String(e.categoryId ?? "") !== categoryId) return false;
    if (status && e.status !== status) return false;
    if (ownershipType) {
      if (ownershipType === "rented" && !["rented", "hired"].includes(e.ownershipType)) return false;
      else if (ownershipType !== "rented" && e.ownershipType !== ownershipType) return false;
    }
    if (projectId && String(e.projectId ?? "") !== projectId) return false;
    const q = search.trim().toLowerCase();
    if (q && !`${e.code} ${e.name} ${e.make ?? ""} ${e.model ?? ""} ${e.registrationNo ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await fetch(`/api/equipment/register/${deleteTarget.id}`, { method: "DELETE" });
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
            <i className="fa-solid fa-tractor" />
          </div>
          <div>
            <h1>Equipment &amp; Fleet</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/equipment">Equipment</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Register
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
                "equipment-register.csv",
                ["Code", "Name", "Category", "Ownership", "Meter", "Location", "Status", "Rate"],
                rows.map((r) => [
                  r.code,
                  r.name,
                  r.category?.name ?? "",
                  r.ownershipType,
                  r.meterType === "odometer" ? r.currentOdometer : r.currentHourMeter,
                  r.currentLocation ?? "",
                  r.status,
                  r.internalHourlyRate,
                ])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2" />
            Export
          </button>
          <Link href="/equipment/categories" className="btn btn-erp-ghost">
            <i className="fa-solid fa-folder-tree me-2" />
            Categories
          </Link>
          <Link href="/equipment/register/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2" />
            Add Equipment
          </Link>
        </div>
      </div>

      <div className="erp-statrow">
        <a
          href="/equipment/register"
          className={`erp-stat ${equipmentClass === "" ? "is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setEquipmentClass("");
          }}
        >
          <span className="erp-stat-icon">
            <i className="fa-solid fa-layer-group" />
          </span>
          <span className="erp-stat-body">
            <strong>All</strong>
            <small>every machine</small>
          </span>
        </a>
        <a
          href="/equipment/register?equipment_class=plant"
          className={`erp-stat ${equipmentClass === "plant" ? "is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setEquipmentClass("plant");
          }}
        >
          <span className="erp-stat-icon">
            <i className="fa-solid fa-tractor" />
          </span>
          <span className="erp-stat-body">
            <strong>Plant &amp; Machinery</strong>
            <small>Hour meter</small>
          </span>
        </a>
        <a
          href="/equipment/register?equipment_class=vehicle"
          className={`erp-stat ${equipmentClass === "vehicle" ? "is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setEquipmentClass("vehicle");
          }}
        >
          <span className="erp-stat-icon">
            <i className="fa-solid fa-truck" />
          </span>
          <span className="erp-stat-body">
            <strong>Vehicle</strong>
            <small>Odometer</small>
          </span>
        </a>
        <a
          href="/equipment/register?equipment_class=tool"
          className={`erp-stat ${equipmentClass === "tool" ? "is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setEquipmentClass("tool");
          }}
        >
          <span className="erp-stat-icon">
            <i className="fa-solid fa-screwdriver-wrench" />
          </span>
          <span className="erp-stat-body">
            <strong>Tools &amp; Scaffolding</strong>
            <small>Not metered</small>
          </span>
        </a>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/equipment/register"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
            onSubmit={(e) => e.preventDefault()}
          >
            <input type="hidden" name="equipment_class" value={equipmentClass} />

            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Code, name, plate, chassis…"
                aria-label="Search equipment"
              />
            </div>

            <select
              name="equipment_category_id"
              className="form-select erp-select"
              data-select2
              data-placeholder="All categories"
              aria-label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              className="form-select erp-select"
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Any status</option>
              <option value="available">Available</option>
              <option value="assigned">On project</option>
              <option value="in_transit">In transit</option>
              <option value="standby">On standby</option>
              <option value="breakdown">Broken down</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Disposed</option>
            </select>

            <select
              name="ownership_type"
              className="form-select erp-select"
              aria-label="Ownership"
              value={ownershipType}
              onChange={(e) => setOwnershipType(e.target.value)}
            >
              <option value="">Owned and hired</option>
              <option value="owned">Owned</option>
              <option value="rented">Rented / hired in</option>
              <option value="leased">Leased</option>
            </select>

            <select
              name="project_id"
              className="form-select erp-select"
              data-select2
              data-placeholder="Any project"
              aria-label="Project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Any project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>

            <label className="form-check form-check-inline mb-0">
              <input
                type="checkbox"
                className="form-check-input"
                name="include_retired"
                value="1"
                checked={includeRetired}
                onChange={(e) => setIncludeRetired(e.target.checked)}
              />
              <span className="form-check-label" style={{ fontSize: "12.5px" }}>
                Include disposed
              </span>
            </label>

            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {rows.length} machines
          </span>
        </div>

        <div className="erp-card-body is-flush">
          <div className="erp-table-wrap">
            <table className="table erp-table">
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Category</th>
                  <th>Ownership</th>
                  <th>Meter</th>
                  <th>Where</th>
                  <th>Status</th>
                  <th>Legal</th>
                  <th className="text-end">Rate</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((eq) => (
                  <tr key={eq.id} className="">
                    <td>
                      <div className="erp-identity">
                        <span className="erp-initials">
                          <i className="fa-solid fa-tractor" />
                        </span>
                        <span>
                          <span className="erp-identity-name">
                            <Link href={`/equipment/register/${eq.id}`} className="erp-plain-link">
                              {eq.code}
                            </Link>
                          </span>
                          <span className="erp-identity-meta">{eq.name}</span>
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="erp-scope-tag">
                        <i className="fa-solid fa-tractor" /> {eq.category?.name ?? "Excavator"}
                      </span>
                      <span className="erp-identity-meta d-block">
                        {[eq.make, eq.model].filter(Boolean).join(" ") || eq.name}
                      </span>
                    </td>

                    <td>
                      <span className="erp-pill is-success">
                        {eq.ownershipType === "owned"
                          ? "Owned"
                          : eq.ownershipType === "rented" || eq.ownershipType === "hired"
                            ? "Rented / hired in"
                            : "Leased"}
                      </span>
                    </td>

                    <td className="text-nowrap">
                      <span className="erp-cell-strong">
                        {eq.meterType === "odometer"
                          ? `${eq.currentOdometer.toLocaleString()} km`
                          : `${eq.currentHourMeter.toLocaleString()} hr`}
                      </span>
                      <span className="erp-identity-meta d-block text-warning">never read</span>
                    </td>

                    <td>
                      <span className="text-muted">
                        {eq.projectId ? projectMap.get(eq.projectId) ?? eq.currentLocation ?? "Site" : eq.currentLocation ?? "Central yard"}
                      </span>
                    </td>

                    <td>
                      {eq.status === "available" ? (
                        <span className="erp-pill is-success">
                          <i className="fa-solid fa-circle-check me-1" />
                          Available
                        </span>
                      ) : eq.status === "breakdown" || eq.status === "maintenance" ? (
                        <span className="erp-pill is-danger">
                          <i className="fa-solid fa-triangle-exclamation me-1" />
                          Broken down
                        </span>
                      ) : (
                        <span className="erp-pill is-warning">{eq.status}</span>
                      )}
                    </td>

                    <td>
                      {eq.registrationNo ? (
                        <span className="erp-pill is-success">
                          <i className="fa-solid fa-check me-1" />
                          Current
                        </span>
                      ) : (
                        <span className="text-muted" title="No compliance documents on file">
                          —
                        </span>
                      )}
                    </td>

                    <td className="text-end text-nowrap">
                      <span className="erp-cell-strong">
                        {(eq.rateBasis === "daily" && eq.internalDailyRate ? eq.internalDailyRate : eq.internalHourlyRate).toLocaleString()}
                      </span>
                      <span className="erp-identity-meta d-block">per {eq.rateBasis === "daily" ? "day" : "hr"}</span>
                    </td>

                    <td className="text-end text-nowrap">
                      <Link href={`/equipment/register/${eq.id}`} className="btn btn-erp-ghost btn-sm" title="View">
                        <i className="fa-solid fa-eye" />
                      </Link>
                      <Link href={`/equipment/register/${eq.id}/edit`} className="btn btn-erp-ghost btn-sm" title="Edit">
                        <i className="fa-solid fa-pen" />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm text-danger"
                        title="Remove from register"
                        data-bs-toggle="modal"
                        data-bs-target="#deleteRecordModal"
                        data-record-name={`${eq.code} — ${eq.name}`}
                        onClick={() => setDeleteTarget(eq)}
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
                    Delete machine?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>{deleteTarget ? `${deleteTarget.code} — ${deleteTarget.name}` : ""}</strong> will be removed from active use. The record is
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
