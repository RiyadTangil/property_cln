import React from "react";
import Link from "next/link";
import { findNavMeta } from "@/lib/navigation";
import { CoreService } from "@/server/services/core.service";

export const dynamic = "force-dynamic";

export default async function ModuleCatchAllPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const path = "/" + (params.slug ?? []).join("/");
  const { group, item } = findNavMeta(path);

  const title =
    item?.label ??
    (params.slug?.[params.slug.length - 1] || "Module")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const groupLabel = group?.label ?? "ERP";
  const iconClass = group?.icon ?? "fa-solid fa-layer-group";

  // If user clicks /projects/projects or /projects/projects/[id], show real seeded projects
  const isProjectsList = path === "/projects/projects";
  const projects = await CoreService.getCatchAllProjects(isProjectsList);

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className={iconClass}></i>
          </div>
          <div>
            <h1>{title}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">{groupLabel}</li>
                <li className="breadcrumb-item active" aria-current="page">
                  {title}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/dashboard" className="btn btn-erp-ghost">
            <i className="fa-solid fa-gauge-high me-2"></i>Executive Dashboard
          </Link>
          <Link href="/land/parcels" className="btn btn-erp">
            <i className="fa-solid fa-map-location-dot me-2"></i>Land Module
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-card-head">
          <div className="erp-filterbar">
            <div className="erp-search erp-search-sm">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input type="search" placeholder={`Search ${title.toLowerCase()}…`} />
            </div>
            <select className="erp-select" defaultValue="">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <span className="erp-pill is-booked">Phase 1 Shell Ready</span>
        </div>

        {isProjectsList && projects.length > 0 ? (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Project Name</th>
                    <th>Location</th>
                    <th>Phase</th>
                    <th className="text-end">Units Sold</th>
                    <th className="text-end">Completion</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td className="erp-cell-strong">{p.code}</td>
                      <td className="erp-cell-strong">{p.name}</td>
                      <td>{p.location}</td>
                      <td>{p.phase}</td>
                      <td className="text-end">
                        {p.soldUnits} / {p.totalUnits}
                      </td>
                      <td className="text-end">{p.completionPct}%</td>
                      <td>
                        <span
                          className={`erp-pill ${
                            p.status === "Active"
                              ? "is-available"
                              : p.status === "Delayed"
                              ? "is-hold"
                              : "is-neutral"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className={iconClass}></i>
            </div>
            <h3>{title}</h3>
            <p>
              This route (<code>{path}</code>) is wired into the {groupLabel} module
              shell. Phase 1 includes full database CRUD for Authentication,
              Executive Dashboard, and the complete Land Acquisition &amp; Land Bank
              module.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <Link href="/land/parcels" className="btn btn-erp">
                Open Land Parcels
              </Link>
              <Link href="/dashboard" className="btn btn-erp-ghost">
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
