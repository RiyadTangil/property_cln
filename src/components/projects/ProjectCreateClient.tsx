"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpContextBanner, ErpFormBar, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

interface TemplateMatch {
  id: number;
  name: string;
  projectTypeId: number | null;
  projectCategoryId: number | null;
  isDefault: boolean;
}

function pickTemplate(list: TemplateMatch[], typeId: number | null, catId: number | null): TemplateMatch | null {
  if (!typeId) return null;
  return (
    (catId ? list.find((t) => t.projectCategoryId === catId) : null) ||
    list.find((t) => t.projectTypeId === typeId && !t.projectCategoryId) ||
    list.find((t) => !t.projectTypeId && !t.projectCategoryId && t.isDefault) ||
    list[0] ||
    null
  );
}

export function ProjectCreateClient({
  types,
  categories,
  parcels,
  wbsTemplates = [],
  cbsTemplates = [],
  estimateTemplates = [],
  initialProject,
}: {
  types: { id: number; name: string }[];
  categories: { id: number; name: string; projectTypeId: number | null }[];
  parcels: { id: number; code: string; title: string | null; mouza: string }[];
  wbsTemplates?: TemplateMatch[];
  cbsTemplates?: TemplateMatch[];
  estimateTemplates?: TemplateMatch[];
  initialProject?: {
    id: number;
    code: string;
    name: string;
    projectTypeId: number | null;
    projectCategoryId: number | null;
    managerName: string | null;
    priority: string;
    status: string;
    startDate: string | null;
    expectedCompletionDate: string | null;
    actualCompletionDate: string | null;
    progress: number;
    description: string | null;
    currency: string;
    location: string;
    city: string | null;
    country: string;
    latitude: number | null;
    longitude: number | null;
  };
}) {
  const router = useRouter();
  const isEdit = Boolean(initialProject);
  const [name, setName] = useState(initialProject?.name ?? "");
  const [projectTypeId, setProjectTypeId] = useState(initialProject?.projectTypeId ? String(initialProject.projectTypeId) : "");
  const [projectCategoryId, setProjectCategoryId] = useState(initialProject?.projectCategoryId ? String(initialProject.projectCategoryId) : "");
  const [managerName, setManagerName] = useState(initialProject?.managerName ?? "");
  const [priority, setPriority] = useState(initialProject?.priority ?? "medium");
  const [status, setStatus] = useState(initialProject?.status ?? "planning");
  const [startDate, setStartDate] = useState(initialProject?.startDate ?? "");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(initialProject?.expectedCompletionDate ?? "");
  const [actualCompletionDate, setActualCompletionDate] = useState(initialProject?.actualCompletionDate ?? "");
  const [progress, setProgress] = useState(initialProject?.progress ?? 0);
  const [description, setDescription] = useState(initialProject?.description ?? "");
  const [currency, setCurrency] = useState(initialProject?.currency ?? "BDT");
  const [landParcelId, setLandParcelId] = useState("");
  const [location, setLocation] = useState(initialProject?.location ?? "");
  const [city, setCity] = useState(initialProject?.city ?? "");
  const [country, setCountry] = useState(initialProject?.country ?? "BD");
  const [latitude, setLatitude] = useState(initialProject?.latitude !== null && initialProject?.latitude !== undefined ? String(initialProject.latitude) : "");
  const [longitude, setLongitude] = useState(initialProject?.longitude !== null && initialProject?.longitude !== undefined ? String(initialProject.longitude) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableCats = projectTypeId
    ? categories.filter((c) => !c.projectTypeId || String(c.projectTypeId) === projectTypeId)
    : categories;

  const selTypeNum = projectTypeId ? Number(projectTypeId) : null;
  const selCatNum = projectCategoryId ? Number(projectCategoryId) : null;
  const matchedWbs = pickTemplate(wbsTemplates, selTypeNum, selCatNum);
  const matchedCbs = pickTemplate(cbsTemplates, selTypeNum, selCatNum);
  const matchedEst = pickTemplate(estimateTemplates, selTypeNum, selCatNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `/api/projects/${initialProject!.id}` : "/api/projects";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          project_type_id: selTypeNum,
          project_category_id: selCatNum,
          manager_name: managerName || null,
          priority,
          status,
          start_date: startDate || null,
          expected_completion_date: expectedCompletionDate || null,
          actual_completion_date: actualCompletionDate || null,
          progress: Number(progress) || 0,
          description: description || null,
          currency,
          land_parcel_ids: landParcelId ? [Number(landParcelId)] : [],
          location: location || city || "Dhaka",
          city: city || null,
          country,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to save project");
        return;
      }
      const data = await res.json();
      router.push(`/projects/projects/${isEdit ? initialProject!.id : data.project.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon="fa-solid fa-city"
        title={isEdit ? `Edit ${initialProject!.name}` : "New Project"}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Projects", href: "/projects/projects" },
          { label: "All Projects", href: "/projects/projects" },
          { label: isEdit ? "Edit" : "New" },
        ]}
        actions={
          <Link href="/projects/projects" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2" />Back to list
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="erp-form erp-form-split" noValidate>
        <ErpContextBanner
          companyName="E-Hishabi ERP"
          description="Filed under HQ — switch companies from the top bar to change this."
        />

        {error && <div className="alert alert-danger mt-3">{error}</div>}

        <div className="row">
          <div className="col-xl-6">
            <section className="erp-card">
              <div className="erp-section-head">
                <div className="erp-section-icon"><i className="fa-solid fa-diagram-project" /></div>
                <div>
                  <h2>Project &amp; Schedule</h2>
                  <p>What is being built, who owns it, and over what period.</p>
                </div>
              </div>
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-5">
                    <div className="erp-field">
                      <label htmlFor="name" className="form-label">Project Name <span className="erp-required">*</span></label>
                      <input type="text" id="name" name="name" className="form-control" maxLength={190} placeholder="Lakeside Residences" required value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label className="form-label">Project Code</label>
                      <input type="text" className="form-control" value={initialProject?.code || "On save"} disabled />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="project_type_id" className="form-label">Project Type <span className="erp-required">*</span></label>
                      <select id="project_type_id" name="project_type_id" className="form-select" required value={projectTypeId} onChange={(e) => { setProjectTypeId(e.target.value); setProjectCategoryId(""); }}>
                        <option value="">Select type</option>
                        {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="project_category_id" className="form-label">Category <span className="erp-required">*</span></label>
                      <select id="project_category_id" name="project_category_id" className="form-select" required value={projectCategoryId} onChange={(e) => setProjectCategoryId(e.target.value)}>
                        <option value="">Select category</option>
                        {availableCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <span className="erp-help">Choose a type to narrow this list.</span>
                    </div>
                  </div>

                  <div className="col-12 mb-3">
                    <div className="erp-tp-panel">
                      <div className="erp-tp-head">
                        <span><i className="fa-solid fa-layer-group me-2" />Templates this project will use</span>
                        <span className={`erp-pill ${selTypeNum ? "is-available" : "is-neutral"}`}>
                          {selTypeNum ? "Ready" : "Waiting"}
                        </span>
                      </div>
                      <div className="erp-template-preview">
                        {!selTypeNum ? (
                          <div className="erp-tp-row">
                            <i className="fa-solid fa-circle-info" />
                            <div className="erp-tp-body">
                              <span>
                                Choose a project type above and the work breakdown, cost breakdown and estimate this project will be set up with appear here.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="erp-tp-row">
                              <i className="fa-solid fa-layer-group" />
                              <div className="erp-tp-body">
                                <strong>Work Breakdown:</strong> <span>{matchedWbs?.name || "Standard Work Breakdown"}</span>
                              </div>
                            </div>
                            <div className="erp-tp-row">
                              <i className="fa-solid fa-sitemap" />
                              <div className="erp-tp-body">
                                <strong>Cost Breakdown:</strong> <span>{matchedCbs?.name || "Company CBS Library"}</span>
                              </div>
                            </div>
                            <div className="erp-tp-row">
                              <i className="fa-solid fa-calculator" />
                              <div className="erp-tp-body">
                                <strong>Estimate:</strong> <span>{matchedEst?.name || "Standard Estimate"}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="manager_name" className="form-label">Project Manager</label>
                      <select id="manager_name" name="manager_name" className="form-select" value={managerName} onChange={(e) => setManagerName(e.target.value)}>
                        <option value="">Unassigned</option>
                        <option value="MD. GOLAM RABBANY RONY">MD. GOLAM RABBANY RONY</option>
                        <option value="Muhamma Arif Al Imran">Muhamma Arif Al Imran</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="priority" className="form-label">Priority <span className="erp-required">*</span></label>
                      <select id="priority" name="priority" className="form-select" required value={priority} onChange={(e) => setPriority(e.target.value)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="status" className="form-label">Status <span className="erp-required">*</span></label>
                      <select id="status" name="status" className="form-select" required value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="erp-field">
                      <label className="form-label">Start Date</label>
                      <input type="date" name="start_date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label className="form-label">Expected Completion</label>
                      <input type="date" name="expected_completion_date" className="form-control" value={expectedCompletionDate} onChange={(e) => setExpectedCompletionDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label className="form-label">Actual Completion</label>
                      <input type="date" name="actual_completion_date" className="form-control" value={actualCompletionDate} onChange={(e) => setActualCompletionDate(e.target.value)} />
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="erp-field">
                      <label className="form-label">Progress {progress}%</label>
                      <input type="range" name="progress" min={0} max={100} className="form-range" value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="erp-field mb-0">
                      <label className="form-label">Description</label>
                      <textarea name="description" className="form-control" rows={3} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="col-xl-6">
            <section className="erp-card">
              <div className="erp-section-head">
                <div className="erp-section-icon"><i className="fa-solid fa-location-dot" /></div>
                <div>
                  <h2>Budget &amp; Location</h2>
                  <p>Currency, linked land, and site coordinates.</p>
                </div>
              </div>
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-12">
                    <div className="erp-field">
                      <label htmlFor="currency" className="form-label">Currency</label>
                      <select id="currency" name="currency" className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                        <option value="BDT">Company default (BDT)</option>
                        <option value="AED">AED — UAE Dirham</option>
                        <option value="AUD">AUD — Australian Dollar</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="GBP">GBP — Pound Sterling</option>
                        <option value="USD">USD — US Dollar</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="erp-field">
                      <label htmlFor="land_parcel_ids" className="form-label">Land Parcels</label>
                      <select id="land_parcel_ids" name="land_parcel_ids[]" className="form-select" value={landParcelId} onChange={(e) => setLandParcelId(e.target.value)}>
                        <option value="">— No acquired land linked —</option>
                        {parcels.map((lp) => (
                          <option key={lp.id} value={lp.id}>{lp.code} · {lp.title || lp.mouza}</option>
                        ))}
                      </select>
                      <span className="erp-help">Ties the project to the acquired land. Picking a plot already allocated to another project moves it here.</span>
                    </div>
                  </div>

                  <div className="col-md-7">
                    <div className="erp-field">
                      <label htmlFor="location" className="form-label">Address / Site</label>
                      <input type="text" id="location" name="location" className="form-control" maxLength={255} placeholder="Plot 12, Sector 4, Purbachal" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="erp-field">
                      <label htmlFor="city" className="form-label">City / District</label>
                      <input type="text" id="city" name="city" className="form-control" maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="erp-field mb-0">
                      <label htmlFor="country" className="form-label">Country</label>
                      <select id="country" name="country" className="form-select" value={country} onChange={(e) => setCountry(e.target.value)}>
                        <option value="BD">Bangladesh</option>
                        <option value="AE">United Arab Emirates</option>
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field mb-0">
                      <label htmlFor="latitude" className="form-label">Latitude</label>
                      <input type="number" step="0.0000001" id="latitude" name="latitude" className="form-control" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field mb-0">
                      <label htmlFor="longitude" className="form-label">Longitude</label>
                      <input type="number" step="0.0000001" id="longitude" name="longitude" className="form-control" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <ErpFormBar
          note={<>Fields marked <span className="erp-required">*</span> are required. The project code is generated automatically.</>}
          cancelHref={isEdit ? `/projects/projects/${initialProject!.id}` : "/projects/projects"}
          submitLabel={isEdit ? "Save Changes" : "Create Project"}
          submitting={saving}
        />
      </form>
    </div>
  );
}
