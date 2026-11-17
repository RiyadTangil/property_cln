"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpEmptyState, ErpPageHeader } from "@/components/ui";
import { downloadCsv } from "@/lib/csv-client";

export interface InventoryUnitRow {
  id: number;
  buildingId: number;
  floorId: number;
  unitNumber: string;
  name: string | null;
  unitType: string;
  status: string;
  facing: string | null;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  parkingSlots: number;
  carpetArea: number | null;
  builtArea: number | null;
  superArea: number | null;
  price: number | null;
  ratePerSqft: number | null;
  handoverDate: string | null;
  ownerName: string | null;
  customerName: string | null;
  features: string | null;
  description: string | null;
  isCorner: boolean;
  building: { id: number; code: string; name: string; projectId: number | null };
  floor: { id: number; floorNumber: number; name: string | null };
}

const STATUS_STATS = [
  { key: "", label: "All units", icon: "", pill: "" },
  { key: "available", label: "Available", icon: "fa-solid fa-circle-check me-1", pill: "is-available" },
  { key: "reserved", label: "Reserved", icon: "fa-solid fa-bookmark me-1", pill: "is-hold" },
  { key: "booked", label: "Booked", icon: "fa-solid fa-file-signature me-1", pill: "is-booked" },
  { key: "sold", label: "Sold", icon: "fa-solid fa-handshake me-1", pill: "is-sold" },
  { key: "rented", label: "Rented", icon: "fa-solid fa-key me-1", pill: "is-booked" },
  { key: "handed_over", label: "Handed Over", icon: "fa-solid fa-house-circle-check me-1", pill: "is-sold" },
  { key: "blocked", label: "Blocked", icon: "fa-solid fa-ban me-1", pill: "is-overdue" },
  { key: "under_construction", label: "Under Construction", icon: "fa-solid fa-person-digging me-1", pill: "is-neutral" },
];

const TILE_TINT: Record<string, string> = {
  available: "is-available",
  reserved: "is-hold",
  booked: "is-booked",
  sold: "is-sold is-settled",
  rented: "is-booked is-settled",
  handed_over: "is-sold is-settled",
  blocked: "is-overdue",
  under_construction: "is-neutral",
};

