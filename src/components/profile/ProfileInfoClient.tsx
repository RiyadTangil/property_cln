"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileTabs from "./ProfileTabs";
import { getInitials } from "@/lib/tier0";
import { ErpFormBar, ErpPageHeader, ErpSectionCard } from "@/components/ui";

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
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username);
  const [jobTitle, setJobTitle] = useState(user.jobTitle);
  const [phone, setPhone] = useState(user.phone);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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
      <ErpPageHeader
        icon="fa-solid fa-user"
        title="My Profile"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "My Profile" },
        ]}
      />

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
        <ErpSectionCard
          icon="fa-solid fa-image-portrait"
          title="Profile Photo"
          subtitle="Shown beside your name in the top bar and on records you touch."
        >
          <div
            className="erp-avatar-zone"
            role="button"
            tabIndex={0}
            onClick={() => avatarInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") avatarInputRef.current?.click();
            }}
          >
            <div className="erp-avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt={name} />
              ) : (
                <span className="erp-avatar-initials">{getInitials(name)}</span>
              )}
            </div>
            <div className="erp-avatar-copy">
              <h6>Drop an image here, or click to browse</h6>
              <p>PNG, JPG, JPEG, WEBP up to 1 MB.</p>
              <div className="erp-avatar-actions">
                <span className="btn btn-erp-ghost btn-sm">
                  <i className="fa-solid fa-upload me-1"></i>Choose file
                </span>
                {avatarPreview && (
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAvatarPreview(null);
                      if (avatarInputRef.current) avatarInputRef.current.value = "";
                    }}
                  >
                    <i className="fa-solid fa-trash-can me-1"></i>Remove
                  </button>
                )}
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              name="avatar"
              className="d-none"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === "string") setAvatarPreview(reader.result);
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-id-card"
          title="Details"
          subtitle="Your name and email double as sign-in credentials."
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
        </ErpSectionCard>

        <ErpFormBar
          cancelHref="/dashboard"
          submitLabel="Save Changes"
          submittingLabel="Saving…"
          submitting={saving}
        />
      </form>
    </div>
  );
}
