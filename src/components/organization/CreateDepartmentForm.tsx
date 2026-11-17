"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ErpContextBanner,
  ErpFormBar,
  ErpPageHeader,
  ErpSectionCard,
} from "@/components/ui";

export default function CreateDepartmentForm({
  branches,
  parents,
}: {
  branches: { id: number; name: string }[];
  parents: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [branchId, setBranchId] = useState("");
  const [parentId, setParentId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [headName, setHeadName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim() || !name.trim()) {
      setError("Code and Department Name are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/organization/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: branchId || null,
          parent_id: parentId || null,
          code,
          name,
          head_name: headName,
          email,
          phone,
          description,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create department.");
        setSubmitting(false);
        return;
      }
      router.push("/organization/departments");
      router.refresh();
    } catch {
      setError("Network error while creating department.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <ErpPageHeader
        icon="fa-solid fa-diagram-project"
        title="New Department"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Organization" },
          { label: "Department", href: "/organization/departments" },
          { label: "New" },
        ]}
        actions={
          <Link href="/organization/departments" className="btn btn-erp-ghost">
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
          icon="fa-solid fa-diagram-project"
          title="Placement"
          subtitle="Where this department sits in the organisation structure."
        >
          <ErpContextBanner
            companyName="E-Hishabi ERP"
            description="Filed under HQ — switch companies from the top bar to change this."
          />

          <div className="row">
            <div className="col-md-6">
              <div className="erp-field mb-md-0">
                <label htmlFor="branch_id" className="form-label">
                  Branch
                </label>
                <select
                  id="branch_id"
                  className="form-select"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
                  <option value="">Company-wide (no branch)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-md-6">
              <div className="erp-field mb-md-0">
                <label htmlFor="parent_id" className="form-label">
                  Parent Department
                </label>
                <select
                  id="parent_id"
                  className="form-select"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">Top level</option>
                  {parents.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <span className="erp-help">Leave empty for a top-level department.</span>
              </div>
            </div>
          </div>
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-id-card"
          title="Details"
          subtitle="Naming, ownership and contact for the department."
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
                  placeholder="FIN"
                  required
                />
                <span className="erp-help">Unique within the company.</span>
              </div>
            </div>

            <div className="col-md-5">
              <div className="erp-field">
                <label htmlFor="name" className="form-label">
                  Department Name <span className="erp-required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={150}
                  placeholder="Finance & Accounts"
                  required
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="erp-field">
                <label htmlFor="head_name" className="form-label">
                  Department Head
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fa-solid fa-user-tie"></i>
                  </span>
                  <input
                    type="text"
                    id="head_name"
                    className="form-control"
                    value={headName}
                    onChange={(e) => setHeadName(e.target.value)}
                    maxLength={150}
                    placeholder="Arif Mahmud"
                  />
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="erp-field">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fa-solid fa-envelope"></i>
                  </span>
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={150}
                    placeholder="finance@company.com"
                  />
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="erp-field">
                <label htmlFor="phone" className="form-label">
                  Phone / Extension
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fa-solid fa-phone"></i>
                  </span>
                  <input
                    type="text"
                    id="phone"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={40}
                    placeholder="Ext. 214"
                  />
                </div>
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
                  placeholder="Responsibilities and scope of this department…"
                />
              </div>
            </div>
          </div>
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-toggle-on"
          title="Status"
          subtitle="Inactive departments stay on record but disappear from selection lists."
        >
          <div className="erp-switch-row">
            <div>
              <h6>Active</h6>
              <p>Available for employee assignment and cost allocation.</p>
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
          cancelHref="/organization/departments"
          submitLabel="Create Department"
          submittingLabel="Saving..."
          submitting={submitting}
        />
      </form>
    </div>
  );
}
