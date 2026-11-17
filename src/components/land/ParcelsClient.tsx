"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ALL_STAGES,
  LAND_TYPES,
  PIPELINE_STAGES,
  formatMoney,
  getLabel,
  getStageMeta,
  sqftToKatha,
} from "@/lib/land";

export interface ParcelRow {
  id: number;
  code: string;
  title: string | null;
  landType: string;
  stage: string;
  mouza: string;
  jlNo: string | null;
  district: string;
  areaValue: number;
  areaUnit: string;
  areaSqft: number;
  bookValue: number;
  projectId: number | null;
  project: { id: number; name: string } | null;
}

interface ParcelsClientProps {
  parcels: ParcelRow[];
  stageCounts: Record<string, number>;
  projects: { id: number; name: string }[];
  filters: {
    search: string;
    stage: string;
    land_type: string;
    district: string;
    project_id: string;
    view: string;
  };
}

export default function ParcelsClient({
  parcels,
  stageCounts,
  projects,
  filters,
}: ParcelsClientProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);

  async function handleStageChange(id: number, stage: string) {
    setBusyId(id);
    try {
      await fetch(`/api/land/parcels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number, code: string) {
    if (!confirm(`Delete land file ${code}? This will remove linked proposals, agreements, and payments.`)) {
      return;
    }
    setBusyId(id);
    try {
      await fetch(`/api/land/parcels/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-map-location-dot"></i>
          </div>
          <div>
            <h1>Land Parcels</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Land</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Parcels
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <a href="/api/land/parcels/export" className="btn btn-erp-ghost">
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </a>
          <Link href="/land/parcels/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Land File
          </Link>
        </div>
      </div>

      {/* Stage Rail */}
      <div className="erp-card mb-3">
        <div className="erp-card-body">
          <div className="erp-stage-rail" role="navigation" aria-label="Acquisition pipeline">
            {PIPELINE_STAGES.map((st) => {
              const count = stageCounts[st.value] ?? 0;
              const isSelected = filters.stage === st.value;
              return (
                <Link
                  key={st.value}
                  href={isSelected ? "/land/parcels" : `/land/parcels?stage=${st.value}`}
                  className={`erp-stage-step ${st.tone} ${
                    isSelected ? "is-active" : ""
                  } ${count === 0 ? "is-empty" : ""}`}
                  title={`${st.label} — ${count} parcels`}
                >
                  <span className="erp-stage-icon">
                    <i className={`fa-solid ${st.icon}`}></i>
                  </span>
                  <span className="erp-stage-body">
                    <strong>{count}</strong>
                    <small>{st.label}</small>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Card + Table / Empty State */}
      <div className="erp-card">
        <div className="erp-card-head">
          <form method="GET" action="/land/parcels" className="erp-filterbar">
            <div className="erp-search erp-search-sm">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Land ID, mouza, dag no…"
                aria-label="Search"
              />
            </div>
            <select
              name="stage"
              className="erp-select"
              defaultValue={filters.stage}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Stage"
            >
              <option value="">Any stage</option>
              {ALL_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              name="land_type"
              className="erp-select"
              defaultValue={filters.land_type}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Land type"
            >
              <option value="">Any type</option>
              {LAND_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="district"
              defaultValue={filters.district}
              className="erp-select"
              placeholder="District"
              aria-label="District"
              style={{ maxWidth: 150 }}
            />
            <select
              name="project_id"
              className="erp-select"
              defaultValue={filters.project_id}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Project"
            >
              <option value="">Any project</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              name="view"
              className="erp-select"
              defaultValue={filters.view}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="View"
            >
              <option value="">All files</option>
              <option value="pipeline">In pipeline</option>
              <option value="bank">Owned</option>
            </select>
            {(filters.search ||
              filters.stage ||
              filters.land_type ||
              filters.district ||
              filters.project_id ||
              filters.view) && (
              <Link href="/land/parcels" className="btn btn-erp-ghost btn-sm">
                Reset
              </Link>
            )}
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {parcels.length} {parcels.length === 1 ? "parcel" : "parcels"}
          </span>
        </div>

        {parcels.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-map-location-dot"></i>
            </div>
            <h3>No land files yet</h3>
            <p>
              Open a file the moment a plot is worth looking at — the legal checklist
              starts with it.
            </p>
            <Link href="/land/parcels/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Land File
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Land ID</th>
                    <th>Working Name &amp; Mouza</th>
                    <th>Type</th>
                    <th className="text-end">Area</th>
                    <th>Stage</th>
                    <th className="text-end">Book Value</th>
                    <th>Project</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parcels.map((p) => {
                    const st = getStageMeta(p.stage);
                    return (
                      <tr key={p.id}>
                        <td className="erp-cell-strong">
                          <Link href={`/land/parcels/${p.id}`} className="text-decoration-none">
                            {p.code}
                          </Link>
                        </td>
                        <td>
                          <Link
                            href={`/land/parcels/${p.id}`}
                            className="erp-cell-strong d-block text-decoration-none"
                          >
                            {p.title || `${p.mouza} Parcel`}
                          </Link>
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {p.mouza}
                            {p.jlNo ? ` · JL ${p.jlNo}` : ""} &middot; {p.district}
                          </span>
                        </td>
                        <td>{getLabel(LAND_TYPES, p.landType)}</td>
                        <td className="text-end">
                          <span className="erp-cell-strong d-block">
                            {p.areaValue} {p.areaUnit}
                          </span>
                          <span className="text-muted" style={{ fontSize: 11.5 }}>
                            {p.areaSqft.toLocaleString()} sft ({sqftToKatha(p.areaSqft).toFixed(2)} katha)
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            style={{ minWidth: 165 }}
                            value={p.stage}
                            disabled={busyId === p.id}
                            onChange={(e) => handleStageChange(p.id, e.target.value)}
                            aria-label={`Stage for ${p.code}`}
                          >
                            {ALL_STAGES.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <span className={`erp-pill ${st.pillClass} mt-1 d-inline-block`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="text-end erp-cell-strong">
                          ৳ {formatMoney(p.bookValue)}
                        </td>
                        <td>{p.project?.name ?? <span className="text-muted">Unallocated</span>}</td>
                        <td className="text-end text-nowrap">
                          <Link
                            href={`/land/parcels/${p.id}`}
                            className="btn btn-erp-ghost btn-sm me-1"
                            title="Open Dossier"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </Link>
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            disabled={busyId === p.id}
                            onClick={() => handleDelete(p.id, p.code)}
                          >
                            <i className="fa-solid fa-trash"></i>
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
    </div>
  );
}
