"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

interface UnitItem {
  id: number;
  unitNumber: string;
  name: string | null;
  unitType: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  builtArea: number | null;
  price: number | null;
}

interface FloorItem {
  id: number;
  floorNumber: number;
  name: string | null;
  floorType: string;
  unitsPlanned: number;
  area: number | null;
  height: number | null;
  units: UnitItem[];
}

export function BuildingFloorsClient({
  building,
}: {
  building: { id: number; code: string; name: string; floors: FloorItem[] };
}) {
  const router = useRouter();
  const [floors, setFloors] = useState(building.floors);
  const [modal, setModal] = useState<null | "floor" | "floors_bulk" | "unit" | "units_bulk">(null);
  const [busy, setBusy] = useState(false);

  // Single floor
  const [floorNumber, setFloorNumber] = useState("0");
  const [floorName, setFloorName] = useState("");
  const [floorType, setFloorType] = useState("ground");
  const [unitsPlanned, setUnitsPlanned] = useState("0");
  const [floorArea, setFloorArea] = useState("");
  const [floorHeight, setFloorHeight] = useState("");

  // Bulk floors
  const [fromFloor, setFromFloor] = useState("1");
  const [toFloor, setToFloor] = useState("10");
  const [bulkFloorType, setBulkFloorType] = useState("residential");
  const [bulkUnitsPerFloor, setBulkUnitsPerFloor] = useState("4");

  // Single unit
  const [unitFloorId, setUnitFloorId] = useState(String(floors[0]?.id ?? ""));
  const [unitNumber, setUnitNumber] = useState("");
  const [unitType, setUnitType] = useState("apartment");
  const [unitStatus, setUnitStatus] = useState("available");
  const [unitBedrooms, setUnitBedrooms] = useState("3");
  const [unitBathrooms, setUnitBathrooms] = useState("2");
  const [unitBuiltArea, setUnitBuiltArea] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  // Bulk units
  const [genUnitsPerFloor, setGenUnitsPerFloor] = useState("4");
  const [genPrefix, setGenPrefix] = useState("A-");
  const [genType, setGenType] = useState("apartment");

  const totalUnits = floors.reduce((s, f) => s + f.units.length, 0);

  async function handleAddFloor(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/buildings/${building.id}/floors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floor_number: Number(floorNumber),
          name: floorName || null,
          floor_type: floorType,
          units_planned: Number(unitsPlanned) || 0,
          area: floorArea ? Number(floorArea) : null,
          height: floorHeight ? Number(floorHeight) : null,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setFloors((prev) => [...prev, d.floor].sort((a, b) => a.floorNumber - b.floorNumber));
        setModal(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleBulkFloors(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/buildings/${building.id}/floors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "bulk",
          from_floor: Number(fromFloor),
          to_floor: Number(toFloor),
          floor_type: bulkFloorType,
          units_planned: Number(bulkUnitsPerFloor) || 0,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setFloors((prev) => [...prev, ...d.floors].sort((a, b) => a.floorNumber - b.floorNumber));
        setModal(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleAddUnit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/buildings/${building.id}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floor_id: Number(unitFloorId || floors[0]?.id),
          unit_number: unitNumber,
          unit_type: unitType,
          status: unitStatus,
          bedrooms: Number(unitBedrooms) || 0,
          bathrooms: Number(unitBathrooms) || 0,
          built_area: unitBuiltArea ? Number(unitBuiltArea) : null,
          price: unitPrice ? Number(unitPrice) : null,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setFloors((prev) =>
          prev.map((f) => (f.id === d.unit.floorId ? { ...f, units: [...f.units, d.unit] } : f))
        );
        setUnitNumber("");
        setModal(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerateUnits(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/buildings/${building.id}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "bulk",
          floor_ids: floors.map((f) => f.id),
          units_per_floor: Number(genUnitsPerFloor) || 2,
          prefix: genPrefix,
          unit_type: genType,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        const byFloor = new Map<number, UnitItem[]>();
        for (const u of d.units as (UnitItem & { floorId: number })[]) {
          const arr = byFloor.get(u.floorId) ?? [];
          arr.push(u);
          byFloor.set(u.floorId, arr);
        }
        setFloors((prev) =>
          prev.map((f) => ({ ...f, units: [...f.units, ...(byFloor.get(f.id) ?? [])] }))
        );
        setModal(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon="fa-solid fa-building"
        title={building.name}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Buildings", href: "/buildings" },
          { label: building.code, href: `/buildings/${building.id}` },
          { label: "Floors & Units" },
        ]}
        actions={
          <Link href={`/buildings/${building.id}`} className="btn btn-erp-ghost">
            <i className="fa-solid fa-circle-info me-2" />Overview
          </Link>
        }
      />

      <ul className="nav erp-tabs erp-tabs-nav" role="tablist">
        <li role="presentation">
          <Link className="erp-tab" href={`/buildings/${building.id}`}>
            <i className="fa-solid fa-circle-info" /><span className="erp-tab-label">Overview</span>
          </Link>
        </li>
        <li role="presentation">
          <Link className="erp-tab active" href={`/buildings/${building.id}/floors`}>
            <i className="fa-solid fa-stairs" /><span className="erp-tab-label">Floors &amp; Units</span>
          </Link>
        </li>
      </ul>

      <div className="erp-card">
        <div className="erp-rec-head">
          <span className="erp-rec-avatar" style={{ background: "linear-gradient(135deg,#b45309,#92400e)" }}>
            <i className="fa-solid fa-stairs" />
          </span>
          <div className="erp-rec-id">
            <h2>Floors &amp; Units</h2>
            <p>Plan the building floor-by-floor and manage each unit.</p>
          </div>
          <div className="d-flex flex-wrap gap-2 ms-auto">
            <button type="button" className="btn btn-erp-ghost btn-sm" onClick={() => setModal("floors_bulk")}>
              <i className="fa-solid fa-layer-group me-1" />Add Floors
            </button>
            <button type="button" className="btn btn-erp-ghost btn-sm" disabled={floors.length === 0} onClick={() => setModal("units_bulk")}>
              <i className="fa-solid fa-table-cells me-1" />Generate Units
            </button>
            {floors.length > 0 && (
              <button type="button" className="btn btn-erp-ghost btn-sm" onClick={() => { setUnitFloorId(String(floors[0].id)); setModal("unit"); }}>
                <i className="fa-solid fa-door-closed me-1" />Add Unit
              </button>
            )}
            <button type="button" className="btn btn-erp btn-sm" onClick={() => setModal("floor")}>
              <i className="fa-solid fa-plus me-1" />Add Floor
            </button>
          </div>
        </div>

        <div className="erp-rec-section">
          <div className="erp-plan-summary mb-3">
            <span className="erp-taskdetail-label">{floors.length} floors · {totalUnits} units</span>
          </div>

          {floors.length === 0 ? (
            <p className="erp-cv-empty mb-0">No floors yet. Add the first floor to start planning units.</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {floors.map((fl) => (
                <div key={fl.id} className="border rounded p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <strong>{fl.name || `Floor ${fl.floorNumber}`}</strong>
                      <span className="erp-pill is-neutral ms-2 text-capitalize">{fl.floorType}</span>
                      <span className="text-muted small ms-2">{fl.units.length} units</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm"
                      onClick={() => { setUnitFloorId(String(fl.id)); setModal("unit"); }}
                    >
                      + Unit
                    </button>
                  </div>
                  {fl.units.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {fl.units.map((u) => (
                        <span key={u.id} className="erp-pill is-available">
                          {u.unitNumber} · {u.unitType} {u.builtArea ? `(${u.builtArea} sf)` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal === "floor" && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleAddFloor}>
              <div className="modal-header"><h5 className="modal-title">Add floor</h5><button type="button" className="btn-close" onClick={() => setModal(null)} /></div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4 erp-field">
                    <label className="form-label">Floor No. <span className="erp-required">*</span></label>
                    <input type="number" className="form-control" required value={floorNumber} onChange={(e) => setFloorNumber(e.target.value)} />
                  </div>
                  <div className="col-md-8 erp-field">
                    <label className="form-label">Name</label>
                    <input className="form-control" placeholder="e.g. Ground Floor" value={floorName} onChange={(e) => setFloorName(e.target.value)} />
                  </div>
                  <div className="col-md-6 erp-field">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={floorType} onChange={(e) => setFloorType(e.target.value)}>
                      <option value="basement">Basement</option>
                      <option value="ground">Ground Floor</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="parking">Parking</option>
                      <option value="roof">Roof</option>
                    </select>
                  </div>
                  <div className="col-md-6 erp-field">
                    <label className="form-label">Units Planned</label>
                    <input type="number" min={0} className="form-control" value={unitsPlanned} onChange={(e) => setUnitsPlanned(e.target.value)} />
                  </div>
                  <div className="col-md-6 erp-field mb-0"><label className="form-label">Floor Area (sq ft)</label><input type="number" step="0.01" className="form-control" value={floorArea} onChange={(e) => setFloorArea(e.target.value)} /></div>
                  <div className="col-md-6 erp-field mb-0"><label className="form-label">Height (ft)</label><input type="number" step="0.01" className="form-control" value={floorHeight} onChange={(e) => setFloorHeight(e.target.value)} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "floors_bulk" && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleBulkFloors}>
              <div className="modal-header"><h5 className="modal-title">Add floors</h5><button type="button" className="btn-close" onClick={() => setModal(null)} /></div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-6 erp-field"><label className="form-label">From Floor</label><input type="number" className="form-control" required value={fromFloor} onChange={(e) => setFromFloor(e.target.value)} /></div>
                  <div className="col-6 erp-field"><label className="form-label">To Floor</label><input type="number" className="form-control" required value={toFloor} onChange={(e) => setToFloor(e.target.value)} /></div>
                  <div className="col-6 erp-field mb-0">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={bulkFloorType} onChange={(e) => setBulkFloorType(e.target.value)}>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="parking">Parking</option>
                    </select>
                  </div>
                  <div className="col-6 erp-field mb-0"><label className="form-label">Units / Floor</label><input type="number" min={0} className="form-control" value={bulkUnitsPerFloor} onChange={(e) => setBulkUnitsPerFloor(e.target.value)} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "unit" && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleAddUnit}>
              <div className="modal-header"><h5 className="modal-title">Add unit</h5><button type="button" className="btn-close" onClick={() => setModal(null)} /></div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-6 erp-field">
                    <label className="form-label">Floor</label>
                    <select className="form-select" value={unitFloorId} onChange={(e) => setUnitFloorId(e.target.value)}>
                      {floors.map((f) => <option key={f.id} value={f.id}>{f.name || `Floor ${f.floorNumber}`}</option>)}
                    </select>
                  </div>
                  <div className="col-6 erp-field"><label className="form-label">Unit No. <span className="erp-required">*</span></label><input className="form-control" required placeholder="A-101" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} /></div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={unitType} onChange={(e) => setUnitType(e.target.value)}>
                      <option value="apartment">Apartment</option>
                      <option value="studio">Studio</option>
                      <option value="penthouse">Penthouse</option>
                      <option value="shop">Shop</option>
                      <option value="office">Office</option>
                    </select>
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={unitStatus} onChange={(e) => setUnitStatus(e.target.value)}>
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="booked">Booked</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                  <div className="col-3 erp-field mb-0"><label className="form-label">Beds</label><input type="number" className="form-control" value={unitBedrooms} onChange={(e) => setUnitBedrooms(e.target.value)} /></div>
                  <div className="col-3 erp-field mb-0"><label className="form-label">Baths</label><input type="number" className="form-control" value={unitBathrooms} onChange={(e) => setUnitBathrooms(e.target.value)} /></div>
                  <div className="col-3 erp-field mb-0"><label className="form-label">Built (sf)</label><input type="number" className="form-control" value={unitBuiltArea} onChange={(e) => setUnitBuiltArea(e.target.value)} /></div>
                  <div className="col-3 erp-field mb-0"><label className="form-label">Price</label><input type="number" className="form-control" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "units_bulk" && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleGenerateUnits}>
              <div className="modal-header"><h5 className="modal-title">Generate units</h5><button type="button" className="btn-close" onClick={() => setModal(null)} /></div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-4 erp-field mb-0"><label className="form-label">Units / Floor</label><input type="number" min={1} max={26} className="form-control" value={genUnitsPerFloor} onChange={(e) => setGenUnitsPerFloor(e.target.value)} /></div>
                  <div className="col-4 erp-field mb-0"><label className="form-label">Prefix</label><input className="form-control" value={genPrefix} onChange={(e) => setGenPrefix(e.target.value)} /></div>
                  <div className="col-4 erp-field mb-0">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={genType} onChange={(e) => setGenType(e.target.value)}>
                      <option value="apartment">Apartment</option>
                      <option value="office">Office</option>
                      <option value="shop">Shop</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
