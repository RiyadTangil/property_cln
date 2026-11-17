"use client";

import React, { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateFiscalYearForm({ companyName, companyCode }: { companyName: string; companyCode: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2027-06-30");
  const [periodCadence, setPeriodCadence] = useState("monthly");
  const [hasAdjustmentPeriod, setHasAdjustmentPeriod] = useState(false);
  const [isCurrent, setIsCurrent] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const spanPreview = useMemo(() => {
    if (!startDate || !endDate) return "Pick start and end dates";
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) {
      return "End date must fall after start date";
    }
    const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
    return `${days} days`;
  }, [startDate, endDate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim() || !name.trim() || !startDate || !endDate) {
      setError("Code, Name, Start Date, and End Date are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/organization/fiscal-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          start_date: startDate,
          end_date: endDate,
          period_cadence: periodCadence,
          has_adjustment_period: hasAdjustmentPeriod,
          is_current: isCurrent,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create fiscal year.");
        setSubmitting(false);
        return;
      }
      router.push("/organization/fiscal-years");
      router.refresh();
    } catch {
      setError("Network error while creating fiscal year.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div>
            <h1>New Fiscal Year</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item">
                  <Link href="/organization/fiscal-years">Fiscal Years</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/organization/fiscal-years" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="erp-form" noValidate>
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            <div>
              <h2>Identity</h2>
              <p>Name, code and the exact dates the fiscal year opens and closes.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-context-banner">
              <span className="erp-context-banner-icon">
                <i className="fa-solid fa-building-columns"></i>
              </span>
              <div className="erp-context-banner-body">
                <strong>{companyName}</strong>
                <span>
                  Filed under {companyCode} — switch companies from the top bar to change this.
                </span>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="code" className="form-label">
                    Code <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    className="form-control text-uppercase"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={20}
                    placeholder="FY2627"
                    required
                  />
                  <span className="erp-help">Short tag used on ledgers and reports.</span>
                </div>
              </div>

              <div className="col-md-8">
                <div className="erp-field">
                  <label htmlFor="name" className="form-label">
                    Fiscal Year Name <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    placeholder="FY 2026–2027"
                    required
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="start_date" className="form-label">
                    Start Date <span className="erp-required">*</span>
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="end_date" className="form-label">
                    End Date <span className="erp-required">*</span>
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label className="form-label">Span</label>
                  <div
                    className="form-control d-flex align-items-center"
                    style={{ background: "#f7f9fc", fontWeight: 600 }}
                  >
                    <i
                      className="fa-solid fa-hourglass-half me-2"
                      style={{ color: "var(--erp-primary)" }}
                    ></i>
                    <span>{spanPreview}</span>
                  </div>
                  <span className="erp-help">Must stay within 14 months.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <h2>Accounting Periods</h2>
              <p>Split the year into posting periods now. You can reopen or close each period independently later.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="period_cadence" className="form-label">
                    Period Schedule
                  </label>
                  <select
                    id="period_cadence"
                    name="period_cadence"
                    className="form-select"
                    value={periodCadence}
                    onChange={(e) => setPeriodCadence(e.target.value)}
                  >
                    <option value="monthly">Monthly — 12 periods</option>
                    <option value="quarterly">Quarterly — 4 periods</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="erp-switch-row">
              <div>
                <h6>Include year-end adjustment period</h6>
                <p>Adds a Period 13 closing bucket on the final day for auditor and tax adjustments.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="has_adjustment_period"
                  checked={hasAdjustmentPeriod}
                  onChange={(e) => setHasAdjustmentPeriod(e.target.checked)}
                />
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
              <h2>Behaviour</h2>
              <p>Which year new transactions land in by default.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-switch-row">
              <div>
                <h6>Current fiscal year</h6>
                <p>Makes this the active default year (clears Current off any earlier year).</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="is_current"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                />
              </div>
            </div>

            <div className="erp-field mb-0 mt-3">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                className="form-control"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                placeholder="Optional audit note or statutory filing reference."
              />
            </div>
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Fields marked <span className="erp-required">*</span> are required.
          </span>
          <div className="erp-form-bar-actions">
            <Link href="/organization/fiscal-years" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {submitting ? "Creating…" : "Create Fiscal Year"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
