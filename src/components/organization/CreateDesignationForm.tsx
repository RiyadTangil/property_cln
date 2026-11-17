"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DESIGNATION_GRADES, EMPLOYMENT_TYPES } from "@/lib/tier0";
import {
  ErpContextBanner,
  ErpFormBar,
  ErpPageHeader,
  ErpSectionCard,
} from "@/components/ui";

export default function CreateDesignationForm({
  departments,
}: {
  departments: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [departmentId, setDepartmentId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [grade, setGrade] = useState("");
  const [description, setDescription] = useState("");
  const [isManagerial, setIsManagerial] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim() || !name.trim()) {
      setError("Code and Designation Title are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/organization/designations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_id: departmentId || null,
          code,
          name,
          employment_type: employmentType,
          grade: grade || null,
          description,
          is_managerial: isManagerial,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create designation.");
        setSubmitting(false);
        return;
      }
      router.push("/organization/designations");
      router.refresh();
    } catch {
      setError("Network error while creating designation.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <ErpPageHeader
        icon="fa-solid fa-user-tie"
        title="New Designation"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Organization" },
          { label: "Designation", href: "/organization/designations" },
          { label: "New" },
        ]}
        actions={
          <Link href="/organization/designations" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        }
      />

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fa-solid fa-circle-exclamation me-2"></i>
          {error}
        </div>
      )}

      <form className="erp-form" onSubmit={handleSubmit} noValidate>
        <ErpSectionCard
          icon="fa-solid fa-sitemap"
          title="Placement"
          subtitle="Which department this job title belongs to."
        >
          <ErpContextBanner
            companyName="E-Hishabi ERP"
            description="Filed under HQ — switch companies from the top bar to change this."
          />

          <div className="erp-field mb-0">
            <label htmlFor="department_id" className="form-label">
              Department
            </label>
            <select
              id="department_id"
              className="form-select"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">Company-wide (no department)</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-user-tie"
          title="Designation"
          subtitle="Title, seniority grade and engagement type."
        >
          <div className="row">
            <div className="col-md-3">
              <div className="erp-field">
                <label htmlFor="code" className="form-label">
                  Code <span className="erp-required">*</span>
                </label>
                <input
                  type="text"
                  id="code"
                  className="form-control text-uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={20}
                  placeholder="SR-ENG"
                  required
                />
                <span className="erp-help">Unique within the company.</span>
              </div>
            </div>

            <div className="col-md-5">
              <div className="erp-field">
                <label htmlFor="name" className="form-label">
                  Designation Title <span className="erp-required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={150}
                  placeholder="Senior Site Engineer"
                  required
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="erp-field">
                <label htmlFor="employment_type" className="form-label">
                  Employment Type <span className="erp-required">*</span>
                </label>
                <select
                  id="employment_type"
                  className="form-select"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  required
                >
                  {EMPLOYMENT_TYPES.map((et) => (
                    <option key={et.value} value={et.value}>
                      {et.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-md-6">
              <div className="erp-field">
                <label htmlFor="grade" className="form-label">
                  Grade
                </label>
                <select
                  id="grade"
                  className="form-select"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                >
                  <option value="">Not graded</option>
                  {DESIGNATION_GRADES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <span className="erp-help">Drives seniority ordering and payroll banding.</span>
              </div>
            </div>

            <div className="col-12">
              <div className="erp-field mb-0">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  maxLength={2000}
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Responsibilities and reporting line for this role…"
                />
              </div>
            </div>
          </div>
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-toggle-on"
          title="Attributes"
          subtitle="Flags that affect approvals and selection lists."
        >
          <div className="erp-switch-row">
            <div>
              <h6>Managerial role</h6>
              <p>Holders can be selected as approvers and reporting managers.</p>
            </div>
            <div className="form-check form-switch">
              <input
                type="checkbox"
                className="form-check-input"
                role="switch"
                checked={isManagerial}
                onChange={(e) => setIsManagerial(e.target.checked)}
              />
            </div>
          </div>

          <div className="erp-switch-row">
            <div>
              <h6>Active</h6>
              <p>Available when assigning employees and drafting offers.</p>
            </div>
            <div className="form-check form-switch">
              <input
                type="checkbox"
                className="form-check-input"
                role="switch"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </div>
          </div>
        </ErpSectionCard>

        <ErpFormBar
          cancelHref="/organization/designations"
          submitLabel="Create Designation"
          submittingLabel="Saving..."
          submitting={submitting}
        />
      </form>
    </div>
  );
}
