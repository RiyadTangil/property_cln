"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateRolePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [scope, setScope] = useState("global");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Role Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), scope }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create role.");
        setSubmitting(false);
        return;
      }
      router.push("/settings/roles");
      router.refresh();
    } catch {
      setError("Network error while creating role.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h1>New Role</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item">
                  <Link href="/settings/roles">Roles</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/settings/roles" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="erp-form" noValidate>
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-id-badge"></i>
            </div>
            <div>
              <h2>Role Identity</h2>
              <p>Create the role first, then toggle exact permissions on the Roles workbench.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-7">
                <div className="erp-field mb-md-0">
                  <label htmlFor="name" className="form-label">
                    Role Name <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Site Supervisor"
                    required
                  />
                </div>
              </div>

              <div className="col-md-5">
                <div className="erp-field mb-0">
                  <label htmlFor="scope" className="form-label">
                    Scope
                  </label>
                  <select
                    id="scope"
                    className="form-select"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                  >
                    <option value="global">Global (All companies)</option>
                    <option value="company">Company-specific</option>
                  </select>
                </div>
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
            <Link href="/settings/roles" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {submitting ? "Creating…" : "Create Role"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
