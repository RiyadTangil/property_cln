"use client";

import Link from "next/link";
import { useState } from "react";
import { ErpEmptyState, ErpPageHeader } from "@/components/ui";
import { downloadCsv } from "@/lib/csv-client";

interface LandPlotRow {
  id: number;
  code: string;
  title: string | null;
  landType: string;
  stage: string;
  mouza: string;
  areaValue: number;
  areaUnit: string;
  areaSqft: number;
  bookValue: number;
  project: { id: number; code: string; name: string } | null;
}

export function LandPlotsClient({
  parcels,
  projects,
}: {
  parcels: LandPlotRow[];
  projects: { id: number; code: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");

  const filtered = parcels.filter((p) => {
    if (projectId && String(p.project?.id ?? "") !== projectId) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.code.toLowerCase().includes(q) && !(p.title ?? "").toLowerCase().includes(q) && !p.mouza.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-map-location-dot"
        title="Land & Plots"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Inventory" }, { label: "Land & Plots" }]}
        actions={
          <>
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() =>
                downloadCsv(
                  "land-plots.csv",
                  ["Code", "Title", "Type", "Mouza", "Area (sq ft)", "Stage", "Project"],
                  filtered.map((p) => [p.code, p.title, p.landType, p.mouza, p.areaSqft, p.stage, p.project?.name])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2" />Export
            </button>
            <Link href="/land/parcels" className="btn btn-erp">
              <i className="fa-solid fa-map me-2" />Manage Land Parcels
            </Link>
          </>
        }
      />

      <div className="erp-card">
        <div className="erp-toolbar">
          <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plot code, title, mouza…" />
            </div>
            <select className="form-select erp-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <span className="text-muted small">{filtered.length} plots</span>
        </div>

        <div className="erp-card-body is-flush">
          {filtered.length === 0 ? (
            <ErpEmptyState icon="fa-solid fa-map-location-dot" title="No land plots found" description="Acquired land parcels and subdivided plots appear here." />
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table mb-0">
                <thead>
                  <tr>
                    <th>Plot / Parcel</th>
                    <th>Mouza</th>
                    <th>Area</th>
                    <th className="text-end">Sq Ft</th>
                    <th>Linked Project</th>
                    <th>Stage</th>
                    <th className="text-end">Book Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/land/parcels/${p.id}`} className="erp-cell-strong">{p.title || p.code}</Link>
                        <div className="erp-identity-meta">{p.code} · {p.landType}</div>
                      </td>
                      <td>{p.mouza}</td>
                      <td>{p.areaValue} {p.areaUnit}</td>
                      <td className="text-end">{p.areaSqft.toLocaleString()}</td>
                      <td>{p.project ? p.project.name : <span className="text-muted">Unassigned</span>}</td>
                      <td><span className="erp-pill is-available text-capitalize">{p.stage}</span></td>
                      <td className="text-end">{p.bookValue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
