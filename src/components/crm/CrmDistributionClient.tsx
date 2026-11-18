"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

export interface LeadDistributionRow {
  id: number;
  name: string;
  branchId: number | null;
  projectId: number | null;
  period: string;
  validFrom: string;
  validUntil: string | null;
  dailyLimit: number;
  minPendingLeads: number;
  status: string;
  createdAt?: string | Date;
}

export interface AssignmentRuleCondition {
  field: string;
  operator: string;
  value: string;
}

export interface AssignmentRuleRow {
  id: number;
  name: string;
  priority: number;
  strategy: string;
  departmentId: number | null;
  targetUserId: number | null;
  conditionsJson: string;
  isActive: boolean;
  createdAt?: string | Date;
}

export interface RefItem {
  id: number;
  name: string;
  code?: string;
}

const CONDITION_FIELDS = [
  { value: "source", label: "Source" },
  { value: "priority", label: "Priority" },
  { value: "branch_id", label: "Branch" },
  { value: "city", label: "City" },
  { value: "country", label: "Country" },
  { value: "expected_value", label: "Expected value" },
  { value: "score", label: "Score" },
  { value: "interest", label: "Interest" },
  { value: "organisation_name", label: "Organisation" },
  { value: "email", label: "Email" },
];

const CONDITION_OPERATORS = [
  { value: "equals", label: "is" },
  { value: "not_equals", label: "is not" },
  { value: "in", label: "is one of (comma separated)" },
  { value: "contains", label: "contains" },
  { value: "gt", label: "greater than" },
  { value: "lt", label: "less than" },
  { value: "filled", label: "is filled" },
  { value: "empty", label: "is empty" },
];

