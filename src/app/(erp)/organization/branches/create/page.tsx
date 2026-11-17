"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRANCH_TYPES } from "@/lib/tier0";

export default function CreateBranchPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState("branch");
  const [name, setName] = useState("");
  const [openedOn, setOpenedOn] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [managerName, setManagerName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim() || !name.trim()) {
      setError("Branch Code and Name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/organization/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          name,
          opened_on: openedOn,
          phone,
          email,
          manager_name: managerName,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state,
          postal_code: postalCode,
          country,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create branch.");
        setSubmitting(false);
        return;
      }
      router.push("/organization/branches");
      router.refresh();
    } catch {
      setError("Network error while creating branch.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-code-branch"></i>
          </div>
          <div>
            <h1>New Branch</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item">
                  <Link href="/organization/branches">Branch</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/organization/branches" className="btn btn-erp-ghost">
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

      <form className="erp-form" onSubmit={handleSubmit} noValidate>
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-id-card"></i>
            </div>
            <div>
              <h2>Identity</h2>
              <p>How this branch is referenced within E-Hishabi ERP.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-context-banner">
              <span className="erp-context-banner-icon">
                <i className="fa-solid fa-building-columns"></i>
              </span>
              <div className="erp-context-banner-body">
                <strong>E-Hishabi ERP</strong>
                <span>
                  Filed under HQ &mdash; switch companies from the top bar to change this.
                </span>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="code" className="form-label">
                    Branch Code <span className="erp-required">*</span>
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    className="form-control text-uppercase"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={20}
                    placeholder="DHK-HO"
                    required
                  />
                  <span className="erp-help">Unique within the company.</span>
                </div>
              </div>
              <div className="col-md-8">
                <div className="erp-field">
                  <label htmlFor="type" className="form-label">
                    Branch Type <span className="erp-required">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                  >
                    {BRANCH_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-8">
                <div className="erp-field mb-md-0">
                  <label htmlFor="name" className="form-label">
                    Branch Name <span className="erp-required">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={150}
                    placeholder="Head Office — Banani"
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field mb-0">
                  <label htmlFor="opened_on" className="form-label">
                    Opening Date
                  </label>
                  <input
                    id="opened_on"
                    name="opened_on"
                    type="date"
                    className="form-control"
                    value={openedOn}
                    onChange={(e) => setOpenedOn(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-address-book"></i>
            </div>
            <div>
              <h2>Contact</h2>
              <p>Reachability for this location.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="phone" className="form-label">
                    Phone <span className="erp-required">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fa-solid fa-phone"></i>
                    </span>
                    <input
                      id="phone"
                      name="phone"
                      type="text"
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
              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fa-solid fa-envelope"></i>
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={150}
                      placeholder="branch@company.com"
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field mb-0">
                  <label htmlFor="manager_name" className="form-label">
                    Branch Manager
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fa-solid fa-user-tie"></i>
                    </span>
                    <input
                      id="manager_name"
                      name="manager_name"
                      type="text"
                      className="form-control"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      maxLength={150}
                      placeholder="Arif Mahmud"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div>
              <h2>Address</h2>
              <p>Physical location of this branch or site office.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-12">
                <div className="erp-field">
                  <label htmlFor="address_line1" className="form-label">
                    Address Line 1 <span className="erp-required">*</span>
                  </label>
                  <input
                    id="address_line1"
                    name="address_line1"
                    type="text"
                    className="form-control"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    maxLength={190}
                    placeholder="House 42, Road 11, Block C"
                    required
                  />
                </div>
              </div>
              <div className="col-12">
                <div className="erp-field">
                  <label htmlFor="address_line2" className="form-label">
                    Address Line 2
                  </label>
                  <input
                    id="address_line2"
                    name="address_line2"
                    type="text"
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
                    id="city"
                    name="city"
                    type="text"
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
                    id="state"
                    name="state"
                    type="text"
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
                    id="postal_code"
                    name="postal_code"
                    type="text"
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

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-toggle-on"></i>
            </div>
            <div>
              <h2>Status</h2>
              <p>Inactive branches are hidden from active dropdowns.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-switch-row">
              <div>
                <h6>Active</h6>
                <p>Available for departments, projects, and staff assignment.</p>
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

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Fields marked <span className="erp-required">*</span> are required.
          </span>
          <div className="erp-form-bar-actions">
            <Link href="/organization/branches" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {submitting ? "Saving..." : "Create Branch"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
