"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileTabs from "./ProfileTabs";
import { getInitials } from "@/lib/tier0";

export interface ProfileAccountData {
  id: number;
  name: string;
  email: string;
  username: string;
  jobTitle: string;
  phone: string;
  role: string;
  isSuperAdmin: boolean;
  createdAt: string;
}

export default function ProfileInfoClient({
  user,
}: {
  user: ProfileAccountData;
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username);
  const [jobTitle, setJobTitle] = useState(user.jobTitle);
  const [phone, setPhone] = useState(user.phone);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice("");
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Full Name and Email are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          username: username.trim(),
          job_title: jobTitle.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile.");
      } else {
        setNotice("Profile details updated.");
        router.refresh();
      }
    } catch {
      setError("Network error while saving profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-user"></i>
          </div>
          <div>
            <h1>My Profile</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  My Profile
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <ProfileTabs active="profile" />

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

      <form onSubmit={handleSubmit} className="erp-form" noValidate>
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-image-portrait"></i>
            </div>
            <div>
              <h2>Profile Photo</h2>
              <p>Shown beside your name in the top bar and on records you touch.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-avatar-zone">
              <div className="erp-avatar-preview">
                <span className="erp-avatar-initials">{getInitials(name)}</span>
              </div>
              <div className="erp-avatar-copy">
                <h6>{name || "Account Avatar"}</h6>
                <p>
                  {user.isSuperAdmin ? "Super Admin" : user.role} &middot; Member since {user.createdAt}
                </p>
                <span className="erp-pill is-available">Active</span>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-id-card"></i>
            </div>
            <div>
              <h2>Details</h2>
              <p>Your name and email double as sign-in credentials.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="name" className="form-label">
                    Full Name <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={150}
                    required
                  />
                  <span className="erp-help">You can sign in with this or your email.</span>
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
                      name="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={150}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="username" className="form-label">
                    Sign-in Name
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fa-solid fa-at"></i>
                    </span>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="form-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={60}
                      placeholder="e.g. a.rahman"
                    />
                  </div>
                  <span className="erp-help">
                    Optional, and another way to sign in. Letters, numbers, dots, dashes and underscores.
                  </span>
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="job_title" className="form-label">
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="job_title"
                    name="job_title"
                    className="form-control"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    maxLength={150}
                    placeholder="Finance Manager"
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field mb-md-0">
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
                      name="phone"
                      className="form-control"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={40}
                      placeholder="+880 1XXX XXXXXX"
                    />
                  </div>
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
            <Link href="/dashboard" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" disabled={saving}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
