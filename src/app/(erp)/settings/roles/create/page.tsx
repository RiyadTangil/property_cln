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
            <i className="fa-solid fa-user-shield"></i>
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
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <div>
              <h2>Role</h2>
              <p>A named bundle of permissions you can hand to any number of users.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-field">
              <label htmlFor="name" className="form-label">
                Role Name <span className="erp-required">*</span>
              </label>
              <input
                type="text"
                id="name"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Accounts Payable Clerk"
                required
              />
            </div>

            <div className="erp-field mb-0">
              <label className="form-label">
                Availability <span className="erp-required">*</span>
              </label>
              <div className="erp-scope-choices" role="radiogroup" aria-label="Availability">
                <label className="erp-scope-choice">
                  <input
                    type="radio"
                    name="scope"
                    value="global"
                    checked={scope === "global"}
                    onChange={() => setScope("global")}
                  />
                  <span className="erp-scope-choice-body">
                    <i className="fa-solid fa-earth-asia"></i>
                    <span>
                      <strong>Shared</strong>
                      <small>Available in every company.</small>
                    </span>
                  </span>
                </label>

                <label className="erp-scope-choice">
                  <input
                    type="radio"
                    name="scope"
                    value="company"
                    checked={scope === "company"}
                    onChange={() => setScope("company")}
                  />
                  <span className="erp-scope-choice-body">
                    <i className="fa-solid fa-building-columns"></i>
                    <span>
                      <strong>E-Hishabi ERP only</strong>
                      <small>Scoped to the active company.</small>
                    </span>
                  </span>
                </label>
              </div>
              <span className="erp-help">
                Permissions themselves are the same either way — this only controls which companies
                can hand the role out.
              </span>
            </div>
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            You will pick this role’s 585 possible permissions on the next screen.
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
