"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpContextBanner, ErpFormBar, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

const PILL_CHOICES = [
  { value: "is-booked", label: "Blue" },
  { value: "is-available", label: "Green" },
  { value: "is-hold", label: "Amber" },
  { value: "is-sold", label: "Purple" },
  { value: "is-overdue", label: "Red" },
  { value: "is-neutral", label: "Grey" },
];

export function ProjectTypeCreateClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("fa-solid fa-city");
  const [pill, setPill] = useState("is-neutral");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/projects/types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sort_order: sortOrder ? Number(sortOrder) : 10,
          description: description || null,
          icon: icon || "fa-solid fa-city",
          pill,
          is_active: isActive,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to create project type");
        return;
      }
      router.push("/projects/types");
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
        title="New Project Type"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Projects", href: "/projects/projects" },
          { label: "Types", href: "/projects/types" },
          { label: "New" },
        ]}
        actions={
          <Link href="/projects/types" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2" />Back to list
          </Link>
        }
      />

      <ErpContextBanner
        icon="fa-solid fa-shapes"
        companyName="Define a project type"
        description="Project types group similar developments (e.g. Residential, Commercial, Mixed Use) and drive default templates and parameters."
      />

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-3">
        <section className="erp-card">
          <div className="erp-section-head">
            <h2>Type details</h2>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-8">
                <div className="erp-field">
                  <label htmlFor="name" className="form-label">Name <span className="erp-required">*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="sort_order" className="form-label">Display Order</label>
                  <input
                    type="number"
                    id="sort_order"
                    name="sort_order"
                    min={0}
                    max={9999}
                    step={10}
                    className="form-control"
                    placeholder="Auto"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-12">
                <div className="erp-field">
                  <label htmlFor="description" className="form-label">Description</label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    className="form-control"
                    maxLength={255}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="icon" className="form-label">Icon</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className={icon || "fa-solid fa-city"} /></span>
                    <input
                      type="text"
                      id="icon"
                      name="icon"
                      className="form-control"
                      maxLength={60}
                      placeholder="fa-solid fa-building"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                    />
                  </div>
                  <span className="erp-help">Any Font Awesome class.</span>
                </div>
              </div>
              <div className="col-md-6">
                <div className="erp-field">
                  <label className="form-label">Colour</label>
                  <div className="erp-pill-choices">
                    {PILL_CHOICES.map((c) => (
                      <label key={c.value} className="erp-pill-choice">
                        <input
                          type="radio"
                          name="pill"
                          value={c.value}
                          checked={pill === c.value}
                          onChange={() => setPill(c.value)}
                        />
                        <span className={`erp-pill ${c.value}`}>{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="erp-switch-row">
              <div>
                <h6>Active</h6>
                <p>Inactive types stay on existing projects but drop out of the picker.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="is_active"
                  name="is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
              </div>
            </div>
          </div>
        </section>

        <ErpFormBar cancelHref="/projects/types" submitLabel="Create Type" submitting={saving} />
      </form>
    </div>
  );
}
