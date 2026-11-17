"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export function BuildingCreateClient({
  projects,
  parcels,
}: {
  projects: { id: number; code: string; name: string }[];
  parcels: { id: number; code: string; title: string | null; mouza: string }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"basic" | "location" | "structure" | "facilities" | "dates">("basic");
  const [form, setForm] = useState({
    name: "",
    building_type: "residential",
    status: "under_construction",
    project_id: "",
    land_parcel_id: "",
    owner_name: "",
    developer_name: "",
    description: "",
    is_active: true,
    location: "",
    city: "",
    district: "",
    state: "",
    postal_code: "",
    country: "BD",
    latitude: "",
    longitude: "",
    floors_above: "0",
    floors_below: "0",
    total_units: "0",
    land_area: "",
    built_area: "",
    lifts: "0",
    parking_spaces: "0",
    has_generator: false,
    has_security: false,
    has_fire_safety: false,
    amenities: "",
    construction_start_date: "",
    completion_date: "",
    handover_date: "",
    occupancy_date: "",
    construction_cost: "",
    current_value: "",
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
      const res = await fetch("/api/buildings", {
        method: "POST",
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
        setError(d.error || "Failed to create building");
        return;
      }
      router.push("/buildings");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon="fa-solid fa-building"
        title="New Building"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Buildings", href: "/buildings" },
          { label: "New" },
        ]}
        actions={
          <Link href="/buildings" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2" />Back to list
          </Link>
        }
      />

      {error && <div className="alert alert-danger mt-2">{error}</div>}

      <div className="erp-card">
        <div className="erp-card-head pb-0 border-bottom-0">
          <ul className="nav nav-tabs erp-tabs" role="tablist">
            {(
              [
                ["basic", "Basic"],
                ["location", "Location"],
                ["structure", "Structure"],
                ["facilities", "Facilities"],
                ["dates", "Dates & Financials"],
              ] as const
            ).map(([id, label]) => (
              <li key={id} className="nav-item">
                <button
                  type="button"
                  className={`nav-link${tab === id ? " active" : ""}`}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="erp-card-body">
            {tab === "basic" && (
              <div className="row">
                <div className="col-md-6 erp-field">
                  <label className="form-label">Name <span className="erp-required">*</span></label>
                  <input type="text" name="name" className="form-control" required maxLength={190} value={form.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div className="col-md-3 erp-field">
                  <label className="form-label">Building Type</label>
                  <select name="building_type" className="form-select" value={form.building_type} onChange={(e) => set("building_type", e.target.value)}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed_use">Mixed Use</option>
                    <option value="industrial">Industrial</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-3 erp-field">
                  <label className="form-label">Status</label>
                  <select name="status" className="form-select" value={form.status} onChange={(e) => set("status", e.target.value)}>
                    <option value="under_construction">Under Construction</option>
                    <option value="completed">Completed</option>
                    <option value="handover">Handover</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="col-md-6 erp-field">
                  <label className="form-label">Project</label>
                  <select name="project_id" className="form-select" value={form.project_id} onChange={(e) => set("project_id", e.target.value)}>
                    <option value="">— None (standalone) —</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
                  </select>
                </div>
                <div className="col-md-6 erp-field">
                  <label className="form-label">Land Parcel</label>
                  <select name="land_parcel_id" className="form-select" value={form.land_parcel_id} onChange={(e) => set("land_parcel_id", e.target.value)}>
                    <option value="">— Not linked to acquired land —</option>
                    {parcels.map((lp) => <option key={lp.id} value={lp.id}>{lp.code} · {lp.title || lp.mouza}</option>)}
                  </select>
                </div>
                <div className="col-md-6 erp-field">
                  <label className="form-label">Owner Name</label>
                  <input type="text" name="owner_name" className="form-control" maxLength={190} value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
                </div>
                <div className="col-md-6 erp-field">
                  <label className="form-label">Developer Name</label>
                  <input type="text" name="developer_name" className="form-control" maxLength={190} value={form.developer_name} onChange={(e) => set("developer_name", e.target.value)} />
                </div>
                <div className="col-12 erp-field">
                  <label className="form-label">Description</label>
                  <textarea name="description" className="form-control" rows={3} maxLength={2000} value={form.description} onChange={(e) => set("description", e.target.value)} />
                </div>
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input type="checkbox" className="form-check-input" id="is_active" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                    <label htmlFor="is_active" className="form-check-label">Active</label>
                  </div>
                </div>
              </div>
            )}

            {tab === "location" && (
              <div className="row">
                <div className="col-md-12 erp-field"><label className="form-label">Location / Street</label><input type="text" name="location" className="form-control" maxLength={255} value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
                <div className="col-md-4 erp-field"><label className="form-label">City</label><input type="text" name="city" className="form-control" maxLength={120} value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
                <div className="col-md-4 erp-field"><label className="form-label">District</label><input type="text" name="district" className="form-control" maxLength={120} value={form.district} onChange={(e) => set("district", e.target.value)} /></div>
                <div className="col-md-4 erp-field"><label className="form-label">State</label><input type="text" name="state" className="form-control" maxLength={120} value={form.state} onChange={(e) => set("state", e.target.value)} /></div>
                <div className="col-md-2 erp-field mb-0"><label className="form-label">Postal Code</label><input type="text" name="postal_code" className="form-control" maxLength={20} value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} /></div>
                <div className="col-md-2 erp-field mb-0"><label className="form-label">Country</label><input type="text" name="country" className="form-control" maxLength={2} value={form.country} onChange={(e) => set("country", e.target.value)} /></div>
                <div className="col-md-4 erp-field mb-0"><label className="form-label">Latitude</label><input type="number" step="0.0000001" name="latitude" className="form-control" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} /></div>
                <div className="col-md-4 erp-field mb-0"><label className="form-label">Longitude</label><input type="number" step="0.0000001" name="longitude" className="form-control" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} /></div>
              </div>
            )}

            {tab === "structure" && (
              <div className="row">
                <div className="col-md-4 erp-field"><label className="form-label">Floors (above ground)</label><input type="number" min={0} name="floors_above" className="form-control" value={form.floors_above} onChange={(e) => set("floors_above", e.target.value)} /></div>
                <div className="col-md-4 erp-field"><label className="form-label">Basements</label><input type="number" min={0} name="floors_below" className="form-control" value={form.floors_below} onChange={(e) => set("floors_below", e.target.value)} /></div>
                <div className="col-md-4 erp-field"><label className="form-label">Total Units</label><input type="number" min={0} name="total_units" className="form-control" value={form.total_units} onChange={(e) => set("total_units", e.target.value)} /></div>
                <div className="col-md-6 erp-field mb-0"><label className="form-label">Land Area (sq ft)</label><input type="number" step="0.01" min={0} name="land_area" className="form-control" value={form.land_area} onChange={(e) => set("land_area", e.target.value)} /></div>
                <div className="col-md-6 erp-field mb-0"><label className="form-label">Built Area (sq ft)</label><input type="number" step="0.01" min={0} name="built_area" className="form-control" value={form.built_area} onChange={(e) => set("built_area", e.target.value)} /></div>
              </div>
            )}

            {tab === "facilities" && (
              <div className="row">
                <div className="col-md-3 erp-field"><label className="form-label">Lifts</label><input type="number" min={0} name="lifts" className="form-control" value={form.lifts} onChange={(e) => set("lifts", e.target.value)} /></div>
                <div className="col-md-3 erp-field"><label className="form-label">Parking Spaces</label><input type="number" min={0} name="parking_spaces" className="form-control" value={form.parking_spaces} onChange={(e) => set("parking_spaces", e.target.value)} /></div>
                <div className="col-md-6 erp-field">
                  <label className="form-label d-block">Amenities</label>
                  <label className="erp-check me-3"><input type="checkbox" checked={form.has_generator} onChange={(e) => set("has_generator", e.target.checked)} /><span> Generator</span></label>
                  <label className="erp-check me-3"><input type="checkbox" checked={form.has_security} onChange={(e) => set("has_security", e.target.checked)} /><span> Security</span></label>
                  <label className="erp-check"><input type="checkbox" checked={form.has_fire_safety} onChange={(e) => set("has_fire_safety", e.target.checked)} /><span> Fire safety</span></label>
                </div>
                <div className="col-12 erp-field mb-0"><label className="form-label">Other Amenities</label><input type="text" name="amenities" className="form-control" maxLength={1000} placeholder="Gym, rooftop garden, community hall…" value={form.amenities} onChange={(e) => set("amenities", e.target.value)} /></div>
              </div>
            )}

            {tab === "dates" && (
              <div className="row">
                <div className="col-md-3 erp-field"><label className="form-label">Construction Start</label><input type="date" name="construction_start_date" className="form-control" value={form.construction_start_date} onChange={(e) => set("construction_start_date", e.target.value)} /></div>
                <div className="col-md-3 erp-field"><label className="form-label">Completion</label><input type="date" name="completion_date" className="form-control" value={form.completion_date} onChange={(e) => set("completion_date", e.target.value)} /></div>
                <div className="col-md-3 erp-field"><label className="form-label">Handover</label><input type="date" name="handover_date" className="form-control" value={form.handover_date} onChange={(e) => set("handover_date", e.target.value)} /></div>
                <div className="col-md-3 erp-field"><label className="form-label">Occupancy</label><input type="date" name="occupancy_date" className="form-control" value={form.occupancy_date} onChange={(e) => set("occupancy_date", e.target.value)} /></div>
                <div className="col-md-6 erp-field mb-0"><label className="form-label">Construction Cost</label><input type="number" step="0.01" min={0} name="construction_cost" className="form-control" value={form.construction_cost} onChange={(e) => set("construction_cost", e.target.value)} /></div>
                <div className="col-md-6 erp-field mb-0"><label className="form-label">Current Value</label><input type="number" step="0.01" min={0} name="current_value" className="form-control" value={form.current_value} onChange={(e) => set("current_value", e.target.value)} /></div>
              </div>
            )}
          </div>

          <div className="erp-card-foot d-flex">
            <Link href="/buildings" className="btn btn-erp-ghost">Cancel</Link>
            <button type="submit" className="btn btn-erp ms-auto" disabled={saving}>
              <i className="fa-solid fa-floppy-disk me-2" />{saving ? "Creating..." : "Create Building"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
