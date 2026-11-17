"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpContextBanner, ErpFormBar, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export function ProjectCategoryCreateClient({ types }: { types: { id: number; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/projects/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          project_type_id: projectTypeId ? Number(projectTypeId) : null,
          description: description || null,
          sort_order: sortOrder ? Number(sortOrder) : 10,
          is_active: isActive,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to create category");
        return;
      }
      router.push("/projects/categories");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon="fa-solid fa-tags"
        title="New Category"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Projects", href: "/projects/projects" },
          { label: "Categories", href: "/projects/categories" },
          { label: "New" },
        ]}
        actions={
          <Link href="/projects/categories" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2" />Back to list
          </Link>
        }
      />

      <ErpContextBanner
        icon="fa-solid fa-folder-tree"
        companyName="Define a project category"
        description="Categories refine project types (e.g. Apartment, Villa, Shopping Mall) and determine category-specific WBS/CBS templates."
      />

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-3">
        <section className="erp-card">
          <div className="erp-section-head"><h2>Category details</h2></div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="name" className="form-label">Name <span className="erp-required">*</span></label>
                  <input type="text" id="name" name="name" className="form-control" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="project_type_id" className="form-label">Project Type</label>
                  <select id="project_type_id" name="project_type_id" className="form-select" value={projectTypeId} onChange={(e) => setProjectTypeId(e.target.value)}>
                    <option value="">Any type</option>
                    {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <span className="erp-help">Leave blank to make it available under any type.</span>
                </div>
              </div>
              <div className="col-md-8">
                <div className="erp-field">
                  <label htmlFor="description" className="form-label">Description</label>
                  <input type="text" id="description" name="description" className="form-control" maxLength={255} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="sort_order" className="form-label">Display Order</label>
                  <input type="number" id="sort_order" name="sort_order" min={0} max={9999} step={10} className="form-control" placeholder="Auto" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="erp-switch-row">
              <div>
                <h6>Active</h6>
                <p>Inactive categories stay on existing projects but drop out of the picker.</p>
              </div>
              <div className="form-check form-switch">
                <input type="checkbox" className="form-check-input" role="switch" id="is_active" name="is_active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              </div>
            </div>
          </div>
        </section>

        <ErpFormBar cancelHref="/projects/categories" submitLabel="Create Category" submitting={saving} />
      </form>
    </div>
  );
}
