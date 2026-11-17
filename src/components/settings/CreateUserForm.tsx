"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErpFormBar, ErpPageHeader, ErpSectionCard } from "@/components/ui";

export default function CreateUserForm({
  companyName,
  roles,
}: {
  companyName: string;
  roles: { id: number; name: string; scope: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedRole, setSelectedRole] = useState(
    roles.find((r) => !r.name.toLowerCase().includes("super"))?.name ?? "Staff"
  );
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password) {
      setError("Full Name, Email, and Password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          job_title: jobTitle.trim(),
          phone: phone.trim(),
          password,
          password_confirmation: passwordConfirmation,
          is_super_admin: isSuperAdmin,
          role: isSuperAdmin ? "Super Admin" : selectedRole,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create user.");
        setSubmitting(false);
        return;
      }
      router.push("/settings/users");
      router.refresh();
    } catch {
      setError("Network error while creating user.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <ErpPageHeader
        icon="fa-solid fa-user-plus"
        title="New User"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Settings" },
          { label: "Users", href: "/settings/users" },
          { label: "New" },
        ]}
        actions={
          <Link href="/settings/users" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        }
      />

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="erp-form" noValidate>
        <ErpSectionCard
          icon="fa-solid fa-id-card"
          title="Account"
          subtitle="Identity and contact details for sign-in and mentions."
        >
          <div className="row">
            <div className="col-md-6">
              <div className="erp-field">
                <label htmlFor="name" className="form-label">
                  Full Name <span className="erp-required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tanvir Hasan"
                  required
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="erp-field">
                <label htmlFor="email" className="form-label">
                  Email Address <span className="erp-required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tanvir@ehishabi.com"
                  required
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="erp-field mb-md-0">
                <label htmlFor="job_title" className="form-label">
                  Job Title
                </label>
                <input
                  type="text"
                  id="job_title"
                  className="form-control"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Project Engineer"
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="erp-field mb-0">
                <label htmlFor="phone" className="form-label">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 17..."
                />
              </div>
            </div>
          </div>
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-key"
          title="Password"
          subtitle="Initial sign-in credentials. The user can change this later under Profile."
        >
          <div className="row">
            <div className="col-md-6">
              <div className="erp-field mb-md-0">
                <label htmlFor="password" className="form-label">
                  Password <span className="erp-required">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <span className="erp-help">Minimum 8 characters.</span>
              </div>
            </div>

            <div className="col-md-6">
              <div className="erp-field mb-0">
                <label htmlFor="password_confirmation" className="form-label">
                  Confirm Password <span className="erp-required">*</span>
                </label>
                <input
                  type="password"
                  id="password_confirmation"
                  className="form-control"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-shield-halved"
          title="Access Per Company"
          subtitle="Assign one or more roles, or make the account a Super Admin."
        >
          <div className="erp-switch-row mb-3">
            <div>
              <h6>Super Admin</h6>
              <p>Full unrestricted access across every company and setting.</p>
            </div>
            <div className="form-check form-switch">
              <input
                type="checkbox"
                className="form-check-input"
                role="switch"
                id="is_super_admin"
                checked={isSuperAdmin}
                onChange={(e) => setIsSuperAdmin(e.target.checked)}
              />
            </div>
          </div>

          <div className={`erp-company-roles${isSuperAdmin ? " is-superseded" : ""}`}>
            <div className="erp-company-roles-head">
              <span>{companyName}</span>
              <small className="text-muted">Role grant</small>
            </div>
            <div className="erp-check-grid">
              {roles.map((r) => (
                <label key={r.id} className="erp-check-item">
                  <input
                    type="radio"
                    name="role"
                    value={r.name}
                    checked={selectedRole === r.name}
                    onChange={() => setSelectedRole(r.name)}
                  />
                  <span>
                    <strong>{r.name}</strong>
                    <small className="text-capitalize">{r.scope}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-toggle-on"
          title="Status"
          subtitle="Control whether the account can sign in immediately."
        >
          <div className="erp-switch-row">
            <div>
              <h6>Active account</h6>
              <p>Inactive users retain historical attribution but cannot sign in.</p>
            </div>
            <div className="form-check form-switch">
              <input
                type="checkbox"
                className="form-check-input"
                role="switch"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </div>
          </div>
        </ErpSectionCard>

        <ErpFormBar
          cancelHref="/settings/users"
          submitLabel="Create User"
          submittingLabel="Creating…"
          submitting={submitting}
        />
      </form>
    </div>
  );
}
