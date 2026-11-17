"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal, ErpEmptyState, ErpPageHeader } from "@/components/ui";
import { downloadCsv } from "@/lib/csv-client";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export interface ProjectRow {
  id: number;
  code: string;
  name: string;
  location: string;
  status: string;
  priority: string;
  progress: number;
  completionPct: number;
  budget: number;
  clientName: string | null;
  managerName: string | null;
  createdBy: string | null;
  projectType: { id: number; name: string; icon: string; pill: string } | null;
  projectCategory: { id: number; name: string } | null;
  _count: { buildings: number; tasks: number };
}

const STATUS_META: Record<string, { label: string; icon: string; pill: string }> = {
  planning: { label: "Planning", icon: "fa-solid fa-compass-drafting", pill: "is-neutral" },
  active: { label: "Active", icon: "fa-solid fa-bolt", pill: "is-available" },
  on_hold: { label: "On Hold", icon: "fa-solid fa-pause", pill: "is-hold" },
  completed: { label: "Completed", icon: "fa-solid fa-flag-checkered", pill: "is-booked" },
  cancelled: { label: "Cancelled", icon: "fa-solid fa-ban", pill: "is-overdue" },
};

export function ProjectsListClient({
  projects: initial,
  types,
  statusCounts,
  managers,
}: {
  projects: ProjectRow[];
  types: { id: number; name: string }[];
  statusCounts: Record<string, number>;
  managers: string[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initial);
  const [view, setView] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = projects.filter((p) => {
    const normStatus = p.status.toLowerCase().replace(/\s+/g, "_");
    if (statusFilter && normStatus !== statusFilter) return false;
    if (typeFilter && String(p.projectType?.id ?? "") !== typeFilter) return false;
    if (priorityFilter && p.priority !== priorityFilter) return false;
    if (managerFilter && p.managerName !== managerFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q) && !p.location.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((x) => x.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon="fa-solid fa-city"
        title="Projects"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Projects" }]}
        actions={
          <>
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() =>
                downloadCsv(
                  "projects.csv",
                  ["Code", "Name", "Type", "Category", "Location", "Status", "Progress"],
                  filtered.map((p) => [p.code, p.name, p.projectType?.name, p.projectCategory?.name, p.location, p.status, p.progress])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2" />Export
            </button>
            <Link href="/projects/projects/task-templates" className="btn btn-erp-ghost">
              <i className="fa-solid fa-sliders me-2" />Setup
            </Link>
            <Link href="/projects/projects/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2" />New Project
            </Link>
          </>
        }
      />

      <div className="erp-statrow mb-3">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(statusFilter === key ? "" : key)}
            className={`erp-stat border-0 text-start${statusFilter === key ? " is-active" : ""}`}
          >
            <span className="erp-stat-icon"><i className={meta.icon} /></span>
            <span className="erp-stat-body">
              <strong>{statusCounts[key] ?? 0}</strong>
              <small>{meta.label}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, code, location…"
                aria-label="Search projects"
              />
            </div>
            <select className="form-select erp-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select className="form-select erp-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select className="form-select erp-select" value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}>
              <option value="">All managers</option>
              {managers.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>{filtered.length} projects</span>
          <div className="erp-view-toggle" role="group" aria-label="View">
            <button
              type="button"
              className={`erp-view-toggle-btn border-0${view === "list" ? " is-active" : ""}`}
              onClick={() => setView("list")}
              title="List"
            >
              <i className="fa-solid fa-list" />
            </button>
            <button
              type="button"
              className={`erp-view-toggle-btn border-0${view === "grid" ? " is-active" : ""}`}
              onClick={() => setView("grid")}
              title="Cards"
            >
              <i className="fa-solid fa-grip" />
            </button>
          </div>
        </div>

        <div className={`erp-projects`} data-view={view}>
          {filtered.length === 0 ? (
            <ErpEmptyState icon="fa-solid fa-city" title="No projects found" description="Create a new project or clear filters." />
          ) : view === "list" ? (
            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table erp-ptable">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Client</th>
                      <th>Manager</th>
                      <th className="text-end">Budget</th>
                      <th style={{ minWidth: 190 }}>Progress</th>
                      <th>Status</th>
                      <th>Created By</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const normStatus = p.status.toLowerCase().replace(/\s+/g, "_");
                      const sm = STATUS_META[normStatus] ?? STATUS_META.planning;
                      const pct = p.progress || p.completionPct || 0;
                      return (
                        <tr key={p.id} className="erp-prow">
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <span className={`erp-prow-tile erp-initials ${p.projectType?.pill || "is-available"}`}>
                                <i className={p.projectType?.icon || "fa-solid fa-house"} />
                              </span>
                              <div>
                                <Link href={`/projects/projects/${p.id}`} className="erp-prow-name">{p.name}</Link>
                                <div className="erp-prow-meta">
                                  <span className="erp-prow-code">{p.code}</span>
                                  {p.projectCategory && <span>{p.projectCategory.name}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {p.clientName ? p.clientName : (
                              <span className="erp-prow-muted"><i className="fa-regular fa-circle-question me-1" />Unassigned</span>
                            )}
                          </td>
                          <td>{p.managerName || <span className="erp-prow-muted">—</span>}</td>
                          <td className="text-end">
                            {p.budget > 0 ? p.budget.toLocaleString() : <span className="erp-prow-muted">—</span>}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="erp-prow-bar flex-grow-1">
                                <span className="erp-progress-bar" style={{ width: `${pct}%` }} />
                              </div>
                              <span style={{ fontSize: 12 }}>{pct}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`erp-pill ${sm.pill}`}>
                              <i className={`${sm.icon} me-1`} />{sm.label}
                            </span>
                            <span className="erp-prow-sub">
                              <span className="erp-pill is-booked erp-prow-prio text-capitalize">{p.priority}</span>
                            </span>
                          </td>
                          <td><span className="erp-cell-strong">{p.createdBy || "System Administrator"}</span></td>
                          <td className="text-end text-nowrap">
                            <Link href={`/projects/projects/${p.id}`} className="btn btn-erp-ghost btn-sm" title="View">
                              <i className="fa-solid fa-eye" />
                            </Link>
                            <Link href={`/projects/projects/${p.id}/edit`} className="btn btn-erp-ghost btn-sm" title="Edit">
                              <i className="fa-solid fa-pen" />
                            </Link>
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-danger"
                              title="Delete"
                              onClick={() => setDeleteTarget(p)}
                            >
                              <i className="fa-solid fa-trash-can" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="erp-card-body erp-projects-grid">
              {filtered.map((p) => {
                const normStatus = p.status.toLowerCase().replace(/\s+/g, "_");
                const sm = STATUS_META[normStatus] ?? STATUS_META.planning;
                const pct = p.progress || p.completionPct || 0;
                return (
                  <article key={p.id} className="erp-pcard">
                    <Link href={`/projects/projects/${p.id}`} className="erp-pcard-cover" aria-label={`Open ${p.name}`}>
                      <span className="erp-pcard-pattern" aria-hidden="true" />
                      <span className="erp-pcard-status"><i className={sm.icon} />{sm.label}</span>
                      <span className="erp-pcard-ring" style={{ "--value": pct } as React.CSSProperties}>
                        <span>{pct}<small>%</small></span>
                      </span>
                      <span className="erp-pcard-id">
                        <span className={`erp-pcard-tile erp-initials ${p.projectType?.pill || "is-available"}`}>
                          <i className={p.projectType?.icon || "fa-solid fa-house"} />
                        </span>
                        <span className="tw:min-w-0">
                          <strong>{p.name}</strong>
                          <small>{p.code}</small>
                        </span>
                      </span>
                    </Link>
                    <div className="erp-pcard-body">
                      <div className="erp-pcard-tags">
                        <span className="erp-pill is-booked text-capitalize">{p.priority}</span>
                        {p.projectCategory && <span className="erp-pcard-tag">{p.projectCategory.name}</span>}
                      </div>
                      <dl className="erp-pcard-facts">
                        <div>
                          <dt>Client</dt>
                          <dd className={p.clientName ? "" : "is-empty"}>{p.clientName || "Unassigned"}</dd>
                        </div>
                        <div>
                          <dt>Manager</dt>
                          <dd className={p.managerName ? "" : "is-empty"}>{p.managerName || "—"}</dd>
                        </div>
                        <div>
                          <dt>Location</dt>
                          <dd>{p.location || "—"}</dd>
                        </div>
                        <div>
                          <dt>Budget</dt>
                          <dd className="tw:tabular-nums">{p.budget > 0 ? p.budget.toLocaleString() : "—"}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="erp-pcard-foot">
                      <Link href={`/projects/projects/${p.id}`} className="btn btn-erp-ghost btn-sm">View</Link>
                      <Link href={`/projects/projects/${p.id}/edit`} className="btn btn-erp-ghost btn-sm">Edit</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete project?"
        description={<><strong>{deleteTarget?.name ?? ""}</strong> will be removed from active use.</>}
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
