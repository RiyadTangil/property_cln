"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CrmSubmenu } from "./CrmSubmenu";

export interface SiteVisitCostItem {
  id?: string | number;
  category: string;
  description: string;
  incurred_on: string;
  amount: string;
}

export interface CrmSiteVisitRow {
  id: number;
  companyId?: number;
  title: string;
  customerId: number | null;
  projectId: number | null;
  purpose: string;
  priority: string;
  description: string | null;
  scheduledDate: string;
  scheduledTime: string | null;
  durationMinutes: number;
  branchId: number | null;
  assignedTo: string | null;
  meetingPoint: string | null;
  location: string | null;
  estimatedCost: number;
  costsJson: string;
  status: string;
  progress: number;
  outcome: string | null;
  createdAt?: string | Date;
}

export interface CustomerRef {
  id: number;
  code: string;
  firstName: string | null;
  lastName: string | null;
  organisationName: string | null;
}

export interface ProjectRef {
  id: number;
  code: string;
  name: string;
}

export interface RefBranch {
  id: number;
  code?: string;
  name: string;
}

export interface RefUser {
  id: number;
  name: string;
  email?: string;
}

const VISIT_STATUSES = [
  { value: "scheduled", label: "Scheduled", pill: "is-booked" },
  { value: "in_progress", label: "In Progress", pill: "is-hold" },
  { value: "completed", label: "Completed", pill: "is-available" },
  { value: "cancelled", label: "Cancelled", pill: "is-neutral" },
  { value: "no_show", label: "No Show", pill: "is-overdue" },
];

const VISIT_PURPOSES = [
  { value: "site_inspection", label: "Site Inspection" },
  { value: "client_meeting", label: "Client Meeting" },
  { value: "handover", label: "Handover" },
  { value: "survey", label: "Survey" },
  { value: "measurement", label: "Measurement" },
  { value: "documentation", label: "Documentation" },
  { value: "other", label: "Other" },
];

const COST_CATEGORIES = [
  { value: "transport", label: "Transport" },
  { value: "fuel", label: "Fuel" },
  { value: "food", label: "Food & Refreshments" },
  { value: "accommodation", label: "Accommodation" },
  { value: "labour", label: "Labour" },
  { value: "equipment", label: "Equipment / Tools" },
  { value: "permit", label: "Permit / Fees" },
  { value: "other", label: "Other" },
];

const PRIORITY_META: Record<string, { label: string; pill: string }> = {
  low: { label: "Low", pill: "is-neutral" },
  normal: { label: "Medium", pill: "is-booked" },
  medium: { label: "Medium", pill: "is-booked" },
  high: { label: "High", pill: "is-hold" },
  urgent: { label: "Urgent", pill: "is-overdue" },
};

function customerDisplayName(c: CustomerRef): string {
  const full = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
  return full || c.organisationName || c.code;
}

function formatShortDate(d: string | Date | undefined | null): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function parseCosts(costsJson: string | undefined | null): SiteVisitCostItem[] {
  if (!costsJson) return [];
  try {
    const parsed = JSON.parse(costsJson);
    if (Array.isArray(parsed)) return parsed as SiteVisitCostItem[];
  } catch {
    // ignore
  }
  return [];
}

