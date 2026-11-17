"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DESIGNATION_GRADES, EMPLOYMENT_TYPES } from "@/lib/tier0";

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
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-user-tie"></i>
          </div>
          <div>
            <h1>New Designation</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item">
                  <Link href="/organization/designations">Designation</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/organization/designations" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fa-solid fa-circle-exclamation me-2"></i>
          {error}
        </div>
      )}

      <form className="erp-form" onSubmit={handleSubmit} noValidate>
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-sitemap"></i>
            </div>
            <div>
              <h2>Placement</h2>
              <p>Which department this job title belongs to.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-context-banner">
              <span className="erp-context-banner-icon">
                <i className="fa-solid fa-building-columns"></i>
              </span>
              <div className="erp-context-banner-body">
                <strong>E-Hishabi ERP</strong>
                <span>
                  Filed under HQ &mdash; switch companies from the top bar to change this.
                </span>
              </div>
            </div>

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
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-user-tie"></i>
            </div>
            <div>
              <h2>Designation</h2>
              <p>Title, seniority grade and engagement type.</p>
            </div>
          </div>
          <div className="erp-card-body">
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
                  <span className="erp-help">
                    Drives seniority ordering and payroll banding.
                  </span>
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
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-toggle-on"></i>
            </div>
            <div>
              <h2>Attributes</h2>
              <p>Flags that affect approvals and selection lists.</p>
            </div>
          </div>
          <div className="erp-card-body">
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
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Fields marked <span className="erp-required">*</span> are required.
          </span>
          <div className="erp-form-bar-actions">
            <Link href="/organization/designations" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {submitting ? "Saving..." : "Create Designation"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
