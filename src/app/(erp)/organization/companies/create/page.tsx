"use client";

import React, { FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MONTHS } from "@/lib/tier0";

type TabKey = "identity" | "contact" | "finance" | "branding";
const TAB_ORDER: TabKey[] = ["identity", "contact", "finance", "branding"];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function computeFyRange(startMonth: number, startDay: number): string {
  const mIdx = Math.max(0, Math.min(11, startMonth - 1));
  const d = Math.max(1, Math.min(31, startDay || 1));
  const start = new Date(2026, mIdx, d);
  const end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate() - 1);
  return `${start.getDate()} ${MONTH_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTH_SHORT[end.getMonth()]}`;
}

export default function CreateCompanyPage() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tabIdx = TAB_ORDER.indexOf(tab);
  const fyPreview = useMemo(
    () => computeFyRange(Number(fyMonth) || 7, Number(fyDay) || 1),
    [fyMonth, fyDay]
  );

  const requiredFilled = useMemo(() => {
    const reqValues = [
      code.trim(),
      name.trim(),
      email.trim(),
      phone.trim(),
      addressLine1.trim(),
      city.trim(),
      country.trim(),
      currency.trim(),
      timezone.trim(),
    ];
    const done = reqValues.filter(Boolean).length;
    return Math.round((done / reqValues.length) * 100);
  }, [code, name, email, phone, addressLine1, city, country, currency, timezone]);

  const addressSummary = useMemo(() => {
    const parts = [addressLine1.trim(), city.trim(), country.trim()].filter(Boolean);
    return parts.join(", ");
  }, [addressLine1, city, country]);

  function onLogoChange(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

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
              <div className="cf-panel" id="cf-panel-identity" role="tabpanel">
                <section id="section-identity" className="erp-card erp-form-section">
                  <div className="erp-section-head">
                    <div className="erp-section-icon">
                      <i className="fa-solid fa-id-card"></i>
                    </div>
                    <div>
                      <h2>Identity &amp; Registration</h2>
                      <p>How the company is named on documents and identified to the authorities.</p>
                    </div>
                  </div>
                  <div className="erp-card-body">
                    <div className="cf-group-label">Names</div>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="erp-field">
                          <label htmlFor="code" className="form-label">
                            Company Code <span className="erp-required">*</span>
                          </label>
                          <input
                            type="text"
                            id="code"
                            name="code"
                            className="form-control text-uppercase"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            maxLength={20}
                            placeholder="SKY-DHK"
                            required
                          />
                          <span className="erp-help">
                            Short unique key used in document numbering. Cannot be changed later.
                          </span>
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className="erp-field">
                          <label htmlFor="name" className="form-label">
                            Company Name <span className="erp-required">*</span>
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={150}
                            placeholder="Skyline Developments"
                            required
                          />
                          <span className="erp-help">
                            Trading name shown across the application.
                          </span>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="erp-field">
                          <label htmlFor="legal_name" className="form-label">
                            Legal Name
                          </label>
                          <input
                            type="text"
                            id="legal_name"
                            name="legal_name"
                            className="form-control"
                            value={legalName}
                            onChange={(e) => setLegalName(e.target.value)}
                            maxLength={190}
                            placeholder="Skyline Developments Limited"
                          />
                          <span className="erp-help">
                            Registered name printed on contracts and invoices.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="cf-group-label">Registration</div>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="erp-field mb-md-0">
                          <label htmlFor="incorporation_date" className="form-label">
                            Date of Incorporation
                          </label>
                          <input
                            type="date"
                            id="incorporation_date"
                            name="incorporation_date"
                            className="form-control"
                            value={incorporationDate}
                            onChange={(e) => setIncorporationDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="erp-field mb-md-0">
                          <label htmlFor="registration_number" className="form-label">
                            Registration Number
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="fa-solid fa-hashtag"></i>
                            </span>
                            <input
                              type="text"
                              id="registration_number"
                              name="registration_number"
                              className="form-control"
                              value={registrationNumber}
                              onChange={(e) => setRegistrationNumber(e.target.value)}
                              maxLength={60}
                              placeholder="C-123456/2018"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="erp-field mb-0">
                          <label htmlFor="tax_identification_number" className="form-label">
                            TIN / VAT
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="fa-solid fa-receipt"></i>
                            </span>
                            <input
                              type="text"
                              id="tax_identification_number"
                              name="tax_identification_number"
                              className="form-control"
                              value={tin}
                              onChange={(e) => setTin(e.target.value)}
                              maxLength={60}
                              placeholder="1234-5678-9012"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {tab === "contact" && (
              <div className="cf-panel" id="cf-panel-contact" role="tabpanel">
                <section id="section-contact" className="erp-card erp-form-section">
                  <div className="erp-section-head">
                    <div className="erp-section-icon">
                      <i className="fa-solid fa-address-book"></i>
                    </div>
                    <div>
                      <h2>Contact Details</h2>
                      <p>Used on outgoing correspondence, demand letters and receipts.</p>
                    </div>
                  </div>
                  <div className="erp-card-body">
                    <div className="cf-group-label">Reachability</div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label htmlFor="email" className="form-label">
                            Email Address <span className="erp-required">*</span>
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
                              placeholder="info@company.com"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label htmlFor="phone" className="form-label">
                            Phone <span className="erp-required">*</span>
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
                              placeholder="+880 2 5566 7788"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="erp-field mb-0">
                          <label htmlFor="website" className="form-label">
                            Website
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <i className="fa-solid fa-globe"></i>
                            </span>
                            <input
                              type="text"
                              id="website"
                              name="website"
                              className="form-control"
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                              maxLength={190}
                              placeholder="company.com"
                            />
                          </div>
                          <span className="erp-help">
                            Add the domain only — https:// is applied automatically.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="section-address" className="erp-card erp-form-section">
                  <div className="erp-section-head">
                    <div className="erp-section-icon">
                      <i className="fa-solid fa-location-dot"></i>
                    </div>
                    <div>
                      <h2>Registered Address</h2>
                      <p>The legal address of record for this company.</p>
                    </div>
                  </div>
                  <div className="erp-card-body">
                    <div className="cf-group-label">Registered Address</div>
                    <div className="row">
                      <div className="col-md-7">
                        <div className="erp-field">
                          <label htmlFor="address_line1" className="form-label">
                            Address Line 1 <span className="erp-required">*</span>
                          </label>
                          <input
                            type="text"
                            id="address_line1"
                            name="address_line1"
                            className="form-control"
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                            maxLength={190}
                            placeholder="House 42, Road 11, Block C"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-5">
                        <div className="erp-field">
                          <label htmlFor="address_line2" className="form-label">
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            id="address_line2"
                            name="address_line2"
                            className="form-control"
                            value={addressLine2}
                            onChange={(e) => setAddressLine2(e.target.value)}
                            maxLength={190}
                            placeholder="Banani"
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="erp-field mb-md-0">
                          <label htmlFor="city" className="form-label">
                            City <span className="erp-required">*</span>
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            className="form-control"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            maxLength={100}
                            placeholder="Dhaka"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="erp-field mb-md-0">
                          <label htmlFor="state" className="form-label">
                            State / Division
                          </label>
                          <input
                            type="text"
                            id="state"
                            name="state"
                            className="form-control"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            maxLength={100}
                            placeholder="Dhaka Division"
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="erp-field mb-md-0">
                          <label htmlFor="postal_code" className="form-label">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            id="postal_code"
                            name="postal_code"
                            className="form-control"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            maxLength={20}
                            placeholder="1213"
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="erp-field mb-0">
                          <label htmlFor="country" className="form-label">
                            Country <span className="erp-required">*</span>
                          </label>
                          <select
                            id="country"
                            name="country"
                            className="form-select"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            required
                          >
                            <option value="Bangladesh">Bangladesh</option>
                            <option value="India">India</option>
                            <option value="United Arab Emirates">United Arab Emirates</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="United States">United States</option>
                            <option value="Singapore">Singapore</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {tab === "finance" && (
              <div className="cf-panel" id="cf-panel-finance" role="tabpanel">
                <section id="section-finance" className="erp-card erp-form-section">
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
                          <label htmlFor="currency" className="form-label">
                            Base Currency <span className="erp-required">*</span>
                          </label>
                          <select
                            id="currency"
                            className="form-select"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            required
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
                          <label htmlFor="timezone" className="form-label">
                            Timezone <span className="erp-required">*</span>
                          </label>
                          <select
                            id="timezone"
                            className="form-select"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            required
                          >
                            <option value="Asia/Dhaka">Asia/Dhaka (UTC+06:00)</option>
                            <option value="UTC">UTC</option>
                            <option value="Asia/Dubai">Asia/Dubai (UTC+04:00)</option>
                            <option value="Asia/Singapore">Asia/Singapore (UTC+08:00)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="cf-group-label">Financial Year</div>
                    <div className="row align-items-end">
                      <div className="col-md-5">
                        <div className="erp-field mb-md-0">
                          <label htmlFor="financial_year_start_month" className="form-label">
                            Starts in <span className="erp-required">*</span>
                          </label>
                          <select
                            id="financial_year_start_month"
                            className="form-select"
                            value={fyMonth}
                            onChange={(e) => setFyMonth(e.target.value)}
                            required
                          >
                            {MONTHS.map((m, idx) => (
                              <option key={m} value={String(idx + 1)}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="erp-field mb-md-0">
                          <label htmlFor="financial_year_start_day" className="form-label">
                            Day <span className="erp-required">*</span>
                          </label>
                          <input
                            type="number"
                            id="financial_year_start_day"
                            min={1}
                            max={31}
                            className="form-control"
                            value={fyDay}
                            onChange={(e) => setFyDay(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-5">
                        <div className="cf-fy">
                          <i className="fa-solid fa-calendar-days"></i>
                          <div>
                            <small>Reporting year</small>
                            <strong>{fyPreview}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {tab === "branding" && (
              <div className="cf-panel" id="cf-panel-branding" role="tabpanel">
                <section id="section-branding" className="erp-card erp-form-section">
                  <div className="erp-section-head">
                    <div className="erp-section-icon">
                      <i className="fa-solid fa-image"></i>
                    </div>
                    <div>
                      <h2>Branding</h2>
                      <p>Appears in the sidebar, company switcher and printed documents.</p>
                    </div>
                  </div>
                  <div className="erp-card-body">
                    <div
                      className="erp-logo-zone"
                      role="button"
                      tabIndex={0}
                      onClick={() => logoInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") logoInputRef.current?.click();
                      }}
                    >
                      <div className="erp-logo-preview">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Company logo preview" />
                        ) : (
                          <i className="fa-solid fa-image erp-logo-placeholder"></i>
                        )}
                      </div>
                      <div className="erp-logo-copy">
                        <h6>Drop a logo here, or click to browse</h6>
                        <p>
                          PNG, JPG, JPEG, SVG, WEBP up to 2 MB. A square or wide transparent PNG
                          works best.
                        </p>
                        <div className="erp-logo-actions">
                          <span className="btn btn-erp-ghost btn-sm">
                            <i className="fa-solid fa-upload me-1"></i>Choose file
                          </span>
                          {logoPreview && (
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLogoPreview(null);
                                if (logoInputRef.current) logoInputRef.current.value = "";
                              }}
                            >
                              <i className="fa-solid fa-trash-can me-1"></i>Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        name="logo"
                        className="d-none"
                        accept=".png,.jpg,.jpeg,.svg,.webp"
                        onChange={(e) => onLogoChange(e.target.files?.[0])}
                      />
                    </div>
                  </div>
                </section>

                <section id="section-status" className="erp-card erp-form-section">
                  <div className="erp-section-head">
                    <div className="erp-section-icon">
                      <i className="fa-solid fa-toggle-on"></i>
                    </div>
                    <div>
                      <h2>Status</h2>
                      <p>Controls availability across the application.</p>
                    </div>
                  </div>
                  <div className="erp-card-body">
                    <div className="erp-switch-row">
                      <div>
                        <h6>Active</h6>
                        <p>
                          Inactive companies are hidden from selection but keep their history.
                        </p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          id="is_active"
                          className="form-check-input"
                          role="switch"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                        />
                      </div>
                    </div>

                    <div className="erp-switch-row">
                      <div>
                        <h6>Default company</h6>
                        <p>
                          Pre-selected when users sign in. Only one company can hold this flag.
                        </p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          id="is_default"
                          className="form-check-input"
                          role="switch"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            <div className="erp-form-bar cf-bar">
              <button
                type="button"
                className="btn btn-erp-ghost"
                disabled={tabIdx === 0}
                onClick={() => setTab(TAB_ORDER[Math.max(0, tabIdx - 1)])}
              >
                <i className="fa-solid fa-arrow-left me-2"></i>Back
              </button>
              <span className="erp-form-bar-note d-none d-md-inline">
                <i className="fa-solid fa-circle-info me-1"></i>
                Fields marked <span className="erp-required">*</span> are required.
              </span>
              <div className="erp-form-bar-actions">
                <Link href="/organization/companies" className="btn btn-erp-ghost">
                  Cancel
                </Link>
                {tabIdx < TAB_ORDER.length - 1 && (
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    onClick={() => setTab(TAB_ORDER[Math.min(TAB_ORDER.length - 1, tabIdx + 1)])}
                  >
                    Next<i className="fa-solid fa-arrow-right ms-2"></i>
                  </button>
                )}
                <button type="submit" className="btn btn-erp" disabled={submitting}>
                  <i className="fa-solid fa-floppy-disk me-2"></i>
                  {submitting ? "Saving..." : "Create Company"}
                </button>
              </div>
            </div>
          </div>

          <aside className="cf-aside">
            <div className="cf-preview">
              <div className="cf-preview-cover">
                <div className="cf-preview-logo">
                  {logoPreview ? (
                    <img src={logoPreview} alt={name || "Company logo"} />
                  ) : code.trim() ? (
                    <span className="fw-bold">{code.trim().slice(0, 2).toUpperCase()}</span>
                  ) : (
                    <i className="fa-solid fa-building"></i>
                  )}
                </div>
                <span className="cf-preview-code">{code.trim().toUpperCase() || "CODE"}</span>
              </div>
              <div className="cf-preview-body">
                <h3>{name.trim() || "Company name"}</h3>
                <p className="cf-preview-legal">{legalName.trim()}</p>

                <div className="cf-preview-badges">
                  <span className="cf-badge is-active" hidden={!isActive}>
                    Active
                  </span>
                  <span className="cf-badge is-default" hidden={!isDefault}>
                    Default
                  </span>
                </div>

                <ul className="cf-preview-list">
                  <li>
                    <i className="fa-solid fa-envelope"></i>
                    <span>{email.trim() || "—"}</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-phone"></i>
                    <span>{phone.trim() || "—"}</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-globe"></i>
                    <span>{website.trim() || "—"}</span>
                  </li>
                  <li>
                    <i className="fa-solid fa-location-dot"></i>
                    <span>{addressSummary || "—"}</span>
                  </li>
                </ul>

                <dl className="cf-preview-facts">
                  <div>
                    <dt>Currency</dt>
                    <dd>{currency || "—"}</dd>
                  </div>
                  <div>
                    <dt>Year</dt>
                    <dd>{fyPreview}</dd>
                  </div>
                  <div>
                    <dt>Reg. No</dt>
                    <dd>{registrationNumber.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt>TIN</dt>
                    <dd>{tin.trim() || "—"}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="cf-progress">
              <div className="tw:flex tw:justify-between">
                <span>Required fields</span>
                <b>{requiredFilled}%</b>
              </div>
              <div className="cf-progress-bar">
                <span style={{ width: `${requiredFilled}%` }}></span>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
