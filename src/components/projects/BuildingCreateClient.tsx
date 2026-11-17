"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export function BuildingCreateClient({
  projects,
  parcels,
  initialBuilding,
}: {
  projects: { id: number; code: string; name: string }[];
  parcels: { id: number; code: string; title: string | null; mouza: string }[];
  initialBuilding?: {
    id: number;
    name: string;
    buildingType: string;
    status: string;
    projectId: number | null;
    landParcelId: number | null;
    ownerName: string | null;
    developerName: string | null;
    description: string | null;
    isActive: boolean;
    location: string | null;
    city: string | null;
    district: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    floorsAbove: number;
    floorsBelow: number;
    totalUnits: number;
    landArea: number | null;
    builtArea: number | null;
    lifts: number;
    parkingSpaces: number;
    hasGenerator: boolean;
    hasSecurity: boolean;
    hasFireSafety: boolean;
    amenities: string | null;
    constructionStartDate: string | null;
    completionDate: string | null;
    handoverDate: string | null;
    occupancyDate: string | null;
    constructionCost: number | null;
    currentValue: number | null;
  };
}) {
  const router = useRouter();
  const isEdit = Boolean(initialBuilding);
  const [tab, setTab] = useState<"basic" | "location" | "structure" | "facilities" | "dates">("basic");
  const [form, setForm] = useState({
    name: initialBuilding?.name ?? "",
    building_type: initialBuilding?.buildingType ?? "residential",
    status: initialBuilding?.status ?? "completed",
    project_id: initialBuilding?.projectId ? String(initialBuilding.projectId) : "",
    land_parcel_id: initialBuilding?.landParcelId ? String(initialBuilding.landParcelId) : "",
    owner_name: initialBuilding?.ownerName ?? "",
    developer_name: initialBuilding?.developerName ?? "",
    description: initialBuilding?.description ?? "",
    is_active: initialBuilding?.isActive ?? true,
    location: initialBuilding?.location ?? "",
    city: initialBuilding?.city ?? "",
    district: initialBuilding?.district ?? "",
    state: initialBuilding?.state ?? "",
    postal_code: initialBuilding?.postalCode ?? "",
    country: initialBuilding?.country ?? "BD",
    latitude: initialBuilding?.latitude !== null && initialBuilding?.latitude !== undefined ? String(initialBuilding.latitude) : "",
    longitude: initialBuilding?.longitude !== null && initialBuilding?.longitude !== undefined ? String(initialBuilding.longitude) : "",
    floors_above: String(initialBuilding?.floorsAbove ?? 0),
    floors_below: String(initialBuilding?.floorsBelow ?? 0),
    total_units: String(initialBuilding?.totalUnits ?? 0),
    land_area: initialBuilding?.landArea !== null && initialBuilding?.landArea !== undefined ? String(initialBuilding.landArea) : "",
    built_area: initialBuilding?.builtArea !== null && initialBuilding?.builtArea !== undefined ? String(initialBuilding.builtArea) : "",
    lifts: String(initialBuilding?.lifts ?? 0),
    parking_spaces: String(initialBuilding?.parkingSpaces ?? 0),
    has_generator: initialBuilding?.hasGenerator ?? false,
    has_security: initialBuilding?.hasSecurity ?? false,
    has_fire_safety: initialBuilding?.hasFireSafety ?? false,
    amenities: initialBuilding?.amenities ?? "",
    construction_start_date: initialBuilding?.constructionStartDate ?? "",
    completion_date: initialBuilding?.completionDate ?? "",
    handover_date: initialBuilding?.handoverDate ?? "",
    occupancy_date: initialBuilding?.occupancyDate ?? "",
    construction_cost: initialBuilding?.constructionCost !== null && initialBuilding?.constructionCost !== undefined ? String(initialBuilding.constructionCost) : "",
    current_value: initialBuilding?.currentValue !== null && initialBuilding?.currentValue !== undefined ? String(initialBuilding.currentValue) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `/api/buildings/${initialBuilding!.id}` : "/api/buildings";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          project_id: form.project_id ? Number(form.project_id) : null,
          land_parcel_id: form.land_parcel_id ? Number(form.land_parcel_id) : null,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          floors_above: Number(form.floors_above) || 0,
          floors_below: Number(form.floors_below) || 0,
          total_units: Number(form.total_units) || 0,
          land_area: form.land_area ? Number(form.land_area) : null,
          built_area: form.built_area ? Number(form.built_area) : null,
          lifts: Number(form.lifts) || 0,
          parking_spaces: Number(form.parking_spaces) || 0,
          construction_cost: form.construction_cost ? Number(form.construction_cost) : null,
          current_value: form.current_value ? Number(form.current_value) : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to save building");
        return;
      }
      router.push(isEdit ? `/buildings/${initialBuilding!.id}` : "/buildings");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "basic", label: "Basic", icon: "fa-solid fa-circle-info" },
    { id: "location", label: "Location", icon: "fa-solid fa-location-dot" },
    { id: "structure", label: "Structure", icon: "fa-solid fa-layer-group" },
    { id: "facilities", label: "Facilities", icon: "fa-solid fa-elevator" },
    { id: "dates", label: "Dates & Financials", icon: "fa-solid fa-calendar-check" },
  ] as const;

  return (
    <div className="container">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon="fa-solid fa-building"
        title={isEdit ? `Edit ${initialBuilding!.name}` : "New Building"}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Buildings", href: "/buildings" },
          { label: isEdit ? "Edit" : "New" },
        ]}
      />

      {error && <div className="alert alert-danger mt-2">{error}</div>}

      <div className="erp-card">
        <form onSubmit={handleSubmit} className="erp-form">
          <ul className="nav erp-tabs" role="tablist">
            {tabs.map((t) => (
              <li key={t.id} role="presentation">
                <button
                  type="button"
                  role="tab"
                  className={`erp-tab${tab === t.id ? " active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  <i className={t.icon} />
                  <span className="erp-tab-label">{t.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="tab-content">
            {tab === "basic" && (
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label className="form-label">Building Name <span className="erp-required">*</span></label>
                      <input type="text" name="name" className="form-control" required maxLength={190} value={form.name} onChange={(e) => set("name", e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label className="form-label">Type <span className="erp-required">*</span></label>
                      <select name="building_type" className="form-select" value={form.building_type} onChange={(e) => set("building_type", e.target.value)}>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="mixed_use">Mixed Use</option>
                        <option value="industrial">Industrial</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label className="form-label">Status <span className="erp-required">*</span></label>
                      <select name="status" className="form-select" value={form.status} onChange={(e) => set("status", e.target.value)}>
                        <option value="under_construction">Under Construction</option>
                        <option value="completed">Completed</option>
                        <option value="handover">Handover</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label className="form-label">Source Project</label>
                      <select name="project_id" className="form-select" value={form.project_id} onChange={(e) => set("project_id", e.target.value)}>
                        <option value="">— None (standalone) —</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label className="form-label">Land Parcel</label>
                      <select name="land_parcel_id" className="form-select" value={form.land_parcel_id} onChange={(e) => set("land_parcel_id", e.target.value)}>
                        <option value="">— Not linked to acquired land —</option>
                        {parcels.map((lp) => <option key={lp.id} value={lp.id}>{lp.code} · {lp.title || lp.mouza}</option>)}
                      </select>
                      <span className="erp-help">Ties this building back to the deed, the registration and what the land cost.</span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label className="form-label">Owner</label>
                      <input type="text" name="owner_name" className="form-control" maxLength={190} value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label className="form-label">Developer</label>
                      <input type="text" name="developer_name" className="form-control" maxLength={190} value={form.developer_name} onChange={(e) => set("developer_name", e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="erp-field mb-0">
                      <label className="form-label">Description</label>
                      <textarea name="description" rows={2} className="form-control" maxLength={2000} value={form.description} onChange={(e) => set("description", e.target.value)} />
                    </div>
                  </div>
                </div>
                <label className="erp-check mt-2">
                  <input type="checkbox" name="is_active" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                  <span>Active</span>
                </label>
              </div>
            )}

            {tab === "location" && (
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-12"><div className="erp-field"><label className="form-label">Street / Location</label><input type="text" name="location" className="form-control" maxLength={255} value={form.location} onChange={(e) => set("location", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">City</label><input type="text" name="city" className="form-control" maxLength={120} value={form.city} onChange={(e) => set("city", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">District</label><input type="text" name="district" className="form-control" maxLength={120} value={form.district} onChange={(e) => set("district", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">State / Division</label><input type="text" name="state" className="form-control" maxLength={120} value={form.state} onChange={(e) => set("state", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">ZIP</label><input type="text" name="postal_code" className="form-control" maxLength={20} value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} /></div></div>
                  <div className="col-md-2"><div className="erp-field mb-0"><label className="form-label">Country</label><input type="text" name="country" className="form-control" maxLength={2} placeholder="BD" value={form.country} onChange={(e) => set("country", e.target.value)} /></div></div>
                  <div className="col-md-5"><div className="erp-field mb-0"><label className="form-label">Latitude</label><input type="number" step="0.0000001" name="latitude" className="form-control" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} /></div></div>
                  <div className="col-md-5"><div className="erp-field mb-0"><label className="form-label">Longitude</label><input type="number" step="0.0000001" name="longitude" className="form-control" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} /></div></div>
                </div>
              </div>
            )}

            {tab === "structure" && (
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">Floors (above ground)</label><input type="number" min={0} name="floors_above" className="form-control" value={form.floors_above} onChange={(e) => set("floors_above", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">Basements</label><input type="number" min={0} name="floors_below" className="form-control" value={form.floors_below} onChange={(e) => set("floors_below", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">Total Units</label><input type="number" min={0} name="total_units" className="form-control" value={form.total_units} onChange={(e) => set("total_units", e.target.value)} /></div></div>
                  <div className="col-md-3" />
                  <div className="col-md-3"><div className="erp-field mb-0"><label className="form-label">Land Area (sq ft)</label><input type="number" step="0.01" min={0} name="land_area" className="form-control" value={form.land_area} onChange={(e) => set("land_area", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field mb-0"><label className="form-label">Built Area (sq ft)</label><input type="number" step="0.01" min={0} name="built_area" className="form-control" value={form.built_area} onChange={(e) => set("built_area", e.target.value)} /></div></div>
                </div>
              </div>
            )}

            {tab === "facilities" && (
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">Lifts</label><input type="number" min={0} name="lifts" className="form-control" value={form.lifts} onChange={(e) => set("lifts", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">Parking Spaces</label><input type="number" min={0} name="parking_spaces" className="form-control" value={form.parking_spaces} onChange={(e) => set("parking_spaces", e.target.value)} /></div></div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label className="form-label d-block">Amenities</label>
                      <label className="erp-check me-3"><input type="checkbox" checked={form.has_generator} onChange={(e) => set("has_generator", e.target.checked)} /><span>Generator</span></label>
                      <label className="erp-check me-3"><input type="checkbox" checked={form.has_security} onChange={(e) => set("has_security", e.target.checked)} /><span>Security</span></label>
                      <label className="erp-check"><input type="checkbox" checked={form.has_fire_safety} onChange={(e) => set("has_fire_safety", e.target.checked)} /><span>Fire safety</span></label>
                    </div>
                  </div>
                  <div className="col-md-12"><div className="erp-field mb-0"><label className="form-label">Other Amenities</label><input type="text" name="amenities" className="form-control" maxLength={1000} placeholder="Gym, rooftop garden, community hall…" value={form.amenities} onChange={(e) => set("amenities", e.target.value)} /></div></div>
                </div>
              </div>
            )}

            {tab === "dates" && (
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">Construction Start</label><input type="date" name="construction_start_date" className="form-control" value={form.construction_start_date} onChange={(e) => set("construction_start_date", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">Completion</label><input type="date" name="completion_date" className="form-control" value={form.completion_date} onChange={(e) => set("completion_date", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">Handover</label><input type="date" name="handover_date" className="form-control" value={form.handover_date} onChange={(e) => set("handover_date", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field"><label className="form-label">Occupancy</label><input type="date" name="occupancy_date" className="form-control" value={form.occupancy_date} onChange={(e) => set("occupancy_date", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field mb-0"><label className="form-label">Construction Cost</label><input type="number" step="0.01" min={0} name="construction_cost" className="form-control" value={form.construction_cost} onChange={(e) => set("construction_cost", e.target.value)} /></div></div>
                  <div className="col-md-3"><div className="erp-field mb-0"><label className="form-label">Current Value</label><input type="number" step="0.01" min={0} name="current_value" className="form-control" value={form.current_value} onChange={(e) => set("current_value", e.target.value)} /></div></div>
                </div>
              </div>
            )}
          </div>

          <div className="erp-card-foot d-flex">
            <Link href={isEdit ? `/buildings/${initialBuilding!.id}` : "/buildings"} className="btn btn-erp-ghost">Cancel</Link>
            <button type="submit" className="btn btn-erp ms-auto" disabled={saving}>
              <i className="fa-solid fa-floppy-disk me-2" />{saving ? "Saving..." : isEdit ? "Save Changes" : "Create Building"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