export function CrmLeadDistributionList({
  initialItems,
  branches = [],
  projects = [],
}: {
  initialItems: LeadDistributionRow[];
  branches?: RefItem[];
  projects?: RefItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<LeadDistributionRow[]>(initialItems);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<LeadDistributionRow | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (q && !item.name.toLowerCase().includes(q)) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return true;
  });

  const countScheduled = items.filter((r) => r.status === "scheduled").length;
  const countActive = items.filter((r) => r.status === "active").length;
  const countExpired = items.filter((r) => r.status === "expired").length;
  const countRenewed = items.filter((r) => r.status === "renewed").length;
  const countDeactivated = items.filter((r) => r.status === "ended" || r.status === "deactivated").length;

  async function handleDeactivate(e: React.FormEvent) {
    e.preventDefault();
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      const res = await fetch(`/api/crm/lead-distribution/${deactivateTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((r) => r.id !== deactivateTarget.id));
        setDeactivateTarget(null);
        router.refresh();
      }
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <h1>Auto-distribution</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/leads">Leads</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Auto-distribution
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/assignment-rules" className="btn btn-erp-ghost">
            <i className="fa-solid fa-wand-magic-sparkles me-2"></i>Assignment Rules
          </Link>
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() => downloadCsv("lead-distribution.csv", ["Name", "Period", "Valid From", "Daily Limit", "Status"], filtered.map((r) => [r.name, r.period, r.validFrom, r.dailyLimit, r.status]))}
          >
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </button>
          <Link href="/crm/lead-distribution/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Configuration
          </Link>
        </div>
      </div>

      <div className="erp-statrow">
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-circle text-muted"></i>
          </span>
          <span className="erp-stat-body">
            <strong>{countScheduled}</strong>
            <small>Scheduled</small>
          </span>
        </div>
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-circle text-success"></i>
          </span>
          <span className="erp-stat-body">
            <strong>{countActive}</strong>
            <small>Active</small>
          </span>
        </div>
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-circle text-muted"></i>
          </span>
          <span className="erp-stat-body">
            <strong>{countExpired}</strong>
            <small>Expired</small>
          </span>
        </div>
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-circle text-muted"></i>
          </span>
          <span className="erp-stat-body">
            <strong>{countRenewed}</strong>
            <small>Renewed</small>
          </span>
        </div>
        <div className="erp-stat">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-circle text-muted"></i>
          </span>
          <span className="erp-stat-body">
            <strong>{countDeactivated}</strong>
            <small>Deactivated</small>
          </span>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/crm/lead-distribution"
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
                placeholder="Search name…"
                aria-label="Search configurations"
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
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
              <option value="ended">Ended</option>
            </select>

            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {filtered.length} {filtered.length === 1 ? "configuration" : "configurations"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <h3>No auto-distribution yet</h3>
            <p>Set team and member shares once, and every day the unassigned leads are shared out automatically.</p>
            <Link href="/crm/lead-distribution/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>Create Configuration
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Configuration</th>
                    <th>Scope</th>
                    <th>Period</th>
                    <th className="text-end">Daily limit</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const branchName = branches.find((b) => b.id === item.branchId)?.name || "All branches";
                    const projectName = projects.find((p) => p.id === item.projectId)?.name || "Any project";
                    return (
                      <tr key={item.id}>
                        <td className="erp-cell-strong">{item.name}</td>
                        <td>
                          {branchName} · {projectName}
                        </td>
                        <td>
                          {item.validFrom} {item.validUntil ? `→ ${item.validUntil}` : `(${item.period})`}
                        </td>
                        <td className="text-end">{item.dailyLimit || "No limit"}</td>
                        <td>
                          <span className={`erp-pill ${item.status === "active" ? "is-available" : "is-neutral"}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            onClick={() => setDeactivateTarget(item)}
                          >
                            <i className="fa-solid fa-power-off"></i>
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
        className={`modal fade ${deactivateTarget ? "show" : ""}`}
        id="deactivateConfigModal"
        tabIndex={-1}
        aria-hidden={!deactivateTarget}
        style={deactivateTarget ? { display: "block", backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            action="#"
            className="modal-content"
            style={{ border: "none", borderRadius: "14px" }}
            data-deactivate-form
            onSubmit={handleDeactivate}
          >
            <div className="modal-body p-4">
              <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                Deactivate configuration
              </h5>
              <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
                <strong data-deactivate-name>{deactivateTarget?.name}</strong> stops distributing leads from now on. It
                stays in the list as history and cannot be reactivated — create or renew another to start again.
              </p>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setDeactivateTarget(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-danger" data-loading-text="Deactivating…" disabled={deactivating}>
                <i className="fa-solid fa-power-off me-2"></i>Deactivate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function CrmLeadDistributionForm({
  branches = [],
  projects = [],
}: {
  branches?: RefItem[];
  projects?: RefItem[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [period, setPeriod] = useState("3m");
  const [validFrom, setValidFrom] = useState("2026-11-18");
  const [validUntil, setValidUntil] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [minPendingLeads, setMinPendingLeads] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        branch_id: branchId ? Number(branchId) : null,
        project_id: projectId ? Number(projectId) : null,
        period,
        valid_from: validFrom,
        valid_until: validUntil || null,
        daily_limit: dailyLimit ? Number(dailyLimit) : 20,
        min_pending_leads: minPendingLeads ? Number(minPendingLeads) : 5,
      };
      const res = await fetch("/api/crm/lead-distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/crm/lead-distribution");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <h1>New Auto-distribution</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/lead-distribution">Auto-distribution</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/lead-distribution" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      <form
        method="POST"
        action="/crm/lead-distribution"
        className="erp-form"
        data-auto-dist-form
        data-validate="off"
        noValidate
        data-payload='{"teams":[],"saved":{"teams":[],"members":[]},"optionsUrl":"/crm/leads/distribute/options"}'
        onSubmit={handleSubmit}
      >
        <div
          className="alert alert-danger py-2 px-3"
          role="alert"
          style={{ borderRadius: "9px", fontSize: "12.5px" }}
          data-auto-dist-error
          hidden
        ></div>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <h2>What and when</h2>
              <p>
                Every day while this is in force, the matching unassigned leads are shared out by the percentages below.
              </p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="name" className="form-label">
                    Name <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    maxLength={120}
                    required
                    className="form-control "
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Daily sales distribution"
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
                    data-auto-dist-branch
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    <option value="">All branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="project_id" className="form-label">
                    Interested in project
                  </label>
                  <select
                    id="project_id"
                    name="project_id"
                    className="form-select"
                    data-select2
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">Any project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="period" className="form-label">
                    Period <span className="erp-required">*</span>
                  </label>
                  <select
                    id="period"
                    name="period"
                    className="form-select"
                    data-select2
                    data-auto-dist-period
                    required
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    <option value="30d">30 days</option>
                    <option value="3m">3 months</option>
                    <option value="6m">6 months</option>
                    <option value="1y">1 year</option>
                    <option value="custom">Custom end date</option>
                  </select>
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="valid_from" className="form-label">
                    Valid from <span className="erp-required">*</span>
                  </label>
                  <input
                    type="date"
                    id="valid_from"
                    name="valid_from"
                    required
                    className="form-control "
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-3" data-auto-dist-until>
                <div className="erp-field">
                  <label htmlFor="valid_until" className="form-label">
                    Valid until <span className="erp-required">*</span>
                  </label>
                  <input
                    type="date"
                    id="valid_until"
                    name="valid_until"
                    className="form-control "
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="daily_limit" className="form-label">
                    Daily limit
                  </label>
                  <input
                    type="number"
                    id="daily_limit"
                    name="daily_limit"
                    min={1}
                    max={10000}
                    className="form-control "
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    placeholder="No limit"
                  />
                  <span className="erp-help">Most leads handed out per run, oldest first.</span>
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="min_pending_leads" className="form-label">
                    Run only above
                  </label>
                  <input
                    type="number"
                    id="min_pending_leads"
                    name="min_pending_leads"
                    min={0}
                    max={100000}
                    className="form-control "
                    value={minPendingLeads}
                    onChange={(e) => setMinPendingLeads(e.target.value)}
                    placeholder="Always run"
                  />
                  <span className="erp-help">Skip the day while this many or fewer leads wait.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-people-group"></i>
            </div>
            <div>
              <h2>Shares</h2>
              <p>
                Split between teams (departments), then inside each team between its people. Each must add up to 100%.
                Anyone who later leaves the team is skipped and their share spread over the rest of it.
              </p>
            </div>
            <div className="ms-auto" style={{ fontSize: "12.5px" }}>
              Teams total <span className="erp-pill is-neutral" data-auto-dist-team-sum>0%</span>
            </div>
          </div>
          <div className="erp-card-body">
            <div data-auto-dist-teams></div>
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Configurations are never edited — renew one to change it.
          </span>
          <div className="erp-form-bar-actions">
            <Link href="/crm/lead-distribution" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" data-submit-button disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>Create
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function CrmAssignmentRulesList({
  initialItems,
  departments = [],
  users = [],
}: {
  initialItems: AssignmentRuleRow[];
  departments?: RefItem[];
  users?: RefItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<AssignmentRuleRow[]>(initialItems);
  const [search, setSearch] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AssignmentRuleRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (q && !item.name.toLowerCase().includes(q)) return false;
    if (strategyFilter && item.strategy !== strategyFilter) return false;
    if (statusFilter === "active" && !item.isActive) return false;
    if (statusFilter === "inactive" && item.isActive) return false;
    return true;
  });

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/assignment-rules/${deleteTarget.id}`, { method: "DELETE" });
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
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h1>Assignment Rules</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/leads">Leads</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Assignment Rules
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/lead-distribution" className="btn btn-erp-ghost">
            <i className="fa-solid fa-clock-rotate-left me-2"></i>Auto-distribution
          </Link>
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() => downloadCsv("assignment-rules.csv", ["Name", "Priority", "Strategy", "Active"], filtered.map((r) => [r.name, r.priority, r.strategy, r.isActive]))}
          >
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </button>
          <Link data-modal-form data-modal-size="lg" href="/crm/assignment-rules/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Rule
          </Link>
        </div>
      </div>

      <div
        className="alert alert-info d-flex gap-2 align-items-start"
        style={{ borderRadius: "9px", fontSize: "12.5px" }}
      >
        <i className="fa-solid fa-circle-info mt-1"></i>
        <div>
          When a lead is captured <strong>without an owner</strong> (form, bulk add or import), the active rules below
          are tried in priority order and the first whose conditions all match picks the owner. If none match, the lead
          waits in the unassigned pool for manual or scheduled distribution.
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/crm/assignment-rules"
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
                placeholder="Search name…"
                aria-label="Search rules"
              />
            </div>

            <select
              name="strategy"
              className="form-select erp-select"
              aria-label="Strategy filter"
              value={strategyFilter}
              onChange={(e) => setStrategyFilter(e.target.value)}
            >
              <option value="">All strategies</option>
              <option value="round_robin">Round robin</option>
              <option value="least_loaded">Least loaded</option>
              <option value="specific_user">Specific person</option>
            </select>

            <select
              name="status"
              className="form-select erp-select"
              aria-label="Status filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>

            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {filtered.length} {filtered.length === 1 ? "rule" : "rules"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <h3>No assignment rules yet</h3>
            <p>
              e.g. &quot;Facebook leads → Digital Sales, round robin&quot; or a catch-all &quot;Everything else → least
              loaded&quot;.
            </p>
            <Link data-modal-form data-modal-size="lg" href="/crm/assignment-rules/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>Create Rule
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th className="text-end">Priority</th>
                    <th>Rule</th>
                    <th>Strategy</th>
                    <th>Target</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const deptName = departments.find((d) => d.id === item.departmentId)?.name;
                    const userName = users.find((u) => u.id === item.targetUserId)?.name;
                    const targetLabel =
                      item.strategy === "specific_user" ? userName || "Specific person" : deptName || "All teams";
                    return (
                      <tr key={item.id}>
                        <td className="text-end erp-cell-strong">{item.priority}</td>
                        <td className="erp-cell-strong">{item.name}</td>
                        <td>{item.strategy.replace("_", " ")}</td>
                        <td>{targetLabel}</td>
                        <td>
                          <span className={`erp-pill ${item.isActive ? "is-available" : "is-neutral"}`}>
                            {item.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(item)}
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
                    Delete assignment rule?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>{deleteTarget?.name}</strong> will be removed from active use. The record
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

export function CrmAssignmentRuleForm({
  departments = [],
  users = [],
  branches = [],
}: {
  departments?: RefItem[];
  users?: RefItem[];
  branches?: RefItem[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [priority, setPriority] = useState("100");
  const [strategy, setStrategy] = useState("round_robin");
  const [departmentId, setDepartmentId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [conditions, setConditions] = useState<AssignmentRuleCondition[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  function addCondition() {
    if (conditions.length >= 10) return;
    setConditions((prev) => [...prev, { field: "source", operator: "equals", value: "" }]);
  }

  function updateCondition(idx: number, patch: Partial<AssignmentRuleCondition>) {
    setConditions((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function removeCondition(idx: number) {
    setConditions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        priority: Number(priority) || 100,
        strategy,
        department_id: departmentId ? Number(departmentId) : null,
        target_user_id: targetUserId ? Number(targetUserId) : null,
        conditions,
        is_active: isActive,
      };
      const res = await fetch("/api/crm/assignment-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/crm/assignment-rules");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h1>New Assignment Rule</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/assignment-rules">Assignment Rules</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/assignment-rules" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      <form
        method="POST"
        action="/crm/assignment-rules"
        className="erp-form"
        data-assignment-rule-form
        noValidate
        onSubmit={handleSubmit}
      >
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <div>
              <h2>Assignment Rule</h2>
              <p>
                Applied when a lead is captured without an owner. Rules are tried lowest priority number first; the
                first match wins.
              </p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-8">
                <div className="erp-field">
                  <label htmlFor="name" className="form-label">
                    Name <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    maxLength={150}
                    required
                    className="form-control "
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Facebook leads → Digital sales team"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="priority" className="form-label">
                    Priority <span className="erp-required">*</span>
                  </label>
                  <input
                    type="number"
                    id="priority"
                    name="priority"
                    min={0}
                    max={9999}
                    step={1}
                    required
                    className="form-control "
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  <span className="erp-help">Lower runs first. Keep a catch-all at the end.</span>
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="strategy" className="form-label">
                    Strategy <span className="erp-required">*</span>
                  </label>
                  <select
                    id="strategy"
                    name="strategy"
                    className="form-select"
                    data-select2
                    data-rule-strategy
                    required
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                  >
                    <option value="round_robin">Round robin</option>
                    <option value="least_loaded">Least loaded</option>
                    <option value="specific_user">Specific person</option>
                  </select>
                </div>
              </div>

              <div className="col-md-8" data-rule-team>
                <div className="erp-field">
                  <label htmlFor="department_id" className="form-label">
                    Team (department) <span className="erp-required">*</span>
                  </label>
                  <select
                    id="department_id"
                    name="department_id"
                    className="form-select"
                    data-select2
                    data-placeholder="Choose a team"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                  >
                    <option value=""></option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <span className="erp-help">
                    Active people linked to an employee in this department share the leads.
                  </span>
                </div>
              </div>

              <div className="col-md-8" data-rule-person>
                <div className="erp-field">
                  <label htmlFor="target_user_id" className="form-label">
                    Person <span className="erp-required">*</span>
                  </label>
                  <select
                    id="target_user_id"
                    name="target_user_id"
                    className="form-select"
                    data-select2
                    data-placeholder="Choose a person"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                  >
                    <option value=""></option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <label className="form-label mt-1">
              When the lead matches <span className="text-muted fw-normal">(all conditions; none = every lead)</span>
            </label>
            <div className="erp-table-wrap mb-2">
              <table className="table erp-table align-middle mb-0">
                <tbody data-rule-conditions data-max="10">
                  {conditions.map((cond, idx) => (
                    <tr key={idx} data-rule-condition>
                      <td style={{ width: "32%" }}>
                        <select
                          name={`conditions[${idx}][field]`}
                          className="form-select form-select-sm"
                          aria-label="Field"
                          data-rule-field
                          value={cond.field}
                          onChange={(e) => updateCondition(idx, { field: e.target.value })}
                        >
                          {CONDITION_FIELDS.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ width: "28%" }}>
                        <select
                          name={`conditions[${idx}][operator]`}
                          className="form-select form-select-sm"
                          aria-label="Operator"
                          data-rule-operator
                          value={cond.operator}
                          onChange={(e) => updateCondition(idx, { operator: e.target.value })}
                        >
                          {CONDITION_OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          name={`conditions[${idx}][value]`}
                          className="form-control form-control-sm"
                          maxLength={190}
                          value={cond.value}
                          onChange={(e) => updateCondition(idx, { value: e.target.value })}
                          placeholder="Value (e.g. facebook, dhaka)"
                          aria-label="Value"
                          data-rule-value
                        />
                      </td>
                      <td style={{ width: "36px" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-erp-ghost text-danger"
                          data-rule-remove-condition
                          title="Remove"
                          onClick={() => removeCondition(idx)}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Hidden prototype row preserving exact conditions[__i__] contract */}
                  <tr data-rule-condition data-rule-condition-tpl hidden>
                    <td style={{ width: "32%" }}>
                      <select
                        name="conditions[__i__][field]"
                        className="form-select form-select-sm"
                        aria-label="Field"
                        data-rule-field
                        defaultValue="source"
                      >
                        {CONDITION_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ width: "28%" }}>
                      <select
                        name="conditions[__i__][operator]"
                        className="form-select form-select-sm"
                        aria-label="Operator"
                        data-rule-operator
                        defaultValue="equals"
                      >
                        {CONDITION_OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        name="conditions[__i__][value]"
                        className="form-control form-control-sm"
                        maxLength={190}
                        defaultValue=""
                        placeholder="Value (e.g. facebook, dhaka)"
                        aria-label="Value"
                        data-rule-value
                      />
                    </td>
                    <td style={{ width: "36px" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-erp-ghost text-danger"
                        data-rule-remove-condition
                        title="Remove"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn btn-erp-ghost btn-sm mb-3"
              data-rule-add-condition
              onClick={addCondition}
            >
              <i className="fa-solid fa-plus me-1"></i>Add condition
            </button>

            <datalist id="rule-opts-source">
              <option value="website_form">Website Form</option>
              <option value="facebook">Facebook Lead</option>
              <option value="google_ads">Google Ads</option>
              <option value="referral">Referral</option>
              <option value="walk_in">Walk-in</option>
              <option value="campaign">Campaign</option>
              <option value="import">CSV Import</option>
              <option value="api">API</option>
              <option value="manual">Manual Entry</option>
            </datalist>
            <datalist id="rule-opts-priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </datalist>
            <datalist id="rule-opts-branch_id">
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </datalist>
            <datalist id="rule-opts-country">
              <option value="BD">Bangladesh</option>
              <option value="IN">India</option>
              <option value="US">United States of America</option>
              <option value="GB">United Kingdom</option>
              <option value="AE">United Arab Emirates</option>
            </datalist>

            <div className="erp-switch-row">
              <div>
                <h6>Active</h6>
                <p>Inactive rules are skipped on capture but keep their round-robin position.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="is_active"
                  name="is_active"
                  value="1"
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
            <Link href="/crm/assignment-rules" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" data-submit-button disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>Create Rule
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
