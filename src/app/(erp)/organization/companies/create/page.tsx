"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MONTHS } from "@/lib/tier0";

type TabKey = "identity" | "contact" | "finance" | "branding";

export default function CreateCompanyPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("identity");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [incorporationDate, setIncorporationDate] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [tin, setTin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [currency, setCurrency] = useState("BDT");
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const [fyMonth, setFyMonth] = useState("7");
  const [fyDay, setFyDay] = useState("1");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim() || !name.trim()) {
      setTab("identity");
      setError("Company Code and Name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/organization/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          legal_name: legalName,
          incorporation_date: incorporationDate,
          registration_number: registrationNumber,
          tax_identification_number: tin,
          email,
          phone,
          website,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state,
          postal_code: postalCode,
          country,
          currency,
          timezone,
          financial_year_start_month: Number(fyMonth),
          financial_year_start_day: Number(fyDay),
          is_active: isActive,
          is_default: isDefault,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create company.");
        setSubmitting(false);
        return;
      }
      router.push("/organization/companies");
      router.refresh();
    } catch {
      setError("Network error while creating company.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-narrow">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-building-circle-arrow-right"></i>
          </div>
          <div>
            <h1>New Company</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item">
                  <Link href="/organization/companies">Company</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/organization/companies" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fa-solid fa-circle-exclamation me-2"></i>
          {error}
        </div>
      )}

      <form className="erp-form cf-form" onSubmit={handleSubmit} noValidate>
        <nav className="cf-tabs" role="tablist" aria-label="Company sections">
          {[
            { key: "identity" as const, num: 1, title: "Identity", sub: "Name & registration" },
            { key: "contact" as const, num: 2, title: "Contact & Address", sub: "How to reach you" },
            { key: "finance" as const, num: 3, title: "Finance & Locale", sub: "Currency, year, time" },
            { key: "branding" as const, num: 4, title: "Branding & Status", sub: "Logo & availability" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              className="cf-tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              <span className="cf-tab-step">
                <span className="cf-tab-num">{t.num}</span>
              </span>
              <span className="cf-tab-text">
                <b>{t.title}</b>
                <small>{t.sub}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="cf-layout">
          <div className="cf-main">
            {tab === "identity" && (
              <div className="cf-panel">
                <section className="erp-card erp-form-section">
                  <div className="erp-section-head">
                    <div className="erp-section-icon">
                      <i className="fa-solid fa-id-card"></i>
                    </div>
                    <div>
                      <h2>Identity &amp; Registration</h2>
                      <p>Legal identity used on deeds, tax filings, and invoices.</p>
                    </div>
                  </div>
                  <div className="erp-card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="erp-field">
                          <label className="form-label">
                            Code <span className="erp-required">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control text-uppercase"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            maxLength={20}
                            placeholder="HQ"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className="erp-field">
                          <label className="form-label">
                            Company Name <span className="erp-required">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={150}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className="erp-field">
                          <label className="form-label">Legal Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={legalName}
                            onChange={(e) => setLegalName(e.target.value)}
                            maxLength={190}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="erp-field">
                          <label className="form-label">Incorporation Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={incorporationDate}
                            onChange={(e) => setIncorporationDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field mb-md-0">
                          <label className="form-label">Registration No.</label>
                          <input
                            type="text"
                            className="form-control"
                            value={registrationNumber}
                            onChange={(e) => setRegistrationNumber(e.target.value)}
                            maxLength={60}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field mb-0">
                          <label className="form-label">Tax Identification No. (TIN)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={tin}
                            onChange={(e) => setTin(e.target.value)}
                            maxLength={60}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {tab === "contact" && (
              <div className="cf-panel">
                <section className="erp-card erp-form-section">
                  <div className="erp-section-head">
                    <div className="erp-section-icon">
                      <i className="fa-solid fa-address-book"></i>
                    </div>
                    <div>
                      <h2>Contact Details</h2>
                      <p>Printed on official communications and receipts.</p>
                    </div>
                  </div>
                  <div className="erp-card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="erp-field">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="erp-field">
                          <label className="form-label">Phone</label>
                          <input
                            type="text"
                            className="form-control"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="erp-field">
                          <label className="form-label">Website</label>
                          <input
                            type="text"
                            className="form-control"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="erp-card erp-form-section">
                  <div className="erp-section-head">
                    <div className="erp-section-icon">
                      <i className="fa-solid fa-location-dot"></i>
                    </div>
                    <div>
                      <h2>Registered Address</h2>
                      <p>Head office registered street address.</p>
                    </div>
                  </div>
                  <div className="erp-card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">Address Line 1</label>
                          <input
                            type="text"
                            className="form-control"
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">Address Line 2</label>
                          <input
                            type="text"
                            className="form-control"
                            value={addressLine2}
                            onChange={(e) => setAddressLine2(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="erp-field mb-md-0">
                          <label className="form-label">City</label>
                          <input
                            type="text"
                            className="form-control"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="erp-field mb-md-0">
                          <label className="form-label">State / Division</label>
                          <input
                            type="text"
                            className="form-control"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="erp-field mb-md-0">
                          <label className="form-label">Postal Code</label>
                          <input
                            type="text"
                            className="form-control"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="erp-field mb-0">
                          <label className="form-label">Country</label>
                          <input
                            type="text"
                            className="form-control"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {tab === "finance" && (
              <div className="cf-panel">
                <section className="erp-card erp-form-section">
                  <div className="erp-section-head">
                    <div className="erp-section-icon">
                      <i className="fa-solid fa-coins"></i>
                    </div>
                    <div>
                      <h2>Financial &amp; Localisation</h2>
                      <p>Reporting currency, timezone, and fiscal start date.</p>
                    </div>
                  </div>
                  <div className="erp-card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">Base Currency</label>
                          <select
                            className="form-select"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                          >
                            <option value="BDT">BDT — Bangladeshi Taka (৳)</option>
                            <option value="USD">USD — US Dollar ($)</option>
                            <option value="EUR">EUR — Euro (€)</option>
                            <option value="GBP">GBP — British Pound (£)</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">Timezone</label>
                          <select
                            className="form-select"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                          >
                            <option value="Asia/Dhaka">Asia/Dhaka (UTC+06:00)</option>
                            <option value="UTC">UTC</option>
                            <option value="Asia/Dubai">Asia/Dubai (UTC+04:00)</option>
                            <option value="Asia/Singapore">Asia/Singapore (UTC+08:00)</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field mb-md-0">
                          <label className="form-label">Financial Year Start Month</label>
                          <select
                            className="form-select"
                            value={fyMonth}
                            onChange={(e) => setFyMonth(e.target.value)}
                          >
                            {MONTHS.map((m, idx) => (
                              <option key={m} value={String(idx + 1)}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field mb-0">
                          <label className="form-label">Financial Year Start Day</label>
                          <input
                            type="number"
                            min={1}
                            max={28}
                            className="form-control"
                            value={fyDay}
                            onChange={(e) => setFyDay(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {tab === "branding" && (
              <div className="cf-panel">
                <section className="erp-card erp-form-section">
                  <div className="erp-section-head">
                    <div className="erp-section-icon">
                      <i className="fa-solid fa-toggle-on"></i>
                    </div>
                    <div>
                      <h2>Status</h2>
                      <p>Availability and default company context.</p>
                    </div>
                  </div>
                  <div className="erp-card-body">
                    <div className="erp-switch-row">
                      <div>
                        <h6>Default company</h6>
                        <p>Selected automatically at sign-in.</p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          role="switch"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                        />
                      </div>
                    </div>

                    <div className="erp-switch-row">
                      <div>
                        <h6>Active</h6>
                        <p>Available across branch, project, and accounting selections.</p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          role="switch"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Fields marked <span className="erp-required">*</span> are required.
          </span>
          <div className="erp-form-bar-actions">
            <Link href="/organization/companies" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {submitting ? "Saving..." : "Create Company"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