export function CrmSiteVisitsList({
  initialItems,
  customers = [],
  projects = [],
  users = [],
}: {
  initialItems: CrmSiteVisitRow[];
  customers?: CustomerRef[];
  projects?: ProjectRef[];
  users?: RefUser[];
  branches?: RefBranch[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<CrmSiteVisitRow[]>(initialItems);
  const [dueFilter, setDueFilter] = useState<"" | "overdue" | "today" | "upcoming">("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CrmSiteVisitRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, customerDisplayName(c)])), [customers]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const countOverdue = items.filter(
    (v) => (v.status === "scheduled" || v.status === "in_progress") && v.scheduledDate < today
  ).length;
  const countToday = items.filter(
    (v) => (v.status === "scheduled" || v.status === "in_progress") && v.scheduledDate === today
  ).length;
  const countUpcoming = items.filter(
    (v) => (v.status === "scheduled" || v.status === "in_progress") && v.scheduledDate > today
  ).length;

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const isOpen = item.status === "scheduled" || item.status === "in_progress";
      if (dueFilter === "overdue" && !(isOpen && item.scheduledDate < today)) return false;
      if (dueFilter === "today" && !(isOpen && item.scheduledDate === today)) return false;
      if (dueFilter === "upcoming" && !(isOpen && item.scheduledDate > today)) return false;

      const q = search.trim().toLowerCase();
      if (q) {
        const ref = `SV-${String(item.id).padStart(4, "0")}`;
        const hay = `${item.title} ${ref} ${item.location ?? ""} ${item.meetingPoint ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter && item.status !== statusFilter) return false;
      if (purposeFilter && item.purpose !== purposeFilter) return false;
      if (assignedFilter) {
        const matchedUser = users.find((u) => String(u.id) === assignedFilter);
        const matchesUser =
          item.assignedTo === assignedFilter || (matchedUser && item.assignedTo === matchedUser.name);
        if (!matchesUser) return false;
      }
      return true;
    });
  }, [items, dueFilter, search, statusFilter, purposeFilter, assignedFilter, users, today]);

  function handleExportCsv(e: React.MouseEvent) {
    e.preventDefault();
    const headers = ["Reference", "Title", "Purpose", "Scheduled Date", "Scheduled Time", "Assigned To", "Status", "Progress", "Estimated Cost"];
    const rows = filtered.map((v) => [
      `SV-${String(v.id).padStart(4, "0")}`,
      v.title,
      v.purpose,
      v.scheduledDate,
      v.scheduledTime || "",
      v.assignedTo || "",
      v.status,
      `${v.progress}%`,
      String(v.estimatedCost ?? 0),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crm-site-visits.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/site-visits/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container ">
      <CrmSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-location-dot"></i>
          </div>
          <div>
            <h1>Site Visits</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Site Visits
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <button type="button" className="btn btn-erp-ghost" onClick={handleExportCsv}>
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </button>
          <Link href="/crm/site-visits/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>Schedule Visit
          </Link>
        </div>
      </div>

      <div className="erp-statrow">
        <a
          href="/crm/site-visits?due=overdue"
          className={`erp-stat ${dueFilter === "overdue" ? "is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setDueFilter((p) => (p === "overdue" ? "" : "overdue"));
          }}
        >
          <span className="erp-stat-icon">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </span>
          <span className="erp-stat-body">
            <strong>{countOverdue}</strong>
            <small>Overdue</small>
          </span>
        </a>
        <a
          href="/crm/site-visits?due=today"
          className={`erp-stat ${dueFilter === "today" ? "is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setDueFilter((p) => (p === "today" ? "" : "today"));
          }}
        >
          <span className="erp-stat-icon">
            <i className="fa-solid fa-calendar-day"></i>
          </span>
          <span className="erp-stat-body">
            <strong>{countToday}</strong>
            <small>Today</small>
          </span>
        </a>
        <a
          href="/crm/site-visits?due=upcoming"
          className={`erp-stat ${dueFilter === "upcoming" ? "is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setDueFilter((p) => (p === "upcoming" ? "" : "upcoming"));
          }}
        >
          <span className="erp-stat-icon">
            <i className="fa-solid fa-calendar-plus"></i>
          </span>
          <span className="erp-stat-body">
            <strong>{countUpcoming}</strong>
            <small>Upcoming</small>
          </span>
        </a>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/crm/site-visits"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, reference, location…"
                aria-label="Search visits"
              />
            </div>

            <select
              name="status"
              className="form-select erp-select"
              aria-label="Status filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {VISIT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              name="purpose"
              className="form-select erp-select"
              aria-label="Type filter"
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {VISIT_PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <select
              name="assigned_to"
              className="form-select erp-select"
              aria-label="Responsible filter"
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
            >
              <option value="">All people</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name}
                </option>
              ))}
            </select>

            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {filtered.length} {filtered.length === 1 ? "visit" : "visits"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <h3>No site visits yet</h3>
            <p>Schedule a visit with a customer to a project or plot, track its progress and log what it cost.</p>
            <Link href="/crm/site-visits/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>Schedule Visit
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Visit</th>
                    <th>Customer / Project</th>
                    <th>Type</th>
                    <th>When</th>
                    <th>Assigned</th>
                    <th>Progress</th>
                    <th className="text-end">Cost</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => {
                    const stMeta = VISIT_STATUSES.find((s) => s.value === v.status) ?? VISIT_STATUSES[0];
                    const priMeta = PRIORITY_META[v.priority] ?? PRIORITY_META.medium;
                    const purposeLabel =
                      VISIT_PURPOSES.find((p) => p.value === v.purpose)?.label || v.purpose;
                    const customerName = v.customerId ? customerMap.get(v.customerId) : null;
                    const projectName = v.projectId ? projectMap.get(v.projectId) : null;
                    const costLines = parseCosts(v.costsJson);
                    const actualTotal = costLines.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
                    const displayCost = actualTotal > 0 ? actualTotal : v.estimatedCost;

                    return (
                      <tr key={v.id}>
                        <td>
                          <div className="erp-identity">
                            <span className="erp-initials">
                              <i className="fa-solid fa-location-dot"></i>
                            </span>
                            <span>
                              <span className="erp-identity-name">
                                {v.title}{" "}
                                <span className={`erp-pill ${priMeta.pill} ms-1`}>{priMeta.label}</span>
                              </span>
                              <span className="erp-identity-meta">
                                SV-{String(v.id).padStart(4, "0")}
                                {v.location ? ` · ${v.location}` : ""}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td>
                          {customerName ? (
                            <Link href={`/crm/customers/${v.customerId}`} className="erp-plain-link">
                              {customerName}
                            </Link>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                          {projectName && <div className="erp-identity-meta">{projectName}</div>}
                        </td>
                        <td>
                          <span className="erp-scope-tag">
                            <i className="fa-solid fa-location-dot"></i> {purposeLabel}
                          </span>
                        </td>
                        <td className="text-nowrap" style={{ fontSize: "12.5px" }}>
                          <span>{formatShortDate(v.scheduledDate)}</span>
                          <div className="erp-identity-meta">{v.scheduledTime || "All day"}</div>
                        </td>
                        <td>{v.assignedTo || "—"}</td>
                        <td>
                          <span className="erp-cell-strong">{v.progress}%</span>
                        </td>
                        <td className="text-end erp-cell-strong">
                          {displayCost > 0 ? displayCost.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                        </td>
                        <td>
                          <span className={`erp-pill ${stMeta.pill}`}>{stMeta.label}</span>
                        </td>
                        <td className="text-end text-nowrap">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(v)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div
        className={`modal fade ${deleteTarget ? "show" : ""}`}
        id="deleteRecordModal"
        tabIndex={-1}
        aria-hidden={!deleteTarget}
        style={deleteTarget ? { display: "block", backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ border: "none", borderRadius: "14px" }}>
            <div className="modal-body p-4">
              <div className="d-flex gap-3">
                <div className="erp-kpi-icon is-danger">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                    Delete site visit?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>{deleteTarget?.title}</strong> will be removed from active use. The record
                    is retained and can be restored by an administrator.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <form method="POST" data-delete-form onSubmit={handleDelete}>
                <input type="hidden" name="_method" value="DELETE" />
                <button
                  type="submit"
                  className="btn btn-erp"
                  disabled={deleting}
                  style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
                >
                  <i className="fa-solid fa-trash-can me-2"></i>Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CrmSiteVisitForm({
  customers = [],
  projects = [],
  users = [],
  branches = [],
}: {
  customers?: CustomerRef[];
  projects?: ProjectRef[];
  users?: RefUser[];
  branches?: RefBranch[];
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const defaultAssignee = users.find((u) => u.id === 1) ?? users[0];

  const [step, setStep] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [purpose, setPurpose] = useState("site_inspection");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");

  const [scheduledDate, setScheduledDate] = useState(today);
  const [scheduledTime, setScheduledTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [branchId, setBranchId] = useState("");
  const [assignedTo, setAssignedTo] = useState(defaultAssignee ? String(defaultAssignee.id) : "");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [location, setLocation] = useState("");

  const [estimatedCost, setEstimatedCost] = useState("");
  const [costs, setCosts] = useState<SiteVisitCostItem[]>([
    { id: "", category: "transport", description: "", incurred_on: "", amount: "" },
  ]);

  const [status, setStatus] = useState("scheduled");
  const [progress, setProgress] = useState(0);
  const [outcome, setOutcome] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalCost = costs.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  function addCostRow() {
    setCosts((prev) => [
      ...prev,
      { id: "", category: "transport", description: "", incurred_on: scheduledDate || today, amount: "" },
    ]);
  }

  function updateCostRow(index: number, patch: Partial<SiteVisitCostItem>) {
    setCosts((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeCostRow(index: number) {
    setCosts((prev) => prev.filter((_, i) => i !== index));
  }

  function handleNext() {
    setError("");
    if (step === 1 && !title.trim()) {
      setError("Purpose / Title is required.");
      return;
    }
    if (step === 2 && !scheduledDate) {
      setError("Date is required.");
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setStep(1);
      setError("Purpose / Title is required.");
      return;
    }
    if (!scheduledDate) {
      setStep(2);
      setError("Date is required.");
      return;
    }

    const assignedUser = users.find((u) => String(u.id) === assignedTo);
    const nonEmptyCosts = costs
      .filter((c) => c.description.trim() || c.amount.trim() || c.incurred_on)
      .map((c) => ({
        id: c.id || "",
        category: c.category,
        description: c.description.trim(),
        incurred_on: c.incurred_on,
        amount: Number(c.amount) || 0,
      }));

    setSubmitting(true);
    try {
      const res = await fetch("/api/crm/site-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          customer_id: customerId ? Number(customerId) : null,
          project_id: projectId ? Number(projectId) : null,
          purpose,
          priority,
          description: description.trim() || null,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime || null,
          duration_minutes: durationMinutes ? Number(durationMinutes) : 60,
          branch_id: branchId ? Number(branchId) : null,
          assigned_to: assignedUser ? assignedUser.name : assignedTo || null,
          meeting_point: meetingPoint.trim() || null,
          location: location.trim() || null,
          estimated_cost: estimatedCost ? Number(estimatedCost) : 0,
          costs: nonEmptyCosts,
          status,
          progress: Number(progress) || 0,
          outcome: outcome.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to schedule site visit.");
        return;
      }
      router.push("/crm/site-visits");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <CrmSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-location-dot"></i>
          </div>
          <div>
            <h1>Schedule Site Visit</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/site-visits">Site Visits</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/site-visits" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-3" role="alert" style={{ borderRadius: "9px", fontSize: "12.5px" }}>
          <i className="fa-solid fa-circle-exclamation me-2"></i>
          {error}
        </div>
      )}

      <form
        method="POST"
        action="/crm/site-visits"
        className="erp-form erp-wizard"
        data-site-visit-form
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="erp-card">
          <ol className="erp-wizard-steps" data-wizard-tabs>
            {[
              { num: 1, label: "Visit" },
              { num: 2, label: "Schedule" },
              { num: 3, label: "Costs" },
              { num: 4, label: "Progress" },
            ].map((tab) => {
              const cls = step === tab.num ? "is-active" : step > tab.num ? "is-done" : "";
              return (
                <li
                  key={tab.num}
                  className={cls}
                  data-step-tab={tab.num}
                  onClick={() => setStep(tab.num)}
                >
                  <span>{tab.num}</span> {tab.label}
                </li>
              );
            })}
          </ol>

          <div className="erp-wizard-panels">
            <fieldset data-step="1" hidden={step !== 1}>
              <div className="erp-section-head">
                <div className="erp-section-icon">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <h2>Visit</h2>
                  <p>Who and what the visit is for.</p>
                </div>
              </div>
              <div className="erp-card-body">
                <div className="erp-context-banner">
                  <span className="erp-context-banner-icon">
                    <i className="fa-solid fa-building-columns"></i>
                  </span>
                  <div className="erp-context-banner-body">
                    <strong>E-Hishabi ERP</strong>
                    <span>Filed under HQ &mdash; switch companies from the top bar to change this.</span>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12">
                    <div className="erp-field">
                      <label htmlFor="title" className="form-label">
                        Purpose / Title <span className="erp-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        className="form-control "
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={190}
                        required
                        placeholder="Site inspection at Gulshan plot"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="customer_id" className="form-label">
                        Customer
                      </label>
                      <select
                        id="customer_id"
                        name="customer_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Select a customer"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                      >
                        <option value=""></option>
                        {customers.map((c) => (
                          <option key={c.id} value={String(c.id)} data-meta={c.code}>
                            {customerDisplayName(c)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="project_id" className="form-label">
                        Project
                      </label>
                      <select
                        id="project_id"
                        name="project_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Select a project"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                      >
                        <option value=""></option>
                        {projects.map((p) => (
                          <option key={p.id} value={String(p.id)} data-meta={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <span className="erp-help">Link the visit to a customer, a project, or both.</span>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="purpose" className="form-label">
                        Visit Type <span className="erp-required">*</span>
                      </label>
                      <select
                        id="purpose"
                        name="purpose"
                        className="form-select "
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        required
                      >
                        {VISIT_PURPOSES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="priority" className="form-label">
                        Priority <span className="erp-required">*</span>
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        className="form-select "
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        required
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="erp-field mb-0">
                      <label htmlFor="description" className="form-label">
                        Description / Notes
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        className="form-control "
                        maxLength={5000}
                        placeholder="What to check, who to meet, what to bring…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset data-step="2" hidden={step !== 2}>
              <div className="erp-section-head">
                <div className="erp-section-icon">
                  <i className="fa-solid fa-calendar-day"></i>
                </div>
                <div>
                  <h2>Schedule &amp; Assignment</h2>
                  <p>When it happens and who is responsible.</p>
                </div>
              </div>
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="scheduled_date" className="form-label">
                        Date <span className="erp-required">*</span>
                      </label>
                      <input
                        type="date"
                        id="scheduled_date"
                        name="scheduled_date"
                        className="form-control "
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="scheduled_time" className="form-label">
                        Time
                      </label>
                      <input
                        type="time"
                        id="scheduled_time"
                        name="scheduled_time"
                        className="form-control "
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="duration_minutes" className="form-label">
                        Duration (min)
                      </label>
                      <input
                        type="number"
                        id="duration_minutes"
                        name="duration_minutes"
                        min={5}
                        max={1440}
                        step={5}
                        className="form-control "
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="branch_id" className="form-label">
                        Branch
                      </label>
                      <select
                        id="branch_id"
                        name="branch_id"
                        className="form-select"
                        data-select2
                        data-placeholder="—"
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                      >
                        <option value=""></option>
                        {branches.map((b) => (
                          <option key={b.id} value={String(b.id)}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="assigned_to" className="form-label">
                        Responsible Person
                      </label>
                      <select
                        id="assigned_to"
                        name="assigned_to"
                        className="form-select"
                        data-select2
                        data-placeholder="Unassigned"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                      >
                        <option value=""></option>
                        {users.map((u) => (
                          <option key={u.id} value={String(u.id)}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="meeting_point" className="form-label">
                        Meeting Point
                      </label>
                      <input
                        type="text"
                        id="meeting_point"
                        name="meeting_point"
                        className="form-control"
                        value={meetingPoint}
                        onChange={(e) => setMeetingPoint(e.target.value)}
                        maxLength={190}
                        placeholder="Site gate / sales office"
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="erp-field mb-0">
                      <label htmlFor="location" className="form-label">
                        Site Location / Address
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        className="form-control"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        maxLength={255}
                        placeholder="Plot 12, Road 7, Gulshan-1, Dhaka"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset data-step="3" hidden={step !== 3}>
              <div className="erp-section-head">
                <div className="erp-section-icon">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                <div>
                  <h2>Costs</h2>
                  <p>What the visit costs — transport, fuel, fees. Add a line per item.</p>
                </div>
              </div>
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="estimated_cost" className="form-label">
                        Estimated Budget
                      </label>
                      <input
                        type="number"
                        id="estimated_cost"
                        name="estimated_cost"
                        min={0}
                        step="0.01"
                        className="form-control "
                        value={estimatedCost}
                        onChange={(e) => setEstimatedCost(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="erp-fieldset-label">Actual cost lines</div>
                <div className="erp-table-wrap">
                  <table className="table erp-table erp-lines" data-cost-lines>
                    <thead>
                      <tr>
                        <th style={{ width: "22%" }}>Category</th>
                        <th>Description</th>
                        <th style={{ width: "16%" }}>Date</th>
                        <th style={{ width: "16%" }} className="text-end">
                          Amount
                        </th>
                        <th style={{ width: "44px" }}></th>
                      </tr>
                    </thead>
                    <tbody data-cost-body>
                      {costs.map((row, idx) => (
                        <tr key={idx} data-cost-row>
                          <td>
                            <input type="hidden" name={`costs[${idx}][id]`} value={String(row.id ?? "")} />
                            <select
                              name={`costs[${idx}][category]`}
                              className="form-select form-select-sm"
                              value={row.category}
                              onChange={(e) => updateCostRow(idx, { category: e.target.value })}
                            >
                              {COST_CATEGORIES.map((cc) => (
                                <option key={cc.value} value={cc.value}>
                                  {cc.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              name={`costs[${idx}][description]`}
                              className="form-control form-control-sm"
                              maxLength={190}
                              value={row.description}
                              onChange={(e) => updateCostRow(idx, { description: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              name={`costs[${idx}][incurred_on]`}
                              className="form-control form-control-sm"
                              value={row.incurred_on}
                              onChange={(e) => updateCostRow(idx, { incurred_on: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name={`costs[${idx}][amount]`}
                              min={0}
                              step="0.01"
                              className="form-control form-control-sm text-end"
                              data-cost-amount
                              value={row.amount}
                              onChange={(e) => updateCostRow(idx, { amount: e.target.value })}
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-danger"
                              data-cost-remove
                              onClick={() => removeCostRow(idx)}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2}>
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm"
                            data-cost-add
                            onClick={addCostRow}
                          >
                            <i className="fa-solid fa-plus me-1"></i>Add line
                          </button>
                        </td>
                        <td className="text-end erp-cell-strong">Total</td>
                        <td className="text-end erp-cell-strong" data-cost-total>
                          {totalCost.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </fieldset>

            <fieldset data-step="4" hidden={step !== 4}>
              <div className="erp-section-head">
                <div className="erp-section-icon">
                  <i className="fa-solid fa-bars-progress"></i>
                </div>
                <div>
                  <h2>Progress &amp; Outcome</h2>
                  <p>Where the visit stands and what came of it.</p>
                </div>
              </div>
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="status" className="form-label">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="form-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        {VISIT_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-8">
                    <div className="erp-field">
                      <label htmlFor="progress" className="form-label">
                        Progress — <span data-progress-out>{progress}</span>%
                      </label>
                      <input
                        type="range"
                        id="progress"
                        name="progress"
                        min={0}
                        max={100}
                        step={5}
                        className="form-range"
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        data-progress-range
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="erp-field mb-0">
                      <label htmlFor="outcome" className="form-label">
                        Outcome / Summary
                      </label>
                      <textarea
                        id="outcome"
                        name="outcome"
                        rows={3}
                        className="form-control "
                        maxLength={5000}
                        placeholder="What happened, decisions made, next steps…"
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          <div className="erp-wizard-nav erp-card-foot">
            <Link href="/crm/site-visits" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <div className="ms-auto d-flex gap-2">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-step-prev
                hidden={step === 1}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
              >
                <i className="fa-solid fa-arrow-left me-1"></i>Back
              </button>
              <button
                type="button"
                className="btn btn-erp"
                data-step-next
                hidden={step === 4}
                onClick={handleNext}
              >
                Next<i className="fa-solid fa-arrow-right ms-1"></i>
              </button>
              <button
                type="submit"
                className="btn btn-erp"
                data-step-save
                data-submit-button
                hidden={step !== 4}
                disabled={submitting}
              >
                <i className="fa-solid fa-floppy-disk me-2"></i>Schedule Visit
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
