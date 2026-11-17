"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal, ErpEmptyState, ErpPageHeader } from "@/components/ui";
import { downloadCsv } from "@/lib/csv-client";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export interface BuildingRow {
  id: number;
  code: string;
  name: string;
  buildingType: string;
  status: string;
  location: string | null;
  floorsAbove: number;
  floorsBelow: number;
  totalUnits: number;
  source: string;
  createdBy: string | null;
  project: { id: number; code: string; name: string } | null;
  _count?: { floors: number; units: number };
}

const STATUS_LABELS: Record<string, { label: string; pill: string; icon: string }> = {
  under_construction: { label: "Under Construction", pill: "is-hold", icon: "fa-solid fa-person-digging" },
  completed: { label: "Completed", pill: "is-booked", icon: "fa-solid fa-flag-checkered" },
  handover: { label: "Handover", pill: "is-sold", icon: "fa-solid fa-key" },
  occupied: { label: "Occupied", pill: "is-available", icon: "fa-solid fa-people-roof" },
  maintenance: { label: "Maintenance", pill: "is-overdue", icon: "fa-solid fa-screwdriver-wrench" },
};

const TYPE_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  mixed_use: "Mixed Use",
  industrial: "Industrial",
  other: "Other",
};

export function BuildingsListClient({
  buildings: initial,
  statusCounts,
}: {
  buildings: BuildingRow[];
  statusCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [buildings, setBuildings] = useState(initial);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BuildingRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = buildings.filter((b) => {
    if (typeFilter && b.buildingType !== typeFilter) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!b.name.toLowerCase().includes(q) && !b.code.toLowerCase().includes(q) && !(b.location ?? "").toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/buildings/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setBuildings((prev) => prev.filter((x) => x.id !== deleteTarget.id));
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
        icon="fa-solid fa-building"
        title="Buildings"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Projects", href: "/projects/projects" }, { label: "Buildings" }]}
        actions={
          <>
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() =>
                downloadCsv(
                  "buildings.csv",
                  ["Code", "Name", "Type", "Status", "Location", "Source"],
                  filtered.map((b) => [b.code, b.name, b.buildingType, b.status, b.location, b.source])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2" />Export
            </button>
            <Link href="/buildings/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2" />New Building
            </Link>
          </>
        }
      />

      <div className="erp-coa-summary">
        {Object.entries(STATUS_LABELS).map(([k, meta]) => (
          <div
            key={k}
            role="button"
            tabIndex={0}
            onClick={() => setStatusFilter(statusFilter === k ? "" : k)}
            onKeyDown={(e) => e.key === "Enter" && setStatusFilter(statusFilter === k ? "" : k)}
            className={`erp-coa-stat ${meta.pill}`}
            style={{ cursor: "pointer", outline: statusFilter === k ? "2px solid var(--erp-primary)" : undefined }}
          >
            <span className="erp-coa-stat-icon"><i className={meta.icon} /></span>
            <span className="erp-coa-stat-body">
              <strong>{statusCounts[k] ?? 0}</strong>
              <small>{meta.label}</small>
            </span>
          </div>
        ))}
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <div className="erp-filterbar">
            <div className="erp-search erp-search-sm">
              <i className="fa-solid fa-magnifying-glass" />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, code or city…" />
            </div>
            <select className="erp-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="erp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
          </div>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>{filtered.length} building{filtered.length === 1 ? "" : "s"}</span>
        </div>

        <div className="erp-card-body is-flush">
          {filtered.length === 0 ? (
            <ErpEmptyState icon="fa-solid fa-building" title="No buildings" description="Add your first building to track floors and units." />
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Building</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th className="text-center">Floors</th>
                    <th className="text-center">Units</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const st = STATUS_LABELS[b.status] ?? STATUS_LABELS.under_construction;
                    const floors = b._count?.floors ?? (b.floorsAbove + b.floorsBelow);
                    const units = b._count?.units ?? b.totalUnits;
                    return (
                      <tr key={b.id}>
                        <td>
                          <div className="erp-identity">
                            <span className="erp-initials"><i className="fa-solid fa-house" /></span>
                            <span>
                              <span className="erp-identity-name"><Link href={`/buildings/${b.id}`}>{b.name}</Link></span>
                              <span className="erp-identity-meta">{b.code}</span>
                            </span>
                          </div>
                        </td>
                        <td><span className="erp-pill is-available">{TYPE_LABELS[b.buildingType] || b.buildingType}</span></td>
                        <td>{b.location || "—"}</td>
                        <td className="text-center">
                          <span className={`erp-count-badge${floors === 0 ? " is-zero" : ""}`}>
                            <i className="fa-solid fa-stairs me-1" />{floors}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`erp-count-badge${units === 0 ? " is-zero" : ""}`}>
                            <i className="fa-solid fa-door-closed me-1" />{units}
                          </span>
                        </td>
                        <td><span className={`erp-pill ${st.pill}`}><i className={`${st.icon} me-1`} />{st.label}</span></td>
                        <td><span className="text-muted">{b.source}</span></td>
                        <td><span className="erp-cell-strong">{b.createdBy || "System Administrator"}</span></td>
                        <td className="text-end text-nowrap">
                          <Link href={`/buildings/${b.id}`} className="btn btn-erp-ghost btn-sm" title="View">
                            <i className="fa-regular fa-eye" />
                          </Link>
                          <Link href={`/buildings/${b.id}/floors`} className="btn btn-erp-ghost btn-sm" title="Floors & units">
                            <i className="fa-solid fa-stairs" />
                          </Link>
                          <Link href={`/buildings/${b.id}/edit`} className="btn btn-erp-ghost btn-sm" title="Edit">
                            <i className="fa-solid fa-pen" />
                          </Link>
                          <button type="button" className="btn btn-erp-ghost btn-sm text-danger" title="Delete" onClick={() => setDeleteTarget(b)}>
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete building?"
        description={<><strong>{deleteTarget?.name ?? ""}</strong> will be removed from active use.</>}
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