export function UnitInventoryClient({
  units: initial,
  statusCounts,
  projects,
  buildings,
  floors,
  initialView = "stack",
}: {
  units: InventoryUnitRow[];
  statusCounts: Record<string, number>;
  projects: { id: number; code: string; name: string }[];
  buildings: { id: number; code: string; name: string; projectId: number | null }[];
  floors: { id: number; buildingId: number; floorNumber: number; name: string | null }[];
  initialView?: "stack" | "list";
}) {
  const router = useRouter();
  const [units, setUnits] = useState(initial);
  const [view, setView] = useState<"stack" | "list">(initialView);
  const [q, setQ] = useState("");
  const [projectId, setProjectId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [unitType, setUnitType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlySellable, setOnlySellable] = useState(false);

  const [editing, setEditing] = useState<InventoryUnitRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = units.filter((u) => {
    if (statusFilter && u.status !== statusFilter) return false;
    if (onlySellable && !["available", "under_construction"].includes(u.status)) return false;
    if (projectId && String(u.building.projectId ?? "") !== projectId) return false;
    if (buildingId && String(u.buildingId) !== buildingId) return false;
    if (unitType && u.unitType !== unitType) return false;
    if (bedrooms && String(u.bedrooms) !== bedrooms) return false;
    if (minPrice && (u.price ?? 0) < Number(minPrice)) return false;
    if (maxPrice && (u.price ?? 0) > Number(maxPrice)) return false;
    if (q) {
      const needle = q.toLowerCase();
      if (
        !u.unitNumber.toLowerCase().includes(needle) &&
        !(u.name ?? "").toLowerCase().includes(needle) &&
        !u.building.name.toLowerCase().includes(needle)
      ) {
        return false;
      }
    }
    return true;
  });

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/inventory/units/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floor_id: editing.floorId,
          unit_number: editing.unitNumber,
          name: editing.name,
          unit_type: editing.unitType,
          status: editing.status,
          facing: editing.facing,
          bedrooms: editing.bedrooms,
          bathrooms: editing.bathrooms,
          balconies: editing.balconies,
          parking_slots: editing.parkingSlots,
          carpet_area: editing.carpetArea,
          built_area: editing.builtArea,
          super_area: editing.superArea,
          price: editing.price,
          rate_per_sqft: editing.ratePerSqft,
          handover_date: editing.handoverDate,
          owner_name: editing.ownerName,
          customer_name: editing.customerName,
          features: editing.features,
          description: editing.description,
          is_corner: editing.isCorner,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to update unit");
        return;
      }
      const d = await res.json();
      setUnits((prev) => prev.map((x) => (x.id === editing.id ? d.unit : x)));
      setEditing(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  // Group by building -> floor for Stacking Chart
  const byBuilding = new Map<number, { building: InventoryUnitRow["building"]; floors: Map<number, { floor: InventoryUnitRow["floor"]; units: InventoryUnitRow[] }> }>();
  for (const u of filtered) {
    if (!byBuilding.has(u.buildingId)) {
      byBuilding.set(u.buildingId, { building: u.building, floors: new Map() });
    }
    const bEntry = byBuilding.get(u.buildingId)!;
    if (!bEntry.floors.has(u.floorId)) {
      bEntry.floors.set(u.floorId, { floor: u.floor, units: [] });
    }
    bEntry.floors.get(u.floorId)!.units.push(u);
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-building"
        title="Unit Inventory"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Inventory" }, { label: "Units" }]}
        actions={
          <>
            <div className="erp-view-toggle" role="group" aria-label="View">
              <button
                type="button"
                className="erp-view-toggle-btn border-0"
                title="Stacking chart"
                aria-pressed={view === "stack"}
                onClick={() => setView("stack")}
              >
                <i className="fa-solid fa-table-cells" />
              </button>
              <button
                type="button"
                className="erp-view-toggle-btn border-0"
                title="List"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <i className="fa-solid fa-list" />
              </button>
            </div>
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() =>
                downloadCsv(
                  "unit-inventory.csv",
                  ["Unit", "Building", "Floor", "Type", "Status", "Beds", "Built Area", "Price"],
                  filtered.map((u) => [u.unitNumber, u.building.name, u.floor.name || u.floor.floorNumber, u.unitType, u.status, u.bedrooms, u.builtArea, u.price])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2" />Export
            </button>
          </>
        }
      />

      <div className="erp-card mb-3">
        <div className="erp-card-body">
          <div className="erp-unit-stats">
            {STATUS_STATS.map((st) => {
              const count = st.key === "" ? (statusCounts.all ?? units.length) : (statusCounts[st.key] ?? 0);
              const isOn = statusFilter === st.key;
              return (
                <button
                  key={st.key || "all"}
                  type="button"
                  onClick={() => setStatusFilter(st.key)}
                  className={`erp-unit-stat ${st.pill}${isOn ? " is-on" : ""}`}
                >
                  <span className="erp-unit-stat-label">
                    {st.icon && <i className={st.icon} />}
                    {st.label}
                  </span>
                  <strong>{count}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-card-head">
          <form onSubmit={(e) => e.preventDefault()} className="erp-filter-grid">
            <div className="erp-search erp-search-sm erp-filter-wide">
              <i className="fa-solid fa-magnifying-glass" />
              <input type="search" name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search units…" aria-label="Search units" />
            </div>
            <select name="project_id" className="erp-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select name="building_id" className="erp-select" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
              <option value="">Building</option>
              {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select name="status" className="erp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Status</option>
              {STATUS_STATS.filter((s) => s.key).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select name="unit_type" className="erp-select" value={unitType} onChange={(e) => setUnitType(e.target.value)}>
              <option value="">Type</option>
              <option value="apartment">Apartment</option>
              <option value="studio">Studio</option>
              <option value="penthouse">Penthouse</option>
              <option value="duplex">Duplex</option>
              <option value="shop">Shop</option>
              <option value="office">Office</option>
              <option value="showroom">Showroom</option>
              <option value="warehouse">Warehouse</option>
              <option value="parking">Parking</option>
              <option value="other">Other</option>
            </select>
            <select name="bedrooms" className="erp-select" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
              <option value="">Beds</option>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? "bed" : "beds"}</option>)}
            </select>
            <input type="number" name="min_price" className="erp-select erp-filter-narrow" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            <input type="number" name="max_price" className="erp-select erp-filter-narrow" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            <div className="erp-filter-actions">
              <label className="erp-check" title="Hides flats a live sale already holds, not only sold ones">
                <input type="checkbox" name="only" checked={onlySellable} onChange={(e) => setOnlySellable(e.target.checked)} />
                <span>Sellable</span>
              </label>
              <button type="submit" className="btn btn-erp btn-sm">
                <i className="fa-solid fa-filter me-1" />Filter
              </button>
            </div>
          </form>
        </div>

        <div className="erp-card-body">
          {filtered.length === 0 ? (
            <ErpEmptyState
              icon="fa-solid fa-building"
              title="No apartments match"
              description="Apartments appear here once buildings have floors and units on them."
            />
          ) : view === "stack" ? (
            <div className="d-flex flex-column gap-4">
              {Array.from(byBuilding.values()).map(({ building, floors: floorMap }) => (
                <div key={building.id}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h3 className="h6 mb-0">
                      <Link href={`/buildings/${building.id}/floors`}>{building.name}</Link>
                      <span className="text-muted ms-2 small">{building.code}</span>
                    </h3>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {Array.from(floorMap.values()).map(({ floor, units: fUnits }) => (
                      <div key={floor.id}>
                        <div className="small text-muted fw-semibold mb-2">
                          {floor.name || `Floor ${floor.floorNumber}`} ({fUnits.length})
                        </div>
                        <div className="erp-unit-grid">
                          {fUnits.map((u) => (
                            <div
                              key={u.id}
                              className={`erp-unit-tile ${TILE_TINT[u.status] ?? "is-neutral"}`}
                              onClick={() => setEditing({ ...u })}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="erp-unit-tile-no">
                                <strong>{u.unitNumber}</strong>
                                {u.isCorner && <i className="fa-solid fa-circle erp-unit-tile-corner" title="Corner unit" />}
                              </div>
                              <div className="erp-unit-tile-spec">
                                <span className="text-capitalize">{u.unitType}</span>
                                {u.builtArea ? ` · ${u.builtArea} sf` : ""}
                              </div>
                              <div className="erp-unit-tile-price">
                                {u.price ? u.price.toLocaleString() : <span className="is-unpriced">Unpriced</span>}
                              </div>
                              <div className="erp-unit-tile-state text-capitalize">{u.status.replace("_", " ")}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table mb-0">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Building</th>
                    <th>Floor</th>
                    <th>Type</th>
                    <th className="text-center">Beds</th>
                    <th className="text-end">Built (sf)</th>
                    <th className="text-end">Price</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td className="erp-cell-strong">{u.unitNumber}</td>
                      <td>{u.building.name}</td>
                      <td>{u.floor.name || `Floor ${u.floor.floorNumber}`}</td>
                      <td className="text-capitalize">{u.unitType}</td>
                      <td className="text-center">{u.bedrooms}</td>
                      <td className="text-end">{u.builtArea ?? "—"}</td>
                      <td className="text-end">{u.price ? u.price.toLocaleString() : "—"}</td>
                      <td><span className={`erp-pill ${TILE_TINT[u.status]?.split(" ")[0] ?? "is-neutral"} text-capitalize`}>{u.status.replace("_", " ")}</span></td>
                      <td className="text-end">
                        <button type="button" className="btn btn-erp-ghost btn-sm" onClick={() => setEditing({ ...u })}>
                          <i className="fa-solid fa-pen" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <form className="modal-content erp-form" style={{ border: "none", borderRadius: 14 }} onSubmit={handleSaveEdit}>
              <div className="modal-body p-4">
                <h5 className="mb-3" style={{ fontSize: 16, fontWeight: 600 }}>
                  <i className="fa-solid fa-pen me-2 text-muted" />Edit {editing.unitNumber}
                </h5>
                {error && <div className="alert alert-danger py-2 px-3 mb-3">{error}</div>}
                <div className="row">
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Floor <span className="erp-required">*</span></label>
                    <select className="form-select" required value={editing.floorId} onChange={(e) => setEditing({ ...editing, floorId: Number(e.target.value) })}>
                      {floors.filter((f) => f.buildingId === editing.buildingId).map((f) => (
                        <option key={f.id} value={f.id}>{f.name || `Floor ${f.floorNumber}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Unit No. <span className="erp-required">*</span></label>
                    <input className="form-control" required maxLength={40} value={editing.unitNumber} onChange={(e) => setEditing({ ...editing, unitNumber: e.target.value })} />
                  </div>
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Name</label>
                    <input className="form-control" maxLength={120} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  </div>

                  <div className="col-md-4 erp-field">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={editing.unitType} onChange={(e) => setEditing({ ...editing, unitType: e.target.value })}>
                      <option value="apartment">Apartment</option>
                      <option value="studio">Studio</option>
                      <option value="penthouse">Penthouse</option>
                      <option value="duplex">Duplex</option>
                      <option value="shop">Shop</option>
                      <option value="office">Office</option>
                      <option value="showroom">Showroom</option>
                      <option value="warehouse">Warehouse</option>
                      <option value="parking">Parking</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                      {STATUS_STATS.filter((s) => s.key).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Facing</label>
                    <select className="form-select" value={editing.facing ?? ""} onChange={(e) => setEditing({ ...editing, facing: e.target.value || null })}>
                      <option value="">—</option>
                      <option value="north">North</option>
                      <option value="south">South</option>
                      <option value="east">East</option>
                      <option value="west">West</option>
                      <option value="north_east">North-East</option>
                      <option value="north_west">North-West</option>
                      <option value="south_east">South-East</option>
                      <option value="south_west">South-West</option>
                    </select>
                  </div>

                  <div className="col-md-3 erp-field"><label className="form-label">Bedrooms</label><input type="number" min={0} className="form-control" value={editing.bedrooms} onChange={(e) => setEditing({ ...editing, bedrooms: Number(e.target.value) || 0 })} /></div>
                  <div className="col-md-3 erp-field"><label className="form-label">Bathrooms</label><input type="number" min={0} className="form-control" value={editing.bathrooms} onChange={(e) => setEditing({ ...editing, bathrooms: Number(e.target.value) || 0 })} /></div>
                  <div className="col-md-3 erp-field"><label className="form-label">Balconies</label><input type="number" min={0} className="form-control" value={editing.balconies} onChange={(e) => setEditing({ ...editing, balconies: Number(e.target.value) || 0 })} /></div>
                  <div className="col-md-3 erp-field"><label className="form-label">Parking</label><input type="number" min={0} className="form-control" value={editing.parkingSlots} onChange={(e) => setEditing({ ...editing, parkingSlots: Number(e.target.value) || 0 })} /></div>

                  <div className="col-md-4 erp-field"><label className="form-label">Carpet Area (sf)</label><input type="number" step="0.01" className="form-control" value={editing.carpetArea ?? ""} onChange={(e) => setEditing({ ...editing, carpetArea: e.target.value ? Number(e.target.value) : null })} /></div>
                  <div className="col-md-4 erp-field"><label className="form-label">Built Area (sf)</label><input type="number" step="0.01" className="form-control" value={editing.builtArea ?? ""} onChange={(e) => setEditing({ ...editing, builtArea: e.target.value ? Number(e.target.value) : null })} /></div>
                  <div className="col-md-4 erp-field"><label className="form-label">Super Area (sf)</label><input type="number" step="0.01" className="form-control" value={editing.superArea ?? ""} onChange={(e) => setEditing({ ...editing, superArea: e.target.value ? Number(e.target.value) : null })} /></div>

                  <div className="col-md-4 erp-field"><label className="form-label">Price</label><input type="number" step="0.01" className="form-control" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: e.target.value ? Number(e.target.value) : null })} /></div>
                  <div className="col-md-4 erp-field"><label className="form-label">Rate / sq ft</label><input type="number" step="0.01" className="form-control" value={editing.ratePerSqft ?? ""} onChange={(e) => setEditing({ ...editing, ratePerSqft: e.target.value ? Number(e.target.value) : null })} /></div>
                  <div className="col-md-4 erp-field"><label className="form-label">Handover Date</label><input type="date" className="form-control" value={editing.handoverDate ?? ""} onChange={(e) => setEditing({ ...editing, handoverDate: e.target.value || null })} /></div>

                  <div className="col-md-6 erp-field"><label className="form-label">Owner</label><input className="form-control" maxLength={190} value={editing.ownerName ?? ""} onChange={(e) => setEditing({ ...editing, ownerName: e.target.value || null })} /></div>
                  <div className="col-md-6 erp-field"><label className="form-label">Customer / Buyer</label><input className="form-control" maxLength={190} value={editing.customerName ?? ""} onChange={(e) => setEditing({ ...editing, customerName: e.target.value || null })} /></div>

                  <div className="col-md-12 erp-field"><label className="form-label">Features</label><input className="form-control" maxLength={1000} placeholder="Servant room, store, modular kitchen…" value={editing.features ?? ""} onChange={(e) => setEditing({ ...editing, features: e.target.value || null })} /></div>
                  <div className="col-md-12 erp-field mb-1"><label className="form-label">Description</label><input className="form-control" maxLength={1000} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value || null })} /></div>
                </div>
                <label className="erp-check"><input type="checkbox" checked={editing.isCorner} onChange={(e) => setEditing({ ...editing, isCorner: e.target.checked })} /><span>Corner unit</span></label>
              </div>
              <div className="modal-footer" style={{ borderTop: "1px solid var(--erp-line)" }}>
                <button type="button" className="btn btn-erp-ghost" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
