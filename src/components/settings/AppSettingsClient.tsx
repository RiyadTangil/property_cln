"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface AppSettingState {
  appName: string;
  appTagline: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  contactAddress: string;
  primaryColor: string;
}

export default function AppSettingsClient({
  initial,
}: {
  initial: AppSettingState;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"general" | "contact" | "branding">("general");
  const [form, setForm] = useState<AppSettingState>(initial);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings/application", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: form.appName,
          app_tagline: form.appTagline,
          footer_text: form.footerText,
          contact_email: form.contactEmail,
          contact_phone: form.contactPhone,
          website: form.website,
          contact_address: form.contactAddress,
          primary_color: form.primaryColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save application settings.");
      } else {
        setNotice("Application settings saved.");
        router.refresh();
      }
    } catch {
      setError("Network error while saving settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-sliders"></i>
          </div>
          <div>
            <h1>Application Settings</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Application
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

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
        <div className="erp-card">
          <div className="erp-tabs erp-tabs-nav" role="tablist">
            <button
              type="button"
              className={`erp-tab${tab === "general" ? " is-active" : ""}`}
              role="tab"
              aria-selected={tab === "general"}
              onClick={() => setTab("general")}
            >
              <i className="fa-solid fa-circle-info"></i>
              <span>General</span>
            </button>
            <button
              type="button"
              className={`erp-tab${tab === "contact" ? " is-active" : ""}`}
              role="tab"
              aria-selected={tab === "contact"}
              onClick={() => setTab("contact")}
            >
              <i className="fa-solid fa-address-book"></i>
              <span>Contact</span>
            </button>
            <button
              type="button"
              className={`erp-tab${tab === "branding" ? " is-active" : ""}`}
              role="tab"
              aria-selected={tab === "branding"}
              onClick={() => setTab("branding")}
            >
              <i className="fa-solid fa-palette"></i>
              <span>Branding</span>
            </button>
          </div>

          <div className="erp-tab-panels">
            <div className={`erp-tab-panel${tab === "general" ? " is-active" : ""}`}>
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="app_name" className="form-label">
                        Application Title <span className="erp-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="app_name"
                        className="form-control"
                        value={form.appName}
                        onChange={(e) => setForm({ ...form, appName: e.target.value })}
                        maxLength={120}
                        placeholder="Estate ERP"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="app_tagline" className="form-label">
                        Tagline
                      </label>
                      <input
                        type="text"
                        id="app_tagline"
                        className="form-control"
                        value={form.appTagline}
                        onChange={(e) => setForm({ ...form, appTagline: e.target.value })}
                        maxLength={190}
                        placeholder="Real Estate ERP"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field mb-0">
                      <label htmlFor="footer_text" className="form-label">
                        Footer Note
                      </label>
                      <input
                        type="text"
                        id="footer_text"
                        className="form-control"
                        value={form.footerText}
                        onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                        maxLength={190}
                      />
                      <span className="erp-help">
                        Shown in the page footer. Leave blank to use the tagline.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`erp-tab-panel${tab === "contact" ? " is-active" : ""}`}>
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="contact_email" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        id="contact_email"
                        className="form-control"
                        value={form.contactEmail}
                        onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                        maxLength={150}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="contact_phone" className="form-label">
                        Phone
                      </label>
                      <input
                        type="text"
                        id="contact_phone"
                        className="form-control"
                        value={form.contactPhone}
                        onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                        maxLength={60}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="website" className="form-label">
                        Website
                      </label>
                      <input
                        type="text"
                        id="website"
                        className="form-control"
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        maxLength={190}
                        placeholder="https://…"
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="erp-field mb-0">
                      <label htmlFor="contact_address" className="form-label">
                        Address
                      </label>
                      <textarea
                        id="contact_address"
                        rows={3}
                        className="form-control"
                        value={form.contactAddress}
                        onChange={(e) =>
                          setForm({ ...form, contactAddress: e.target.value })
                        }
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`erp-tab-panel${tab === "branding" ? " is-active" : ""}`}>
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-photo-field">
                      <div
                        className="erp-photo-preview"
                        style={{
                          flex: "0 0 120px",
                          width: 120,
                          height: 66,
                          borderRadius: 10,
                          fontSize: 22,
                        }}
                      >
                        <img
                          src="/brand/erp-logo.jpg"
                          alt="Light logo"
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <label className="form-label">Logo (for light backgrounds)</label>
                        <p className="erp-help mb-1">
                          Shown in the top bar. PNG, SVG or WebP.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-photo-field">
                      <div
                        className="erp-photo-preview"
                        style={{
                          flex: "0 0 120px",
                          width: 120,
                          height: 66,
                          borderRadius: 10,
                          fontSize: 22,
                        }}
                      >
                        <img
                          src="/brand/erp-icon.svg"
                          alt="Icon"
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <label className="form-label">Icon / Favicon</label>
                        <p className="erp-help mb-1">
                          Square. Used as the browser icon and collapsed logo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4 mt-3">
                    <div className="erp-field mb-0">
                      <label htmlFor="primary_color" className="form-label">
                        Primary Colour
                      </label>
                      <input
                        type="color"
                        id="primary_color"
                        className="form-control form-control-color"
                        value={form.primaryColor || "#00c292"}
                        onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                        style={{ width: "100%", height: 38 }}
                      />
                      <span className="erp-help">
                        Accent colour used across the interface.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="erp-wizard-nav erp-card-foot">
            <span className="erp-form-bar-note">
              <i className="fa-solid fa-circle-info me-1"></i>
              Empty fields fall back to the shipped defaults.
            </span>
            <div className="ms-auto">
              <button type="submit" className="btn btn-erp" disabled={saving}>
                <i className="fa-solid fa-floppy-disk me-2"></i>
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
