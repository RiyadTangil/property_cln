"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileTabs from "./ProfileTabs";

export interface ProfilePrefsData {
  theme: string;
  navLayout: string;
  sidebarColor: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

const TIMEZONE_OPTIONS = [
  "",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Riyadh",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

const SIDEBAR_COLOR_CHOICES = [
  { key: "light", label: "White", sw: "#ffffff" },
  { key: "slate", label: "Mist", sw: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)" },
  { key: "mint", label: "Mint", sw: "linear-gradient(180deg, #f0fdf8 0%, #e3f7ee 100%)" },
  { key: "midnight", label: "Midnight", sw: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" },
  { key: "navy", label: "Navy", sw: "linear-gradient(180deg, #0b1f3a 0%, #133a6b 100%)" },
  { key: "emerald", label: "Emerald", sw: "linear-gradient(180deg, #053f31 0%, #0b5e4a 100%)" },
  { key: "indigo", label: "Indigo", sw: "linear-gradient(180deg, #1e1b4b 0%, #3730a3 100%)" },
  { key: "plum", label: "Plum", sw: "linear-gradient(180deg, #3b0d3f 0%, #6b2167 100%)" },
  { key: "charcoal", label: "Charcoal", sw: "linear-gradient(180deg, #18181b 0%, #2a2a30 100%)" },
];

export default function ProfilePreferencesClient({
  initial,
}: {
  initial: ProfilePrefsData;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState(initial.theme || "light");
  const [navLayout, setNavLayout] = useState(initial.navLayout || "side");
  const [sidebarColor, setSidebarColor] = useState(initial.sidebarColor || "light");
  const [timezone, setTimezone] = useState(initial.timezone || "");
  const [dateFormat, setDateFormat] = useState(initial.dateFormat || "d M Y");
  const [timeFormat, setTimeFormat] = useState(initial.timeFormat || "g:i A");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice("");
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          nav_layout: navLayout,
          sidebar_color: sidebarColor,
          timezone: timezone || "Asia/Dhaka",
          date_format: dateFormat,
          time_format: timeFormat,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save preferences.");
      } else {
        const resolved =
          theme === "system" &&
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : theme === "system"
            ? "light"
            : theme;
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", resolved);
          document.documentElement.setAttribute("data-theme-preference", theme);
          if (navLayout === "side") document.documentElement.classList.add("erp-nav-side");
          else document.documentElement.classList.remove("erp-nav-side");
        }
        setNotice("Preferences saved.");
        router.refresh();
      }
    } catch {
      setError("Network error while saving preferences.");
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
            <h1>Preferences</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/profile">Profile</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Preferences
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <ProfileTabs active="preferences" />

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
              <i className="fa-solid fa-palette"></i>
            </div>
            <div>
              <h2>Theme</h2>
              <p>Applies as soon as you save, on every device you sign in from.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-theme-choices" role="radiogroup" aria-label="Theme">
              <label className="erp-theme-choice">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === "light"}
                  onChange={() => setTheme("light")}
                />
                <span className="erp-theme-choice-body">
                  <i className="fa-solid fa-sun"></i>
                  <strong>Light</strong>
                  <small>Always the light palette.</small>
                </span>
              </label>

              <label className="erp-theme-choice">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === "dark"}
                  onChange={() => setTheme("dark")}
                />
                <span className="erp-theme-choice-body">
                  <i className="fa-solid fa-moon"></i>
                  <strong>Dark</strong>
                  <small>Always the dark palette.</small>
                </span>
              </label>

              <label className="erp-theme-choice">
                <input
                  type="radio"
                  name="theme"
                  value="system"
                  checked={theme === "system"}
                  onChange={() => setTheme("system")}
                />
                <span className="erp-theme-choice-body">
                  <i className="fa-solid fa-desktop"></i>
                  <strong>System</strong>
                  <small>Follow the operating system.</small>
                </span>
              </label>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-table-columns"></i>
            </div>
            <div>
              <h2>Navigation</h2>
              <p>Where the module menu sits on desktop. Phones always use the slide-out menu.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-theme-choices" role="radiogroup" aria-label="Navigation layout">
              <label className="erp-theme-choice">
                <input
                  type="radio"
                  name="nav_layout"
                  value="top"
                  checked={navLayout === "top"}
                  onChange={() => setNavLayout("top")}
                />
                <span className="erp-theme-choice-body">
                  <i className="fa-solid fa-table-columns fa-rotate-270"></i>
                  <strong>Top bar</strong>
                  <small>Modules across the top, full width for content.</small>
                </span>
              </label>

              <label className="erp-theme-choice">
                <input
                  type="radio"
                  name="nav_layout"
                  value="side"
                  checked={navLayout === "side"}
                  onChange={() => setNavLayout("side")}
                />
                <span className="erp-theme-choice-body">
                  <i className="fa-solid fa-table-columns"></i>
                  <strong>Sidebar</strong>
                  <small>Modules down the left, collapsible to icons.</small>
                </span>
              </label>
            </div>

            <label className="form-label mt-4 mb-2">Sidebar colour</label>
            <div className="d-flex flex-wrap gap-2" role="radiogroup" aria-label="Sidebar colour">
              {SIDEBAR_COLOR_CHOICES.map((c) => (
                <label key={c.key} className="erp-sidebar-swatch-choice" title={c.label}>
                  <input
                    type="radio"
                    name="sidebar_color"
                    value={c.key}
                    className="visually-hidden"
                    checked={sidebarColor === c.key}
                    onChange={() => setSidebarColor(c.key)}
                  />
                  <span
                    className="erp-sidebar-swatch-choice-chip"
                    style={{ "--sw": c.sw } as React.CSSProperties}
                  ></span>
                  <small>{c.label}</small>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-earth-asia"></i>
            </div>
            <div>
              <h2>Dates &amp; Times</h2>
              <p>How timestamps are shown to you. Stored values are unaffected.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-12">
                <div className="erp-field">
                  <label htmlFor="timezone" className="form-label">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    className="form-select"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz || "default"} value={tz}>
                        {tz ? tz : "Follow the company (Asia/Dhaka)"}
                      </option>
                    ))}
                  </select>
                  <span className="erp-help">
                    Leave on “follow the company” to track whichever company you switch to.
                  </span>
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field mb-md-0">
                  <label htmlFor="date_format" className="form-label">
                    Date Format
                  </label>
                  <select
                    id="date_format"
                    name="date_format"
                    className="form-select"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                  >
                    <option value="d M Y">15 Jan 2026</option>
                    <option value="d/m/Y">15/01/2026</option>
                    <option value="m/d/Y">01/15/2026</option>
                    <option value="Y-m-d">2026-01-15</option>
                    <option value="j F Y">15 January 2026</option>
                  </select>
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field mb-0">
                  <label htmlFor="time_format" className="form-label">
                    Time Format
                  </label>
                  <select
                    id="time_format"
                    name="time_format"
                    className="form-select"
                    value={timeFormat}
                    onChange={(e) => setTimeFormat(e.target.value)}
                  >
                    <option value="g:i A">4:30 PM</option>
                    <option value="H:i">16:30</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            These settings only change what you see.
          </span>
          <div className="erp-form-bar-actions">
            <Link href="/profile" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" disabled={saving}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {saving ? "Saving…" : "Save Preferences"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
