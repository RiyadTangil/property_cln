"use client";

import React, { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SHIFT_DAYS = [
  { value: "1", label: "Mon", tag: "Weekday", weekend: false },
  { value: "2", label: "Tue", tag: "Weekday", weekend: false },
  { value: "3", label: "Wed", tag: "Weekday", weekend: false },
  { value: "4", label: "Thu", tag: "Weekday", weekend: false },
  { value: "5", label: "Fri", tag: "Weekday", weekend: false },
  { value: "6", label: "Sat", tag: "Weekend", weekend: true },
  { value: "7", label: "Sun", tag: "Weekend", weekend: true },
];

export default function CreateShiftForm({
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
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [graceInMinutes, setGraceInMinutes] = useState(15);
  const [graceOutMinutes, setGraceOutMinutes] = useState(15);
  const [fullDayMinutes, setFullDayMinutes] = useState("");
  const [halfDayMinutes, setHalfDayMinutes] = useState("");
  const [workingDays, setWorkingDays] = useState<string[]>(["1", "2", "3", "4", "5"]);
  const [appliesTo, setAppliesTo] = useState<"company" | "branches" | "departments">("company");
  const [branchIds, setBranchIds] = useState<number[]>([]);
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const timingStats = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const sMin = (sh || 0) * 60 + (sm || 0);
    let eMin = (eh || 0) * 60 + (em || 0);
    const overnight = eMin <= sMin;
    if (overnight) eMin += 1440;
    const paidMin = Math.max(0, eMin - sMin - (Number(breakMinutes) || 0));
    const hrs = Math.floor(paidMin / 60);
    const mins = paidMin % 60;
    const dailyLabel = mins > 0 ? `${hrs}h ${mins}m / day` : `${hrs}h / day`;
    const weeklyMin = paidMin * workingDays.length;
    const wh = Math.floor(weeklyMin / 60);
    const wm = weeklyMin % 60;
    const weeklyLabel =
      workingDays.length === 0
        ? "No working days ticked."
        : `${workingDays.length} working days · ${wh}h${wm > 0 ? ` ${wm}m` : ""} / week`;
    return { dailyLabel, weeklyLabel, overnight };
  }, [startTime, endTime, breakMinutes, workingDays]);

  function toggleDay(val: string) {
    setWorkingDays((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
    );
  }

  function toggleId(list: number[], setList: (v: number[]) => void, id: number) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim() || !name.trim()) {
      setError("Shift Code and Shift Name are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/organization/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          start_time: startTime,
          end_time: endTime,
          break_minutes: Number(breakMinutes) || 0,
          grace_in_minutes: Number(graceInMinutes) || 0,
          grace_out_minutes: Number(graceOutMinutes) || 0,
          full_day_minutes: fullDayMinutes ? Number(fullDayMinutes) : 480,
          half_day_minutes: halfDayMinutes ? Number(halfDayMinutes) : 240,
          working_days: workingDays,
          applies_to: appliesTo,
          branch_ids: branchIds,
          department_ids: departmentIds,
          description,
          is_default: isDefault,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create shift.");
        setSubmitting(false);
        return;
      }
      router.push("/organization/shifts");
      router.refresh();
    } catch {
      setError("Network error while creating shift.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div>
            <h1>New Shift</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item">
                  <Link href="/organization/shifts">Shifts</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/organization/shifts" className="btn btn-erp-ghost">
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
              <i className="fa-solid fa-id-card"></i>
            </div>
            <div>
              <h2>Identity</h2>
              <p>How this shift is referenced on rosters and attendance sheets.</p>
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
                <div className="erp-field mb-md-0">
                  <label htmlFor="code" className="form-label">
                    Shift Code <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    className="form-control text-uppercase"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={20}
                    placeholder="GEN"
                    required
                  />
                  <span className="erp-help">Unique within the company.</span>
                </div>
              </div>

              <div className="col-md-8">
                <div className="erp-field mb-md-0">
                  <label htmlFor="name" className="form-label">
                    Shift Name <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={150}
                    placeholder="General Shift"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div>
              <h2>Timing</h2>
              <p>Clock-in and clock-out, the unpaid break, and how much lateness is tolerated.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="start_time" className="form-label">
                    Start <span className="erp-required">*</span>
                  </label>
                  <input
                    type="time"
                    id="start_time"
                    className="form-control"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="end_time" className="form-label">
                    End <span className="erp-required">*</span>
                  </label>
                  <input
                    type="time"
                    id="end_time"
                    className="form-control"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="break_minutes" className="form-label">
                    Break (min) <span className="erp-required">*</span>
                  </label>
                  <input
                    type="number"
                    id="break_minutes"
                    min={0}
                    max={720}
                    step={5}
                    className="form-control"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Number(e.target.value))}
                    required
                  />
                  <span className="erp-help">Unpaid, deducted from the span.</span>
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label className="form-label">Paid Hours</label>
                  <div
                    className="form-control d-flex align-items-center"
                    style={{ background: "#f7f9fc", fontWeight: 600 }}
                  >
                    <i
                      className="fa-solid fa-hourglass-half me-2"
                      style={{ color: "var(--erp-primary)" }}
                    ></i>
                    <span>{timingStats.dailyLabel}</span>
                  </div>
                  {timingStats.overnight && (
                    <span className="erp-help">
                      <i className="fa-solid fa-moon me-1"></i>Runs past midnight.
                    </span>
                  )}
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="grace_in_minutes" className="form-label">
                    Late-in Grace (min) <span className="erp-required">*</span>
                  </label>
                  <input
                    type="number"
                    id="grace_in_minutes"
                    min={0}
                    max={240}
                    className="form-control"
                    value={graceInMinutes}
                    onChange={(e) => setGraceInMinutes(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="grace_out_minutes" className="form-label">
                    Early-out Grace (min) <span className="erp-required">*</span>
                  </label>
                  <input
                    type="number"
                    id="grace_out_minutes"
                    min={0}
                    max={240}
                    className="form-control"
                    value={graceOutMinutes}
                    onChange={(e) => setGraceOutMinutes(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="full_day_minutes" className="form-label">
                    Full Day After (min)
                  </label>
                  <input
                    type="number"
                    id="full_day_minutes"
                    min={1}
                    max={1440}
                    step={5}
                    className="form-control"
                    value={fullDayMinutes}
                    onChange={(e) => setFullDayMinutes(e.target.value)}
                    placeholder="Optional"
                  />
                  <span className="erp-help">Clocked minutes earning a full day.</span>
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field mb-md-0">
                  <label htmlFor="half_day_minutes" className="form-label">
                    Half Day After (min)
                  </label>
                  <input
                    type="number"
                    id="half_day_minutes"
                    min={1}
                    max={1440}
                    step={5}
                    className="form-control"
                    value={halfDayMinutes}
                    onChange={(e) => setHalfDayMinutes(e.target.value)}
                    placeholder="Optional"
                  />
                  <span className="erp-help">Must not exceed the full-day figure.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-calendar-week"></i>
            </div>
            <div>
              <h2>Working Days</h2>
              <p>Days this shift is rostered. Everything unticked counts as a weekly off.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-field mb-0">
              <div className="erp-daypicker" role="group" aria-label="Working days">
                {SHIFT_DAYS.map((d) => (
                  <label
                    key={d.value}
                    className={`erp-day${d.weekend ? " is-weekend" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={workingDays.includes(d.value)}
                      onChange={() => toggleDay(d.value)}
                    />
                    <span>
                      <strong>{d.label}</strong>
                      <small>{d.tag}</small>
                    </span>
                  </label>
                ))}
              </div>
              <span className="erp-help">{timingStats.weeklyLabel}</span>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-users-viewfinder"></i>
            </div>
            <div>
              <h2>Who It Covers</h2>
              <p>Roster the whole company on this shift, or limit it to certain branches or departments.</p>
            </div>
          </div>
          <div className="erp-card-body">
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
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-toggle-on"></i>
            </div>
            <div>
              <h2>Status</h2>
              <p>Availability and which shift new employees fall onto.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-field">
              <label htmlFor="description" className="form-label">
                Notes
              </label>
              <textarea
                id="description"
                rows={2}
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                placeholder="Anything the roster or payroll team should know."
              />
            </div>

            <div className="erp-switch-row">
              <div>
                <h6>Default shift</h6>
                <p>New employees are placed on this shift, and the calendar reads its weekly offs.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="is_default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
              </div>
            </div>

            <div className="erp-switch-row">
              <div>
                <h6>Active</h6>
                <p>Available for rostering and assignment.</p>
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
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Fields marked <span className="erp-required">*</span> are required.
          </span>
          <div className="erp-form-bar-actions">
            <Link href="/organization/shifts" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {submitting ? "Creating…" : "Create Shift"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
