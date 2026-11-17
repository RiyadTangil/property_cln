"use client";

import React, { FormEvent, useState } from "react";
import ProfileTabs from "./ProfileTabs";
import { ErpFormBar, ErpPageHeader, ErpPill, ErpSectionCard } from "@/components/ui";

export default function ProfileSecurityClient({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice("");
    setError("");
    if (!currentPassword || !newPassword) {
      setError("Current password and new password are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== passwordConfirmation) {
      setError("Password confirmation does not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update password.");
      } else {
        setNotice("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setPasswordConfirmation("");
      }
    } catch {
      setError("Network error while changing password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <ErpPageHeader
        icon="fa-solid fa-shield-halved"
        title="Security"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Profile", href: "/profile" },
          { label: "Security" },
        ]}
      />

      <ProfileTabs active="security" />

      {notice && (
        <div className="alert alert-success mb-3" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      <ErpSectionCard
        icon="fa-solid fa-clock-rotate-left"
        title="Last Sign-In"
        subtitle="If this was not you, change your password straight away."
        flush
      >
        <ul className="erp-list">
          <li>
            <div className="d-flex align-items-center gap-3">
              <i
                className="fa-solid fa-calendar-check"
                style={{ color: "var(--erp-primary)", width: 16 }}
              ></i>
              <span style={{ fontSize: "13.5px" }}>
                Active session ({email}) <span className="text-muted">(just now)</span>
              </span>
            </div>
          </li>
          <li>
            <div className="d-flex align-items-center gap-3">
              <i
                className="fa-solid fa-location-crosshairs"
                style={{ color: "var(--erp-primary)", width: 16 }}
              ></i>
              <span style={{ fontSize: "13.5px" }}>127.0.0.1</span>
            </div>
          </li>
        </ul>
      </ErpSectionCard>

      <form onSubmit={handleSubmit} className="erp-form" noValidate>
        <ErpSectionCard
          icon="fa-solid fa-key"
          title="Change Password"
          subtitle="At least 8 characters, with letters and numbers."
        >
          <div className="row">
            <div className="col-md-12">
              <div className="erp-field">
                <label htmlFor="current_password" className="form-label">
                  Current Password <span className="erp-required">*</span>
                </label>
                <input
                  type="password"
                  id="current_password"
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="erp-field mb-md-0">
                <label htmlFor="new_password" className="form-label">
                  New Password <span className="erp-required">*</span>
                </label>
                <input
                  type="password"
                  id="new_password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="erp-field mb-md-0">
                <label htmlFor="password_confirmation" className="form-label">
                  Confirm New Password <span className="erp-required">*</span>
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

        <ErpFormBar
          note="You will stay signed in on this device."
          submitLabel="Change Password"
          submittingLabel="Updating…"
          submitIcon="fa-solid fa-key"
          submitting={saving}
        />
      </form>

      <ErpSectionCard
        icon="fa-solid fa-display"
        title="Active Sessions"
        subtitle="Browsers currently signed in to your account."
      >
        <div className="erp-session is-current">
          <span className="erp-session-icon">
            <i className="fa-solid fa-display"></i>
          </span>
          <div className="erp-session-body">
            <strong>
              Current Browser Session{" "}
              <ErpPill tone="available" className="ms-1">
                This device
              </ErpPill>
            </strong>
            <small>127.0.0.1 &middot; active now</small>
          </div>
        </div>
      </ErpSectionCard>
    </div>
  );
}
