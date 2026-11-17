"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import ProfileTabs from "./ProfileTabs";

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
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h1>Security</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/profile">Profile</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Security
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

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

      <section className="erp-card">
        <div className="erp-section-head">
          <div className="erp-section-icon">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <h2>Last Sign-In</h2>
            <p>If this was not you, change your password straight away.</p>
          </div>
        </div>
        <div className="erp-card-body is-flush">
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
        </div>
      </section>

      <form onSubmit={handleSubmit} className="erp-form" noValidate>
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-key"></i>
            </div>
            <div>
              <h2>Change Password</h2>
              <p>At least 8 characters, with letters and numbers.</p>
            </div>
          </div>
          <div className="erp-card-body">
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
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            You will stay signed in on this device.
          </span>
          <div className="erp-form-bar-actions">
            <button type="submit" className="btn btn-erp" disabled={saving}>
              <i className="fa-solid fa-key me-2"></i>
              {saving ? "Updating…" : "Change Password"}
            </button>
          </div>
        </div>
      </form>

      <section className="erp-card">
        <div className="erp-section-head">
          <div className="erp-section-icon">
            <i className="fa-solid fa-display"></i>
          </div>
          <div>
            <h2>Active Sessions</h2>
            <p>Browsers currently signed in to your account.</p>
          </div>
        </div>
        <div className="erp-card-body">
          <div className="erp-session is-current">
            <span className="erp-session-icon">
              <i className="fa-solid fa-display"></i>
            </span>
            <div className="erp-session-body">
              <strong>
                Current Browser Session{" "}
                <span className="erp-pill is-available ms-1">This device</span>
              </strong>
              <small>127.0.0.1 &middot; active now</small>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
