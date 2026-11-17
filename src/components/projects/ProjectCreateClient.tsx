"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpContextBanner, ErpFormBar, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export function ProjectCreateClient({
  types,
  categories,
  parcels,
}: {
  types: { id: number; name: string }[];
  categories: { id: number; name: string; projectTypeId: number | null }[];
  parcels: { id: number; code: string; title: string | null; mouza: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [projectCategoryId, setProjectCategoryId] = useState("");
  const [managerName, setManagerName] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("planning");
  const [startDate, setStartDate] = useState("");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [actualCompletionDate, setActualCompletionDate] = useState("");
  const [progress, setProgress] = useState(0);
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [landParcelIds, setLandParcelIds] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("BD");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableCats = projectTypeId
    ? categories.filter((c) => !c.projectTypeId || String(c.projectTypeId) === projectTypeId)
    : categories;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          project_type_id: projectTypeId ? Number(projectTypeId) : null,
          project_category_id: projectCategoryId ? Number(projectCategoryId) : null,
          manager_name: managerName || null,
          priority,
          status,
          start_date: startDate || null,
          expected_completion_date: expectedCompletionDate || null,
          actual_completion_date: actualCompletionDate || null,
          progress: Number(progress) || 0,
          description: description || null,
          currency,
          land_parcel_ids: landParcelIds.map(Number),
          location: location || city || "Dhaka",
          city: city || null,
          country,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to create project");
        return;
      }
      const data = await res.json();
      router.push(`/projects/projects/${data.project.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon="fa-solid fa-city"
        title="New Project"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Projects", href: "/projects/projects" },
          { label: "New" },
        ]}
        actions={
          <Link href="/projects/projects" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2" />Back to list
          </Link>
        }
      />

      <ErpContextBanner
        icon="fa-solid fa-city"
        companyName="Register a new development project"
        description="Project type and category determine default WBS stages, CBS cost structure, and estimate parameters."
      />

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-3">
        <section className="erp-card mb-3">
          <div className="erp-section-head"><h2>Core classification</h2></div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-6 erp-field">
                <label className="form-label">Project Name <span className="erp-required">*</span></label>
                <input type="text" name="name" className="form-control" required maxLength={190} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="col-md-3 erp-field">
                <label className="form-label">Project Type <span className="erp-required">*</span></label>
                <select name="project_type_id" className="form-select" required value={projectTypeId} onChange={(e) => { setProjectTypeId(e.target.value); setProjectCategoryId(""); }}>
                  <option value="">Select type...</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="col-md-3 erp-field">
                <label className="form-label">Category <span className="erp-required">*</span></label>
                <select name="project_category_id" className="form-select" required value={projectCategoryId} onChange={(e) => setProjectCategoryId(e.target.value)}>
                  <option value="">Select category...</option>
                  {availableCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 erp-field">
                <label className="form-label">Project Manager</label>
                <input type="text" name="manager_name" className="form-control" placeholder="e.g. MD. GOLAM RABBANY RONY" value={managerName} onChange={(e) => setManagerName(e.target.value)} />
              </div>
              <div className="col-md-4 erp-field">
                <label className="form-label">Priority <span className="erp-required">*</span></label>
                <select name="priority" className="form-select" required value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="col-md-4 erp-field">
                <label className="form-label">Status <span className="erp-required">*</span></label>
                <select name="status" className="form-select" required value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card mb-3">
          <div className="erp-section-head"><h2>Schedule &amp; Description</h2></div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-3 erp-field">
                <label className="form-label">Start Date</label>
                <input type="date" name="start_date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="col-md-3 erp-field">
                <label className="form-label">Expected Completion</label>
                <input type="date" name="expected_completion_date" className="form-control" value={expectedCompletionDate} onChange={(e) => setExpectedCompletionDate(e.target.value)} />
              </div>
              <div className="col-md-3 erp-field">
                <label className="form-label">Actual Completion</label>
                <input type="date" name="actual_completion_date" className="form-control" value={actualCompletionDate} onChange={(e) => setActualCompletionDate(e.target.value)} />
              </div>
              <div className="col-md-3 erp-field">
                <label className="form-label">Progress ({progress}%)</label>
                <input type="range" name="progress" min={0} max={100} className="form-range mt-2" value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
              </div>
              <div className="col-md-4 erp-field">
                <label className="form-label">Currency</label>
                <select name="currency" className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="BDT">BDT — Bangladeshi Taka</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — Pound Sterling</option>
                  <option value="AED">AED — UAE Dirham</option>
                </select>
              </div>
              <div className="col-md-8 erp-field">
                <label className="form-label">Linked Land Parcels</label>
                <select
                  name="land_parcel_ids[]"
                  className="form-select"
                  multiple
                  value={landParcelIds}
                  onChange={(e) => setLandParcelIds(Array.from(e.target.selectedOptions, (o) => o.value))}
                >
                  {parcels.map((lp) => (
                    <option key={lp.id} value={lp.id}>{lp.code} · {lp.title || lp.mouza}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 erp-field mb-0">
                <label className="form-label">Description</label>
                <textarea name="description" className="form-control" rows={3} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head"><h2>Location &amp; Coordinates</h2></div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-6 erp-field">
                <label className="form-label">Location / Address</label>
                <input type="text" name="location" className="form-control" maxLength={255} value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="col-md-3 erp-field">
                <label className="form-label">City</label>
                <input type="text" name="city" className="form-control" maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="col-md-3 erp-field">
                <label className="form-label">Country</label>
                <select name="country" className="form-select" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="BD">Bangladesh</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>
              <div className="col-md-6 erp-field mb-0">
                <label className="form-label">Latitude</label>
                <input type="number" step="0.0000001" name="latitude" className="form-control" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div className="col-md-6 erp-field mb-0">
                <label className="form-label">Longitude</label>
                <input type="number" step="0.0000001" name="longitude" className="form-control" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        <ErpFormBar cancelHref="/projects/projects" submitLabel="Create Project" submitting={saving} />
      </form>
    </div>
  );
}
