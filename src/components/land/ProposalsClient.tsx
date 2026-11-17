"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PROPOSAL_STATUSES, formatMoney, getLabel, sqftToKatha } from "@/lib/land";

export interface ProposalRow {
  id: number;
  code: string;
  parcelId: number;
  proposalDate: string;
  ratePerKatha: number;
  totalValue: number;
  status: string;
  remarks: string | null;
  parcel: {
    id: number;
    code: string;
    title: string | null;
    mouza: string;
    areaSqft: number;
  };
}

export interface ParcelOption {
  id: number;
  code: string;
  title: string | null;
  mouza: string;
  areaSqft: number;
}

export default function ProposalsClient({
  proposals,
  parcels,
  filters,
}: {
  proposals: ProposalRow[];
  parcels: ParcelOption[];
  filters: { from: string; to: string; search: string; status: string };
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [parcelId, setParcelId] = useState(parcels[0] ? String(parcels[0].id) : "");
  const [proposalDate, setProposalDate] = useState("2026-11-16");
  const [ratePerKatha, setRatePerKatha] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [status, setStatus] = useState("submitted");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  function handleRateChange(nextRate: string) {
    setRatePerKatha(nextRate);
    const selected = parcels.find((p) => String(p.id) === parcelId);
    const r = Number(nextRate);
    if (selected && Number.isFinite(r) && r > 0) {
      const katha = sqftToKatha(selected.areaSqft);
      setTotalValue(String(Math.round(r * katha)));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!parcelId || !totalValue || Number(totalValue) <= 0) {
      setError("Please select a Land File and enter a positive Total Value.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/land/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelId: Number(parcelId),
          proposalDate,
          ratePerKatha: Number(ratePerKatha || 0),
          totalValue: Number(totalValue),
          status,
          remarks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create proposal.");
        setSaving(false);
        return;
      }
      setModalOpen(false);
      setRatePerKatha("");
      setTotalValue("");
      setRemarks("");
      setSaving(false);
      router.refresh();
    } catch {
      setError("Network error while saving proposal.");
      setSaving(false);
    }
  }

  async function updateStatus(id: number, nextStatus: string) {
    setBusyId(id);
    try {
      await fetch(`/api/land/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this proposal?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/land/proposals/${id}`, { method: "DELETE" });
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
            <i className="fa-solid fa-file-invoice-dollar"></i>
          </div>
          <div>
            <h1>Acquisition Proposals</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Land</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Proposals
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <a href="/api/land/proposals/export" className="btn btn-erp-ghost">
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </a>
          <button
            type="button"
            className="btn btn-erp"
            onClick={() => setModalOpen(true)}
            disabled={parcels.length === 0}
            title={
              parcels.length === 0
                ? "Create a land file first before raising a proposal"
                : "Raise acquisition proposal"
            }
          >
            <i className="fa-solid fa-plus me-2"></i>Raise Proposal
          </button>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-card-head">
          <form method="GET" action="/land/proposals" className="erp-filterbar">
            <div className="erp-daterange" aria-label="Proposal date range">
              <input
                type="date"
                name="from"
                defaultValue={filters.from}
                className="erp-select"
                onChange={(e) => e.currentTarget.form?.submit()}
                aria-label="From"
              />
              <span>–</span>
              <input
                type="date"
                name="to"
                defaultValue={filters.to}
                className="erp-select"
                onChange={(e) => e.currentTarget.form?.submit()}
                aria-label="To"
              />
            </div>
            <div className="erp-search erp-search-sm">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Proposal or land…"
                aria-label="Search"
              />
            </div>
            <select
              name="status"
              className="erp-select"
              defaultValue={filters.status}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Status"
            >
              <option value="">Any status</option>
              {PROPOSAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {(filters.from || filters.to || filters.search || filters.status) && (
              <Link href="/land/proposals" className="btn btn-erp-ghost btn-sm">
                Reset
              </Link>
            )}
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {proposals.length} {proposals.length === 1 ? "proposal" : "proposals"}
          </span>
        </div>

        {proposals.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <h3>No proposals raised</h3>
            <p>A proposal is raised from a land file once its valuation is final.</p>
            {parcels.length > 0 && (
              <button
                type="button"
                className="btn btn-erp"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-plus me-2"></i>Raise Proposal
              </button>
            )}
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Proposal</th>
                    <th>Land File</th>
                    <th>Date</th>
                    <th className="text-end">Rate / Katha</th>
                    <th className="text-end">Total Value</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((pr) => (
                    <tr key={pr.id}>
                      <td className="erp-cell-strong">{pr.code}</td>
                      <td>
                        <Link
                          href={`/land/parcels/${pr.parcel.id}`}
                          className="erp-cell-strong d-block text-decoration-none"
                        >
                          {pr.parcel.code} &mdash; {pr.parcel.title || pr.parcel.mouza}
                        </Link>
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {sqftToKatha(pr.parcel.areaSqft).toFixed(2)} katha
                        </span>
                      </td>
                      <td>{pr.proposalDate}</td>
                      <td className="text-end">৳ {formatMoney(pr.ratePerKatha)}</td>
                      <td className="text-end erp-cell-strong">
                        ৳ {formatMoney(pr.totalValue)}
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={pr.status}
                          disabled={busyId === pr.id}
                          onChange={(e) => updateStatus(pr.id, e.target.value)}
                          style={{ minWidth: 155 }}
                        >
                          {PROPOSAL_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-end text-nowrap">
                        {pr.status !== "approved" && (
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm me-1 text-success"
                            title="Approve proposal"
                            disabled={busyId === pr.id}
                            onClick={() => updateStatus(pr.id, "approved")}
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          disabled={busyId === pr.id}
                          onClick={() => handleDelete(pr.id)}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Raise Proposal Modal */}
      {modalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleSubmit} className="erp-form" noValidate>
                  <div className="modal-header">
                    <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>
                      <i className="fa-solid fa-file-invoice-dollar me-2 text-muted"></i>
                      Raise Acquisition Proposal
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setModalOpen(false)}
                    />
                  </div>
                  <div className="modal-body">
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    <div className="erp-field">
                      <label className="form-label">
                        Land File <span className="erp-required">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={parcelId}
                        onChange={(e) => setParcelId(e.target.value)}
                        required
                      >
                        {parcels.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.code} — {p.title || p.mouza} (
                            {sqftToKatha(p.areaSqft).toFixed(2)} katha)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">
                            Proposal Date <span className="erp-required">*</span>
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            value={proposalDate}
                            onChange={(e) => setProposalDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">Status</label>
                          <select
                            className="form-select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                          >
                            {PROPOSAL_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">Rate per Katha</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-control"
                            value={ratePerKatha}
                            onChange={(e) => handleRateChange(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">
                            Total Value <span className="erp-required">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-control"
                            value={totalValue}
                            onChange={(e) => setTotalValue(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="erp-field mb-0">
                      <label className="form-label">Remarks</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-erp" disabled={saving}>
                      {saving ? "Saving…" : "Submit Proposal"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
