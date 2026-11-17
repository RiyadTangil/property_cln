"use client";

import Link from "next/link";
import { useState } from "react";
import { ErpEmptyState, ErpPageHeader } from "@/components/ui";
import { downloadCsv } from "@/lib/csv-client";

interface AvBuilding {
  id: number;
  code: string;
  name: string;
  project: { id: number; code: string; name: string } | null;
  floors: { id: number; floorNumber: number; name: string | null; units: { id: number; unitNumber: string; status: string; builtArea: number | null; price: number | null }[] }[];
  units: { id: number; status: string; price: number | null; builtArea: number | null }[];
}

export function AvailabilityBoardClient({
  buildings,
  projects,
}: {
  buildings: AvBuilding[];
  projects: { id: number; code: string; name: string }[];
}) {
  const [projectId, setProjectId] = useState("");

  const scopedBuildings = buildings.filter((b) => {
    if (b.units.length === 0) return false;
    if (projectId && String(b.project?.id ?? "") !== projectId) return false;
    return true;
  });

  const allUnits = scopedBuildings.flatMap((b) => b.units);
  const total = allUnits.length;
  const available = allUnits.filter((u) => u.status === "available").length;
  const sold = allUnits.filter((u) => ["sold", "handed_over"].includes(u.status)).length;
  const booked = allUnits.filter((u) => u.status === "booked").length;
  const reserved = allUnits.filter((u) => u.status === "reserved").length;
  const blocked = allUnits.filter((u) => u.status === "blocked").length;
  const soldPct = total > 0 ? Math.round((sold / total) * 100) : 0;

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-table-cells-large"
        title="Availability Board"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Inventory" }, { label: "Availability Board" }]}
        actions={
          <>
            <Link href="/inventory/units" className="btn btn-erp-ghost">
              <i className="fa-solid fa-table-cells me-2" />Stacking Chart
            </Link>
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() => {
                const sellable = scopedBuildings.flatMap((b) =>
                  b.floors.flatMap((f) =>
                    f.units
                      .filter((u) => u.status === "available")
                      .map((u) => [b.name, f.name || f.floorNumber, u.unitNumber, u.builtArea, u.price])
                  )
                );
                downloadCsv("sellable-units.csv", ["Building", "Floor", "Unit", "Built Area", "Price"], sellable);
              }}
            >
              <i className="fa-solid fa-file-excel me-2" />Export Sellable
            </button>
          </>
        }
      />

      <div className="av-hero">
        <div className="av-hero-figure">
          <span>Available now</span>
          <strong>{available}</strong>
          <small>of {total} units</small>
        </div>
        <div className="av-hero-bar">
          <div className="av-bar is-lg" role="img" aria-label="Units by status">
            {total > 0 && available > 0 && <span style={{ width: `${(available / total) * 100}%`, background: "#0b7650" }} />}
            {total > 0 && booked > 0 && <span style={{ width: `${(booked / total) * 100}%`, background: "#0281bb" }} />}
            {total > 0 && reserved > 0 && <span style={{ width: `${(reserved / total) * 100}%`, background: "#b96f00" }} />}
            {total > 0 && sold > 0 && <span style={{ width: `${(sold / total) * 100}%`, background: "#bf3a3a" }} />}
            {total > 0 && blocked > 0 && <span style={{ width: `${(blocked / total) * 100}%`, background: "#5b6675" }} />}
          </div>
          <div className="av-legend">
            <span><i style={{ background: "#0b7650" }} />Available <b>{available}</b></span>
            {booked > 0 && <span><i style={{ background: "#0281bb" }} />Booked <b>{booked}</b></span>}
            {reserved > 0 && <span><i style={{ background: "#b96f00" }} />Reserved <b>{reserved}</b></span>}
            <span><i style={{ background: "#bf3a3a" }} />Sold <b>{sold}</b></span>
            {blocked > 0 && <span><i style={{ background: "#5b6675" }} />Blocked <b>{blocked}</b></span>}
          </div>
        </div>
        <div className="av-hero-figure is-right">
          <span>Sold</span>
          <strong>{soldPct}<small>%</small></strong>
          <small>of the book</small>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
            <select name="project_id" className="form-select erp-select" value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project">
              <option value="">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>{scopedBuildings.length} buildings</span>
        </div>

        <div className="erp-card-body">
          {scopedBuildings.length === 0 ? (
            <ErpEmptyState
              icon="fa-solid fa-table-cells-large"
              title="No units to show"
              description="Buildings appear here once they have floors and units on them."
            />
          ) : (
            <div className="d-flex flex-column gap-4">
              {scopedBuildings.map((b) => (
                <div key={b.id} className="border rounded p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <strong>{b.name}</strong>
                      {b.project && <span className="text-muted small ms-2">· {b.project.name}</span>}
                    </div>
                    <Link href={`/buildings/${b.id}/floors`} className="btn btn-erp-ghost btn-sm">Manage Floors</Link>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {b.floors.filter((f) => f.units.length > 0).map((f) => (
                      <div key={f.id} className="d-flex flex-wrap align-items-center gap-2">
                        <span className="small text-muted" style={{ minWidth: 95 }}>{f.name || `Floor ${f.floorNumber}`}</span>
                        {f.units.map((u) => (
                          <span
                            key={u.id}
                            className={`erp-pill ${
                              u.status === "available"
                                ? "is-available"
                                : u.status === "reserved"
                                ? "is-hold"
                                : u.status === "booked"
                                ? "is-booked"
                                : u.status === "blocked"
                                ? "is-overdue"
                                : "is-sold"
                            }`}
                          >
                            {u.unitNumber}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
