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
  roles: { id: number; name: string; scope: string; permissionsCount?: number }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
    const fallback = roles.find((r) => !r.name.toLowerCase().includes("super"))?.name;
    return fallback ? [fallback] : [];
  });
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleRole(roleName: string) {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((x) => x !== roleName) : [...prev, roleName]
    );
  }

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
          role: isSuperAdmin ? "Super Admin" : selectedRoles[0] ?? "Staff",
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
          subtitle="Name and email double as sign-in credentials."
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
                  Email <span className="erp-required">*</span>
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
                    placeholder="tanvir@ehishabi.com"
                    required
                  />
                </div>
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
                  placeholder="Finance Manager"
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="erp-field mb-0">
                <label htmlFor="phone" className="form-label">
                  Phone
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
                    placeholder="+880 17..."
                  />
                </div>
              </div>
            </div>
          </div>
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-key"
          title="Password"
          subtitle="At least 8 characters, with letters and numbers."
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
          icon="fa-solid fa-user-shield"
          title="Access Per Company"
          subtitle="Roles are granted company by company. No role in a company means no access to it."
        >
          <div className="erp-switch-row mb-3">
            <div>
              <h6>Super Admin</h6>
              <p>
                Unrestricted access across every company, present and future. Overrides everything
                below.
              </p>
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
              <span>
                <i className="fa-solid fa-building-columns me-2"></i>
                {companyName} <small className="text-muted">HQ</small>
              </span>
              <span className="erp-scope-actions">
                <span className={selectedRoles.length ? "erp-pill is-booked" : "erp-pill is-neutral"}>
                  {selectedRoles.length ? `${selectedRoles.length} role(s)` : "No access"}
                </span>
              </span>
            </div>
            <div className="erp-check-grid">
              {roles.map((r) => (
                <label key={r.id} className="erp-check-item">
                  <input
                    type="checkbox"
                    name="roles[]"
                    value={r.name}
                    checked={selectedRoles.includes(r.name)}
                    onChange={() => toggleRole(r.name)}
                  />
                  <span>
                    <strong>{r.name}</strong>
                    <small>
                      {r.scope === "global" ? "Shared" : "Company"} · {r.permissionsCount ?? 0}{" "}
                      permissions
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-toggle-on"
          title="Status"
          subtitle="Suspended accounts keep their data but cannot sign in."
        >
          <div className="erp-switch-row">
            <div>
              <h6>Active</h6>
              <p>Allowed to sign in and use the system.</p>
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
