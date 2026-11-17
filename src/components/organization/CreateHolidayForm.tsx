"use client";

import React, { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HOLIDAY_TYPES } from "@/lib/tier0";
import {
  ErpContextBanner,
  ErpFormBar,
  ErpPageHeader,
  ErpSectionCard,
} from "@/components/ui";

const COLORS = [
  { value: "emerald", label: "Emerald", hex: "#00c292" },
  { value: "sky", label: "Sky", hex: "#03a9f3" },
  { value: "amber", label: "Amber", hex: "#ff9800" },
  { value: "rose", label: "Rose", hex: "#e91e63" },
  { value: "violet", label: "Violet", hex: "#7e57c2" },
  { value: "slate", label: "Slate", hex: "#607d8b" },
];

export default function CreateHolidayForm({
  companyName,
  companyCode,
  branches,
  departments,
}: {
  companyName: string;
  companyCode: string;
  branches: { id: number; name: string; code: string }[];
  departments: { id: number; name: string; code: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("public");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState("emerald");
  const [description, setDescription] = useState("");
  const [appliesTo, setAppliesTo] = useState<"company" | "branches" | "departments">("company");
  const [branchIds, setBranchIds] = useState<number[]>([]);
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const durationText = useMemo(() => {
    if (!startDate) return "—";
    const s = new Date(startDate);
    const e = new Date(endDate || startDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return "Invalid range";
    const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
    return `${days} ${days === 1 ? "day" : "days"}`;
  }, [startDate, endDate]);

  function toggleId(list: number[], setList: (v: number[]) => void, id: number) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !startDate) {
      setError("Holiday Name and Start Date are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/organization/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          start_date: startDate,
          end_date: endDate || startDate,
          color,
          description,
          applies_to: appliesTo,
          branch_ids: branchIds,
          department_ids: departmentIds,
          is_recurring: isRecurring,
          is_paid: isPaid,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create holiday.");
        setSubmitting(false);
        return;
      }
      router.push("/organization/holidays");
      router.refresh();
    } catch {
      setError("Network error while creating holiday.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <ErpPageHeader
        icon="fa-solid fa-calendar-day"
        title="New Holiday"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Organization" },
          { label: "Holidays", href: "/organization/holidays" },
          { label: "New" },
        ]}
        actions={
          <Link href="/organization/holidays" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        }
      />

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="erp-form" noValidate>
        <ErpSectionCard
          icon="fa-solid fa-calendar-day"
          title="Holiday"
          subtitle="What the day is called, when it falls and how it should be treated."
        >
          <ErpContextBanner
            companyName={companyName}
            description={`Filed under ${companyCode} — switch companies from the top bar to change this.`}
          />

          <div className="row">
            <div className="col-md-7">
              <div className="erp-field">
                <label htmlFor="name" className="form-label">
                  Holiday Name <span className="erp-required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={150}
                  placeholder="Victory Day"
                  required
                />
              </div>
            </div>

            <div className="col-md-5">
              <div className="erp-field">
                <label htmlFor="type" className="form-label">
                  Type <span className="erp-required">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  {HOLIDAY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-md-4">
              <div className="erp-field">
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
              <div className="erp-field">
                <label htmlFor="end_date" className="form-label">
                  End Date
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <span className="erp-help">Leave empty for a single-day holiday.</span>
              </div>
            </div>

            <div className="col-md-4">
              <div className="erp-field">
                <label className="form-label">Duration</label>
                <div
                  className="form-control d-flex align-items-center"
                  style={{ background: "#f7f9fc", fontWeight: 600 }}
                >
                  <i
                    className="fa-solid fa-hourglass-half me-2"
                    style={{ color: "var(--erp-primary)" }}
                  ></i>
                  <span>{durationText}</span>
                </div>
                <span className="erp-help">Counted inclusive of both dates.</span>
              </div>
            </div>
          </div>

          <div className="erp-field">
            <label className="form-label">Calendar Colour</label>
            <div className="erp-swatches">
              {COLORS.map((c) => (
                <label
                  key={c.value}
                  className="erp-swatch"
                  style={{ "--swatch": c.hex } as React.CSSProperties}
                >
                  <input
                    type="radio"
                    name="color"
                    value={c.value}
                    checked={color === c.value}
                    onChange={() => setColor(c.value)}
                  />
                  <span title={c.label}></span>
                </label>
              ))}
            </div>
          </div>

          <div className="erp-field mb-0">
            <label htmlFor="description" className="form-label">
              Notes
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="Anything payroll or attendance should know about this day."
            />
          </div>
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-users-viewfinder"
          title="Who It Covers"
          subtitle="Give the whole company the day off, or limit it to certain branches or departments."
        >
          <div className="erp-field">
            <label className="form-label">
              Applies To <span className="erp-required">*</span>
            </label>
            <div className="erp-scope-choices" role="radiogroup" aria-label="Applies to">
              <label className="erp-scope-choice">
                <input
                  type="radio"
                  name="applies_to"
                  value="company"
                  checked={appliesTo === "company"}
                  onChange={() => setAppliesTo("company")}
                />
                <span className="erp-scope-choice-body">
                  <i className="fa-solid fa-building-columns"></i>
                  <span>
                    <strong>Whole company</strong>
                    <small>Everyone, wherever they sit.</small>
                  </span>
                </span>
              </label>

              <label className="erp-scope-choice">
                <input
                  type="radio"
                  name="applies_to"
                  value="branches"
                  checked={appliesTo === "branches"}
                  onChange={() => setAppliesTo("branches")}
                />
                <span className="erp-scope-choice-body">
                  <i className="fa-solid fa-code-branch"></i>
                  <span>
                    <strong>Selected branches</strong>
                    <small>Only the branches you tick below.</small>
                  </span>
                </span>
              </label>

              <label className="erp-scope-choice">
                <input
                  type="radio"
                  name="applies_to"
                  value="departments"
                  checked={appliesTo === "departments"}
                  onChange={() => setAppliesTo("departments")}
                />
                <span className="erp-scope-choice-body">
                  <i className="fa-solid fa-diagram-project"></i>
                  <span>
                    <strong>Selected departments</strong>
                    <small>Only the departments you tick below.</small>
                  </span>
                </span>
              </label>
            </div>
          </div>

          {appliesTo === "branches" && (
            <div className="erp-scope-panel">
              <div className="erp-scope-panel-head">
                <span>
                  <i className="fa-solid fa-code-branch me-2"></i>Branches
                </span>
                <span className="erp-scope-actions">
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    onClick={() => setBranchIds(branches.map((b) => b.id))}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    onClick={() => setBranchIds([])}
                  >
                    Clear
                  </button>
                </span>
              </div>
              <div className="erp-check-grid">
                {branches.map((b) => (
                  <label key={b.id} className="erp-check-item">
                    <input
                      type="checkbox"
                      checked={branchIds.includes(b.id)}
                      onChange={() => toggleId(branchIds, setBranchIds, b.id)}
                    />
                    <span>
                      <strong>{b.name}</strong>
                      <small>{b.code}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {appliesTo === "departments" && (
            <div className="erp-scope-panel">
              <div className="erp-scope-panel-head">
                <span>
                  <i className="fa-solid fa-diagram-project me-2"></i>Departments
                </span>
                <span className="erp-scope-actions">
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    onClick={() => setDepartmentIds(departments.map((d) => d.id))}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    onClick={() => setDepartmentIds([])}
                  >
                    Clear
                  </button>
                </span>
              </div>
              <div className="erp-check-grid">
                {departments.map((d) => (
                  <label key={d.id} className="erp-check-item">
                    <input
                      type="checkbox"
                      checked={departmentIds.includes(d.id)}
                      onChange={() => toggleId(departmentIds, setDepartmentIds, d.id)}
                    />
                    <span>
                      <strong>{d.name}</strong>
                      <small>{d.code}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </ErpSectionCard>

        <ErpSectionCard
          icon="fa-solid fa-toggle-on"
          title="Behaviour"
          subtitle="How the day is treated by attendance and payroll."
        >
          <div className="erp-switch-row">
            <div>
              <h6>Repeats every year</h6>
              <p>Falls on the same date annually, so it only has to be entered once.</p>
            </div>
            <div className="form-check form-switch">
              <input
                type="checkbox"
                className="form-check-input"
                role="switch"
                id="is_recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
            </div>
          </div>

          <div className="erp-switch-row">
            <div>
              <h6>Paid holiday</h6>
              <p>Employees are paid for the day without booking leave.</p>
            </div>
            <div className="form-check form-switch">
              <input
                type="checkbox"
                className="form-check-input"
                role="switch"
                id="is_paid"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
              />
            </div>
          </div>

          <div className="erp-switch-row">
            <div>
              <h6>Active</h6>
              <p>Inactive holidays stay on file but drop off the calendar.</p>
            </div>
            <div className="form-check form-switch">
              <input
                type="checkbox"
                className="form-check-input"
                role="switch"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </div>
          </div>
        </ErpSectionCard>

        <ErpFormBar
          cancelHref="/organization/holidays"
          submitLabel="Create Holiday"
          submittingLabel="Creating…"
          submitting={submitting}
        />
      </form>
    </div>
  );
}
