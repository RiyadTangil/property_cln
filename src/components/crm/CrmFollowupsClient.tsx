"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CrmSubmenu } from "./CrmSubmenu";

export interface CrmFollowUpRow {
  id: number;
  companyId?: number;
  subject: string;
  followUpTypeId: number | null;
  priority: string;
  description: string | null;
  scheduledDate: string;
  scheduledTime: string | null;
  durationMinutes: number;
  reminderMinutesBefore: number;
  concerns: string | null;
  assignedTo: string | null;
  branchId: number | null;
  status: string;
  createdAt?: string | Date;
}

export interface FollowUpTypeRef {
  id: number;
  name: string;
  icon: string;
  pill: string;
}

export interface LeadRef {
  id: number;
  code: string;
  firstName: string;
  lastName: string | null;
}

export interface CustomerRef {
  id: number;
  code: string;
  firstName: string | null;
  lastName: string | null;
  organisationName: string | null;
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

const BUILTIN_TYPE_META: Record<number, { label: string; icon: string }> = {
  1: { label: "Call", icon: "fa-solid fa-phone" },
  2: { label: "Meeting", icon: "fa-solid fa-handshake" },
  3: { label: "Site Visit", icon: "fa-solid fa-building-circle-check" },
  4: { label: "Email", icon: "fa-solid fa-envelope" },
  5: { label: "SMS", icon: "fa-solid fa-comment-sms" },
  6: { label: "WhatsApp", icon: "fa-brands fa-whatsapp" },
  7: { label: "Demo / Walkthrough", icon: "fa-solid fa-desktop" },
  8: { label: "Collect Documents", icon: "fa-solid fa-file-arrow-up" },
  9: { label: "Payment Reminder", icon: "fa-solid fa-money-bill-wave" },
  10: { label: "Other", icon: "fa-solid fa-list-check" },
};

const PRIORITY_META: Record<string, { label: string; pill: string }> = {
  low: { label: "Low", pill: "is-neutral" },
  normal: { label: "Medium", pill: "is-booked" },
  medium: { label: "Medium", pill: "is-booked" },
  high: { label: "High", pill: "is-hold" },
  urgent: { label: "Urgent", pill: "is-overdue" },
};

const STATUS_META: Record<string, { label: string; pill: string }> = {
  scheduled: { label: "Scheduled", pill: "is-booked" },
  completed: { label: "Completed", pill: "is-available" },
  cancelled: { label: "Cancelled", pill: "is-neutral" },
  no_show: { label: "No Show", pill: "is-overdue" },
};

const REMINDER_OPTIONS = [
  { value: "", label: "No reminder" },
  { value: "0", label: "At the scheduled time" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "120", label: "2 hours before" },
  { value: "1440", label: "1 day before" },
  { value: "2880", label: "2 days before" },
  { value: "10080", label: "1 week before" },
];

function formatRefCode(id: number): string {
  return `FU-${String(id).padStart(4, "0")}`;
}

function formatShortDate(d: string | Date | undefined | null): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function resolveTypeMeta(typeId: number | null, followupTypes: FollowUpTypeRef[]) {
  const found = followupTypes.find((t) => t.id === typeId);
  const builtin = typeId ? BUILTIN_TYPE_META[typeId] : undefined;
  const label =
    builtin && found && (found.name === builtin.label.split(" ")[0] || found.name === builtin.label)
      ? builtin.label
      : found?.name || builtin?.label || "Call";
  const icon =
    builtin && found?.icon === "fa-solid fa-phone" && found.id !== 1
      ? builtin.icon
      : found?.icon || builtin?.icon || "fa-solid fa-phone";
  return { label, icon };
}

function customerFullName(c: CustomerRef): string {
  const full = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
  return full || c.organisationName || c.code;
}

function leadFullName(l: LeadRef): string {
  return `${l.firstName} ${l.lastName ?? ""}`.trim() || l.code;
}

function resolveConcernInfo(
  raw: string | null,
  customers: CustomerRef[],
  leads: LeadRef[]
): { key: string; label: string; href: string | null; meta: string } {
  if (!raw) return { key: "", label: "—", href: null, meta: "" };

  if (raw.startsWith("customer:")) {
    const cid = Number(raw.slice("customer:".length));
    const cust = customers.find((c) => c.id === cid);
    if (cust) {
      return {
        key: raw,
        label: customerFullName(cust),
        href: `/crm/customers/${cust.id}`,
        meta: cust.code,
      };
    }
  }

  if (raw.startsWith("lead:")) {
    const lid = Number(raw.slice("lead:".length));
    const lead = leads.find((l) => l.id === lid);
    if (lead) {
      return {
        key: raw,
        label: leadFullName(lead),
        href: `/crm/leads/${lead.id}`,
        meta: lead.code,
      };
    }
  }

  if (raw.toLowerCase().startsWith("lead:")) {
    const namePart = raw.slice(5).trim().toLowerCase();
    const lead = leads.find((l) => leadFullName(l).toLowerCase() === namePart);
    if (lead) {
      return {
        key: `lead:${lead.id}`,
        label: leadFullName(lead),
        href: `/crm/leads/${lead.id}`,
        meta: "",
      };
    }
  }

  if (raw.toLowerCase().startsWith("customer:")) {
    const namePart = raw.slice(9).trim().toLowerCase();
    const cust = customers.find((c) => customerFullName(c).toLowerCase() === namePart);
    if (cust) {
      return {
        key: `customer:${cust.id}`,
        label: customerFullName(cust),
        href: `/crm/customers/${cust.id}`,
        meta: "",
      };
    }
  }

  return { key: "", label: raw, href: null, meta: "" };
}

function normalizePriority(p: string): string {
  return p === "normal" ? "medium" : p;
}

export function CrmFollowupsList({
  initialItems,
  leads = [],
  customers = [],
  followupTypes = [],
  users = [],
}: {
  initialItems: CrmFollowUpRow[];
  leads?: LeadRef[];
  customers?: CustomerRef[];
  followupTypes?: FollowUpTypeRef[];
  users?: RefUser[];
  branches?: RefBranch[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<CrmFollowUpRow[]>(initialItems);
  const [dueFilter, setDueFilter] = useState<"" | "overdue" | "today" | "upcoming">("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CrmFollowUpRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const countOverdue = items.filter((f) => f.status === "scheduled" && f.scheduledDate < today).length;
  const countToday = items.filter((f) => f.status === "scheduled" && f.scheduledDate === today).length;
  const countUpcoming = items.filter((f) => f.status === "scheduled" && f.scheduledDate > today).length;

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (dueFilter === "overdue" && !(item.status === "scheduled" && item.scheduledDate < today)) return false;
      if (dueFilter === "today" && !(item.status === "scheduled" && item.scheduledDate === today)) return false;
      if (dueFilter === "upcoming" && !(item.status === "scheduled" && item.scheduledDate > today)) return false;

      const q = search.trim().toLowerCase();
      if (q) {
        const concern = resolveConcernInfo(item.concerns, customers, leads);
        const hay = `${item.subject} ${formatRefCode(item.id)} ${concern.label} ${item.concerns ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter && item.status !== statusFilter) return false;
      if (typeFilter && String(item.followUpTypeId ?? "") !== typeFilter) return false;
      if (priorityFilter && normalizePriority(item.priority) !== priorityFilter) return false;
      if (assignedFilter) {
        const matchedUser = users.find((u) => String(u.id) === assignedFilter);
        const matchesUser =
          item.assignedTo === assignedFilter || (matchedUser && item.assignedTo === matchedUser.name);
        if (!matchesUser) return false;
      }
      return true;
    });
  }, [items, dueFilter, search, statusFilter, typeFilter, priorityFilter, assignedFilter, customers, leads, users, today]);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/followups/${deleteTarget.id}`, { method: "DELETE" });
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
            <i className="fa-solid fa-list-check"></i>
          </div>
          <div>
            <h1>Follow-ups</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Follow-ups
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/followups/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Follow-up
          </Link>
        </div>
      </div>

      <div className="erp-statrow">
        <a
          href="/crm/followups?due=overdue"
          className={`erp-stat ${dueFilter === "overdue" ? "is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setDueFilter("overdue");
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
          href="/crm/followups?due=today"
          className={`erp-stat ${dueFilter === "today" ? "is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setDueFilter("today");
          }}
        >
          <span className="erp-stat-icon">
            <i className="fa-solid fa-calendar-day"></i>
          </span>
          <span className="erp-stat-body">
            <strong>{countToday}</strong>
            <small>Due today</small>
          </span>
        </a>
        <a
          href="/crm/followups?due=upcoming"
          className={`erp-stat ${dueFilter === "upcoming" ? "is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setDueFilter("upcoming");
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
        <a
          href="/crm/followups"
          className={`erp-stat ${dueFilter === "" ? "is-active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            setDueFilter("");
          }}
        >
          <span className="erp-stat-icon">
            <i className="fa-solid fa-list"></i>
          </span>
          <span className="erp-stat-body">
            <strong>{items.length}</strong>
            <small>All</small>
          </span>
        </a>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/crm/followups"
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
                placeholder="Search subject, reference, customer…"
                aria-label="Search follow-ups"
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
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>

            <select
              name="type"
              className="form-select erp-select"
              aria-label="Type filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {followupTypes.map((ft) => {
                const tm = resolveTypeMeta(ft.id, followupTypes);
                return (
                  <option key={ft.id} value={String(ft.id)}>
                    {tm.label}
                  </option>
                );
              })}
            </select>

            <select
              name="priority"
              className="form-select erp-select"
              aria-label="Priority filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              name="assigned_to"
              className="form-select erp-select"
              aria-label="Assignee filter"
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
            >
              <option value="">Anyone</option>
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
            {filtered.length} {filtered.length === 1 ? "follow-up" : "follow-ups"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-list-check"></i>
            </div>
            <h3>No follow-ups yet</h3>
            <p>Schedule calls, meetings, and reminders linked to your leads and customers.</p>
            <Link href="/crm/followups/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Follow-up
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Follow-up</th>
                    <th>Concerns</th>
                    <th>Type</th>
                    <th>When</th>
                    <th>Assigned</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => {
                    const typeMeta = resolveTypeMeta(f.followUpTypeId, followupTypes);
                    const priMeta = PRIORITY_META[f.priority] ?? PRIORITY_META.medium;
                    const stMeta = STATUS_META[f.status] ?? STATUS_META.scheduled;
                    const concern = resolveConcernInfo(f.concerns, customers, leads);

                    return (
                      <tr key={f.id}>
                        <td>
                          <div className="erp-identity">
                            <span className="erp-initials">
                              <i className={typeMeta.icon}></i>
                            </span>
                            <span>
                              <span className="erp-identity-name">
                                <Link href={`/crm/followups/${f.id}`} className="erp-plain-link">
                                  {f.subject}
                                </Link>
                                <span className={`erp-pill ${priMeta.pill} ms-1`}>{priMeta.label}</span>
                              </span>
                              <span className="erp-identity-meta">{formatRefCode(f.id)}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          {concern.href ? (
                            <>
                              <Link href={concern.href} className="erp-plain-link">
                                {concern.label}
                              </Link>
                              <div className="erp-identity-meta">{concern.meta}</div>
                            </>
                          ) : (
                            <span className="text-muted">{concern.label}</span>
                          )}
                        </td>
                        <td>
                          <span className="erp-scope-tag">
                            <i className={typeMeta.icon}></i> {typeMeta.label}
                          </span>
                        </td>
                        <td className="text-nowrap" style={{ fontSize: "12.5px" }}>
                          <span>{formatShortDate(f.scheduledDate)}</span>
                          <div className="erp-identity-meta">{f.scheduledTime || "All day"}</div>
                        </td>
                        <td>{f.assignedTo || "—"}</td>
                        <td>
                          <span className={`erp-pill ${stMeta.pill}`}>{stMeta.label}</span>
                        </td>
                        <td>
                          <span className="erp-created-by">
                            <span className="erp-cell-strong">{f.assignedTo || "System Administrator"}</span>
                            <span className="erp-identity-meta d-block">{formatShortDate(f.scheduledDate)}</span>
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <Link href={`/crm/followups/${f.id}`} className="btn btn-erp-ghost btn-sm" title="View">
                            <i className="fa-solid fa-eye"></i>
                          </Link>{" "}
                          <Link href={`/crm/followups/${f.id}/edit`} className="btn btn-erp-ghost btn-sm" title="Edit">
                            <i className="fa-solid fa-pen"></i>
                          </Link>{" "}
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(f)}
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
                    Delete follow-up?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>{deleteTarget?.subject}</strong> will be removed from active use. The
                    record is retained and can be restored by an administrator.
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

export function CrmFollowupForm({
  mode,
  initialData,
  leads = [],
  customers = [],
  followupTypes = [],
  users = [],
  branches = [],
  defaultCustomerId,
  defaultLeadId,
}: {
  mode: "create" | "edit";
  initialData?: CrmFollowUpRow;
  leads?: LeadRef[];
  customers?: CustomerRef[];
  followupTypes?: FollowUpTypeRef[];
  users?: RefUser[];
  branches?: RefBranch[];
  defaultCustomerId?: string;
  defaultLeadId?: string;
}) {
  const router = useRouter();
  const initialConcern = initialData
    ? resolveConcernInfo(initialData.concerns, customers, leads).key || initialData.concerns || ""
    : defaultCustomerId
      ? `customer:${defaultCustomerId}`
      : defaultLeadId
        ? `lead:${defaultLeadId}`
        : "";

  const matchedInitialUser = initialData?.assignedTo
    ? users.find((u) => u.name === initialData.assignedTo || String(u.id) === initialData.assignedTo)
    : users.find((u) => u.id === 1) ?? users[0];

  const [subject, setSubject] = useState(initialData?.subject || "");
  const [followUpTypeId, setFollowUpTypeId] = useState(
    initialData?.followUpTypeId ? String(initialData.followUpTypeId) : ""
  );
  const [priority, setPriority] = useState(
    initialData ? normalizePriority(initialData.priority) : "medium"
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [scheduledDate, setScheduledDate] = useState(
    initialData?.scheduledDate || new Date().toISOString().slice(0, 10)
  );
  const [scheduledTime, setScheduledTime] = useState(initialData?.scheduledTime || "");
  const [durationMinutes, setDurationMinutes] = useState(
    initialData?.durationMinutes ? String(initialData.durationMinutes) : "30"
  );
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(
    initialData && initialData.reminderMinutesBefore !== undefined
      ? String(initialData.reminderMinutesBefore)
      : ""
  );
  const [concerns, setConcerns] = useState(initialConcern);
  const [assignedTo, setAssignedTo] = useState(matchedInitialUser ? String(matchedInitialUser.id) : "");
  const [branchId, setBranchId] = useState(initialData?.branchId ? String(initialData.branchId) : "");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }
    if (!followUpTypeId) {
      setError("Please select a follow-up type.");
      return;
    }
    if (!scheduledDate) {
      setError("Scheduled date is required.");
      return;
    }

    const selectedUser = users.find((u) => String(u.id) === assignedTo);

    setSubmitting(true);
    try {
      const payload = {
        subject: subject.trim(),
        follow_up_type_id: Number(followUpTypeId),
        priority,
        description: description.trim() || null,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime || null,
        duration_minutes: durationMinutes ? Number(durationMinutes) : 30,
        reminder_minutes_before: reminderMinutesBefore !== "" ? Number(reminderMinutesBefore) : 0,
        concerns: concerns || null,
        assigned_to: selectedUser ? selectedUser.name : assignedTo || null,
        branch_id: branchId ? Number(branchId) : null,
        attachments: selectedFiles,
      };
      const url = mode === "edit" && initialData ? `/api/crm/followups/${initialData.id}` : "/api/crm/followups";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to save follow-up.");
        return;
      }
      if (mode === "edit" && initialData) {
        router.push(`/crm/followups/${initialData.id}`);
      } else {
        router.push("/crm/followups");
      }
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
            <i className="fa-solid fa-list-check"></i>
          </div>
          <div>
            <h1>{mode === "edit" ? initialData?.subject || "Edit Follow-up" : "New Follow-up"}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/followups">Follow-ups</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {mode === "edit" ? "Edit" : "New"}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          {mode === "edit" && initialData ? (
            <Link href={`/crm/followups/${initialData.id}`} className="btn btn-erp-ghost">
              <i className="fa-solid fa-arrow-left me-2"></i>Back
            </Link>
          ) : (
            <Link href="/crm/followups" className="btn btn-erp-ghost">
              <i className="fa-solid fa-arrow-left me-2"></i>Back to list
            </Link>
          )}
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
        action={mode === "edit" && initialData ? `/crm/followups/${initialData.id}` : "/crm/followups"}
        className="erp-form"
        encType="multipart/form-data"
        data-erp-org-form
        noValidate
        onSubmit={handleSubmit}
      >
        {mode === "edit" && <input type="hidden" name="_method" value="PUT" />}

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-list-check"></i>
            </div>
            <div>
              <h2>Follow-up</h2>
              <p>What needs doing, and how urgent it is.</p>
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
                  {mode === "edit"
                    ? "This follow-up belongs to HQ and stays with it."
                    : "Filed under HQ \u2014 switch companies from the top bar to change this."}
                </span>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="erp-field">
                  <label htmlFor="subject" className="form-label">
                    Subject <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="form-control "
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={190}
                    placeholder="Call about the Gulshan 3-bed quotation"
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="follow_up_type_id" className="form-label">
                    Type <span className="erp-required">*</span>
                  </label>
                  <select
                    id="follow_up_type_id"
                    name="follow_up_type_id"
                    className="form-select "
                    value={followUpTypeId}
                    onChange={(e) => setFollowUpTypeId(e.target.value)}
                    required
                  >
                    <option value="">Select a type…</option>
                    {followupTypes.map((ft) => {
                      const tm = resolveTypeMeta(ft.id, followupTypes);
                      return (
                        <option key={ft.id} value={String(ft.id)}>
                          {tm.label}
                        </option>
                      );
                    })}
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
                    placeholder="Context, talking points, what was agreed last time…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-calendar-day"></i>
            </div>
            <div>
              <h2>Schedule</h2>
              <p>Leave the time empty for an all-day follow-up.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-3">
                <div className="erp-field mb-md-0">
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
                <div className="erp-field mb-md-0">
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
                <div className="erp-field mb-md-0">
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
                <div className="erp-field mb-md-0">
                  <label htmlFor="reminder_minutes_before" className="form-label">
                    Reminder
                  </label>
                  <select
                    id="reminder_minutes_before"
                    name="reminder_minutes_before"
                    className="form-select "
                    value={reminderMinutesBefore}
                    onChange={(e) => setReminderMinutesBefore(e.target.value)}
                  >
                    {REMINDER_OPTIONS.map((ro) => (
                      <option key={ro.value} value={ro.value}>
                        {ro.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-link"></i>
            </div>
            <div>
              <h2>Who It Concerns</h2>
              <p>Link the follow-up to a customer or a lead — at least one is required.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-12">
                <div className="erp-field">
                  <label htmlFor="concerns" className="form-label">
                    Customer or Lead <span className="erp-required">*</span>
                  </label>
                  <select
                    id="concerns"
                    name="concerns"
                    className="form-select  "
                    data-select2
                    data-placeholder="Search customers and leads by name or phone…"
                    value={concerns}
                    onChange={(e) => setConcerns(e.target.value)}
                  >
                    <option value=""></option>
                    {customers.map((c) => (
                      <option key={`c-${c.id}`} value={`customer:${c.id}`} data-meta={c.code}>
                        {customerFullName(c)}
                      </option>
                    ))}
                    {leads.map((l) => (
                      <option key={`l-${l.id}`} value={`lead:${l.id}`} data-meta={l.code}>
                        {leadFullName(l)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-12">
                <div className="erp-field mb-0">
                  <label className="form-label">Opportunity / Quotation / Invoice</label>
                  <input
                    type="text"
                    className="form-control"
                    disabled
                    value="Available once those modules are built"
                    readOnly
                  />
                  <span className="erp-help">
                    The field is already stored and validated &mdash; registering the module in{" "}
                    <code>config/crm.php</code> turns this into a live picker.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-user-tie"></i>
            </div>
            <div>
              <h2>Assignment</h2>
              <p>Who is responsible for this follow-up.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="erp-field mb-md-0">
                  <label htmlFor="assigned_to" className="form-label">
                    Assigned Employee
                  </label>
                  <select
                    id="assigned_to"
                    name="assigned_to"
                    className="form-select "
                    data-select2
                    data-placeholder="Search staff…"
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
                <div className="erp-field mb-md-0">
                  <label htmlFor="branch_id" className="form-label">
                    Branch
                  </label>
                  <select
                    id="branch_id"
                    name="branch_id"
                    className="form-select "
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    <option value="">Company-wide</option>
                    {branches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-paperclip"></i>
            </div>
            <div>
              <h2>Attachments</h2>
              <p>PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, WEBP, ZIP, up to 10 MB each, 10 files max.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-field mb-0">
              <label htmlFor="attachments" className="form-label">
                Add files
              </label>
              <input
                type="file"
                id="attachments"
                name="attachments[]"
                multiple
                className="form-control "
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.zip"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []).map((f) => f.name);
                  setSelectedFiles(files);
                }}
              />
              {selectedFiles.length > 0 && (
                <span className="erp-help">Selected: {selectedFiles.join(", ")}</span>
              )}
            </div>
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Fields marked <span className="erp-required">*</span> are required.
          </span>
          <div className="erp-form-bar-actions">
            <Link
              href={mode === "edit" && initialData ? `/crm/followups/${initialData.id}` : "/crm/followups"}
              className="btn btn-erp-ghost"
            >
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" data-submit-button disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {mode === "edit" ? "Save Changes" : "Schedule Follow-up"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function CrmFollowupDetail({
  followup: initialFollowup,
  leads = [],
  customers = [],
  followupTypes = [],
  branches = [],
}: {
  followup: CrmFollowUpRow;
  leads?: LeadRef[];
  customers?: CustomerRef[];
  followupTypes?: FollowUpTypeRef[];
  users?: RefUser[];
  branches?: RefBranch[];
}) {
  const router = useRouter();
  const [followup, setFollowup] = useState<CrmFollowUpRow>(initialFollowup);
  const [menuOpen, setMenuOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const typeMeta = resolveTypeMeta(followup.followUpTypeId, followupTypes);
  const priMeta = PRIORITY_META[followup.priority] ?? PRIORITY_META.medium;
  const stMeta = STATUS_META[followup.status] ?? STATUS_META.scheduled;
  const concern = resolveConcernInfo(followup.concerns, customers, leads);
  const branchName = branches.find((b) => b.id === followup.branchId)?.name || "";
  const reminderLabel =
    REMINDER_OPTIONS.find((r) => r.value === String(followup.reminderMinutesBefore))?.label || "No reminder";

  async function handleChangeStatus(nextStatus: "completed" | "scheduled") {
    setUpdatingStatus(true);
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/crm/followups/${followup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setFollowup((prev) => ({ ...prev, status: nextStatus }));
        router.refresh();
      }
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/followups/${followup.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/crm/followups");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  const refCode = formatRefCode(followup.id);

  return (
    <div className="container erp-container-form">
      <CrmSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className={typeMeta.icon}></i>
          </div>
          <div>
            <h1>{followup.subject}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/followups">Follow-ups</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {refCode}
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="erp-pagehead-actions">
          <Link href="/crm/followups" className="btn btn-erp-ghost">
            <i className="fa-solid fa-list me-2"></i>All Follow-ups
          </Link>

          <Link href={`/crm/followups/${followup.id}/edit`} className="btn btn-erp-ghost">
            <i className="fa-solid fa-pen me-2"></i>Edit
          </Link>

          <div className="dropdown">
            <button
              className="btn btn-erp-ghost"
              type="button"
              aria-expanded={menuOpen}
              aria-label="More actions"
              disabled={updatingStatus}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <i className="fa-solid fa-ellipsis"></i>
            </button>
            <ul className={`dropdown-menu dropdown-menu-end notika-dropdown erp-user-menu ${menuOpen ? "show" : ""}`}>
              {followup.status === "completed" ? (
                <li>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => handleChangeStatus("scheduled")}
                  >
                    <i className="fa-solid fa-rotate-left"></i> Reopen
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => handleChangeStatus("completed")}
                  >
                    <i className="fa-solid fa-circle-check"></i> Mark Completed
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  className="dropdown-item text-danger"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteRecordModal"
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                >
                  <i className="fa-solid fa-trash-can text-danger"></i> Delete
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {followup.status === "completed" && (
        <div
          className="alert alert-success d-flex gap-2 align-items-start"
          style={{ borderRadius: "9px", fontSize: "13px" }}
        >
          <i className="fa-solid fa-circle-check mt-1"></i>
          <div>
            Completed on {formatShortDate(followup.scheduledDate)} · {followup.scheduledTime || "All day"}.{" "}
            {followup.description || ""}
          </div>
        </div>
      )}

      <div className="erp-card">
        <div className="erp-card-body">
          <div className="erp-profile-head">
            <span className="erp-avatar erp-avatar-lg">
              <i className={typeMeta.icon}></i>
            </span>
            <div className="min-w-0">
              <h2 style={{ fontSize: "17px", fontWeight: 600, margin: 0, color: "var(--erp-ink)" }}>
                {followup.subject}
              </h2>
              <p className="text-muted mb-2" style={{ fontSize: "13px" }}>
                {formatShortDate(followup.scheduledDate)} · {followup.scheduledTime || "All day"}
                {concern.href ? (
                  <>
                    {" "}
                    &middot; <Link href={concern.href}>{concern.label}</Link>
                  </>
                ) : concern.label !== "—" ? (
                  <> &middot; {concern.label}</>
                ) : null}
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className={`erp-pill ${stMeta.pill}`}>{stMeta.label}</span>
                <span className={`erp-pill ${priMeta.pill}`}>{priMeta.label}</span>
                <span className="erp-pill is-neutral">{refCode}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="erp-card-body is-flush">
          <div className="erp-factgrid">
            <div className="erp-fact">
              <span className="erp-fact-label">Reference</span>
              <span className="erp-fact-value">{refCode}</span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Type</span>
              <span className="erp-fact-value">{typeMeta.label}</span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Priority</span>
              <span className="erp-fact-value">{priMeta.label}</span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Status</span>
              <span className="erp-fact-value">{stMeta.label}</span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Date</span>
              <span className="erp-fact-value">{formatShortDate(followup.scheduledDate)}</span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Time</span>
              <span className={`erp-fact-value ${followup.scheduledTime ? "" : "is-empty"}`}>
                {followup.scheduledTime || "—"}
              </span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Duration</span>
              <span className={`erp-fact-value ${followup.durationMinutes ? "" : "is-empty"}`}>
                {followup.durationMinutes ? `${followup.durationMinutes} min` : "—"}
              </span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Reminder</span>
              <span className="erp-fact-value">{reminderLabel}</span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Assigned to</span>
              <span className={`erp-fact-value ${followup.assignedTo ? "" : "is-empty"}`}>
                {followup.assignedTo || "—"}
              </span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Branch</span>
              <span className={`erp-fact-value ${branchName ? "" : "is-empty"}`}>{branchName || "—"}</span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">
                {concern.key.startsWith("customer:") ? "Customer" : "Lead"}
              </span>
              <span className={`erp-fact-value ${concern.label !== "—" ? "" : "is-empty"}`}>
                {concern.href ? <Link href={concern.href}>{concern.label}</Link> : concern.label}
              </span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Contact number</span>
              <span className="erp-fact-value is-empty">—</span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Related record</span>
              <span className="erp-fact-value is-empty">—</span>
            </div>
            <div className="erp-fact">
              <span className="erp-fact-label">Created by</span>
              <span className="erp-fact-value">{followup.assignedTo || "System Administrator"}</span>
            </div>
            {followup.status === "completed" && (
              <div className="erp-fact">
                <span className="erp-fact-label">Completed</span>
                <span className="erp-fact-value">
                  {formatShortDate(followup.scheduledDate)} · {followup.scheduledTime || "All day"}
                </span>
              </div>
            )}
          </div>

          {followup.description && (
            <div className="erp-fact-notes">
              <span className="erp-fact-label">Description</span>
              <p>{followup.description}</p>
            </div>
          )}

          {followup.status === "completed" && followup.description && (
            <div className="erp-fact-notes">
              <span className="erp-fact-label">Outcome</span>
              <p>{followup.description}</p>
            </div>
          )}
        </div>
      </div>

      <div
        className={`modal fade ${deleteOpen ? "show" : ""}`}
        id="deleteRecordModal"
        tabIndex={-1}
        aria-hidden={!deleteOpen}
        style={deleteOpen ? { display: "block", backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
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
                    Delete follow-up?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>{followup.subject}</strong> will be removed from active use. The record is
                    retained and can be restored by an administrator.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setDeleteOpen(false)}
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
