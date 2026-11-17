"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getInitials } from "@/lib/tier0";

export interface AuditRow {
  id: number;
  userName: string;
  ipAddress: string;
  event: string;
  recordTitle: string;
  recordType: string;
  fieldsCount: number;
  fieldsList: string;
  whenLabel: string;
  createdAt: string;
}

const EVENT_PILL: Record<string, { cls: string; icon: string }> = {
  created: { cls: "is-available", icon: "fa-plus" },
  updated: { cls: "is-booked", icon: "fa-pen" },
  deleted: { cls: "is-overdue", icon: "fa-trash-can" },
  restored: { cls: "is-available", icon: "fa-rotate-left" },
};

export default function AuditClient({
  logs,
  recordTypes,
  users,
  filters,
}: {
  logs: AuditRow[];
  recordTypes: string[];
  users: string[];
  filters: {
    search: string;
    event: string;
    type: string;
    user_id: string;
    from: string;
    to: string;
  };
}) {
  const [detail, setDetail] = useState<AuditRow | null>(null);
  const hasFilter =
    filters.search ||
    filters.event ||
    filters.type ||
    filters.user_id ||
    filters.from ||
    filters.to;

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <h1>Audit Trail</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Audit Trail
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <a href="/api/settings/audit/export" className="btn btn-erp-ghost">
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </a>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/settings/audit"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search record, URL…"
                aria-label="Search audit trail"
              />
            </div>

            <select
              name="event"
              className="form-select erp-select"
              defaultValue={filters.event}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Event"
            >
              <option value="">All events</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="restored">Restored</option>
            </select>

            <select
              name="type"
              className="form-select erp-select"
              defaultValue={filters.type}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Record type"
            >
              <option value="">All records</option>
              {recordTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              name="user_id"
              className="form-select erp-select"
              defaultValue={filters.user_id}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="User"
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="from"
              className="form-control erp-select"
              defaultValue={filters.from}
              aria-label="From"
              title="From"
            />
            <input
              type="date"
              name="to"
              className="form-control erp-select"
              defaultValue={filters.to}
              aria-label="To"
              title="To"
            />

            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>

            {hasFilter && (
              <Link href="/settings/audit" className="btn btn-erp-ghost">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <h3>No audit entries</h3>
            <p>Changes made across organization, settings, and transactions appear here automatically.</p>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>User</th>
                    <th>Event</th>
                    <th>Record</th>
                    <th>Changes</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => {
                    const ev = EVENT_PILL[row.event] ?? {
                      cls: "is-neutral",
                      icon: "fa-circle-info",
                    };
                    return (
                      <tr key={row.id}>
                        <td className="text-nowrap" style={{ fontSize: "12.5px" }}>
                          {row.createdAt}
                          <small className="d-block text-muted">{row.whenLabel}</small>
                        </td>
                        <td>
                          <div className="erp-identity">
                            <span className="erp-initials">{getInitials(row.userName)}</span>
                            <span>
                              <span className="erp-identity-name">{row.userName}</span>
                              <span className="erp-identity-meta">{row.ipAddress}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`erp-pill text-capitalize ${ev.cls}`}>
                            <i className={`fa-solid ${ev.icon} me-1`}></i>
                            {row.event}
                          </span>
                        </td>
                        <td>
                          <span className="erp-cell-strong">{row.recordTitle}</span>
                          <small className="d-block text-muted">{row.recordType}</small>
                        </td>
                        <td style={{ fontSize: "12.5px" }}>
                          {row.fieldsCount} {row.fieldsCount === 1 ? "field" : "fields"}
                          <small className="d-block text-muted">{row.fieldsList}</small>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm"
                            title="Details"
                            onClick={() => setDetail(row)}
                          >
                            <i className="fa-solid fa-eye"></i>
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

      {detail && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <div className="modal-header">
                  <h5 className="modal-title">Audit Entry #{detail.id}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setDetail(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <dl className="row mb-0 small">
                    <dt className="col-sm-4">User</dt>
                    <dd className="col-sm-8">{detail.userName}</dd>
                    <dt className="col-sm-4">IP Address</dt>
                    <dd className="col-sm-8">{detail.ipAddress}</dd>
                    <dt className="col-sm-4">Event</dt>
                    <dd className="col-sm-8 text-capitalize">{detail.event}</dd>
                    <dt className="col-sm-4">Record</dt>
                    <dd className="col-sm-8">
                      {detail.recordTitle} ({detail.recordType})
                    </dd>
                    <dt className="col-sm-4">Timestamp</dt>
                    <dd className="col-sm-8">{detail.createdAt}</dd>
                    <dt className="col-sm-4">Changed Fields</dt>
                    <dd className="col-sm-8">
                      <code>{detail.fieldsList || "—"}</code>
                    </dd>
                  </dl>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    onClick={() => setDetail(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
