"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LAND_TYPES, formatMoney, getLabel, getStageMeta, sqftToKatha } from "@/lib/land";

export interface BankParcelRow {
  id: number;
  code: string;
  title: string | null;
  landType: string;
  stage: string;
  mouza: string;
  district: string;
  areaSqft: number;
  bookValue: number;
  projectId: number | null;
  project: { id: number; name: string } | null;
}

export default function LandBankClient({
  parcels,
  stats,
  projects,
  filters,
}: {
  parcels: BankParcelRow[];
  stats: {
    ownedCount: number;
    totalKatha: number;
    totalSqft: number;
    totalBookValue: number;
    unallocatedCount: number;
  };
  projects: { id: number; name: string }[];
  filters: {
    search: string;
    land_type: string;
    district: string;
    project_id: string;
  };
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);

  async function allocateProject(parcelId: number, projectIdVal: string) {
    setBusyId(parcelId);
    try {
      await fetch(`/api/land/parcels/${parcelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectIdVal ? Number(projectIdVal) : null,
        }),
      });
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
            <i className="fa-solid fa-landmark"></i>
          </div>
          <div>
            <h1>Land Bank</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Land</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Land Bank
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <a href="/api/land/bank/export" className="btn btn-erp-ghost">
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </a>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="erp-card mb-3">
        <div className="erp-card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="erp-stat">
                <span className="erp-stat-label">Parcels Owned</span>
                <strong className="erp-stat-value">{stats.ownedCount}</strong>
              </div>
            </div>
            <div className="col-md-3">
              <div className="erp-stat">
                <span className="erp-stat-label">Total Land Held</span>
                <strong className="erp-stat-value">
                  {stats.totalKatha.toFixed(2)} katha
                </strong>
                <small className="text-muted d-block">
                  {stats.totalSqft.toLocaleString()} sft
                </small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="erp-stat">
                <span className="erp-stat-label">Book Value</span>
                <strong className="erp-stat-value">
                  {formatMoney(stats.totalBookValue)}
                </strong>
                <small className="text-muted d-block">acquisition spend</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="erp-stat">
                <span className="erp-stat-label">Unallocated</span>
                <strong className="erp-stat-value">{stats.unallocatedCount}</strong>
                <small className="text-muted d-block">
                  not yet assigned to a project
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-card-head">
          <form method="GET" action="/land/bank" className="erp-filterbar">
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
              <option value="">Any allocation</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
            {(filters.search ||
              filters.land_type ||
              filters.district ||
              filters.project_id) && (
              <Link href="/land/bank" className="btn btn-erp-ghost btn-sm">
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
              <i className="fa-solid fa-landmark"></i>
            </div>
            <h3>The land bank is empty</h3>
            <p>
              Land enters here once its mutation completes — when the record room
              names the company, not before.
            </p>
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
                    <th className="text-end">Area (Katha)</th>
                    <th className="text-end">Book Value</th>
                    <th>Stage</th>
                    <th>Project Allocation</th>
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
                            {p.mouza} &middot; {p.district}
                          </span>
                        </td>
                        <td>{getLabel(LAND_TYPES, p.landType)}</td>
                        <td className="text-end">
                          <span className="erp-cell-strong d-block">
                            {sqftToKatha(p.areaSqft).toFixed(2)} katha
                          </span>
                          <span className="text-muted" style={{ fontSize: 11.5 }}>
                            {p.areaSqft.toLocaleString()} sft
                          </span>
                        </td>
                        <td className="text-end erp-cell-strong">
                          ৳ {formatMoney(p.bookValue)}
                        </td>
                        <td>
                          <span className={`erp-pill ${st.pillClass}`}>{st.label}</span>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={p.projectId ? String(p.projectId) : ""}
                            disabled={busyId === p.id}
                            onChange={(e) => allocateProject(p.id, e.target.value)}
                            style={{ minWidth: 185 }}
                          >
                            <option value="">Unallocated</option>
                            {projects.map((pr) => (
                              <option key={pr.id} value={String(pr.id)}>
                                {pr.name}
                              </option>
                            ))}
                          </select>
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
