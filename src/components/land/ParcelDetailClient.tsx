"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ALL_STAGES,
  AGREEMENT_TYPES,
  LAND_TYPES,
  PAYMENT_TYPES,
  PIPELINE_STAGES,
  PROPOSAL_STATUSES,
  formatMoney,
  getLabel,
  getStageMeta,
  sqftToKatha,
} from "@/lib/land";

interface ParcelDetail {
  id: number;
  code: string;
  title: string | null;
  landType: string;
  stage: string;
  mouza: string;
  jlNo: string | null;
  division: string | null;
  district: string;
  upazila: string | null;
  areaValue: number;
  areaUnit: string;
  areaSqft: number;
  boundaryNorth: string | null;
  boundarySouth: string | null;
  boundaryEast: string | null;
  boundaryWest: string | null;
  source: string | null;
  brokerName: string | null;
  remarks: string | null;
  bookValue: number;
  projectId: number | null;
  project: { id: number; name: string } | null;
  proposals: {
    id: number;
    code: string;
    proposalDate: string;
    ratePerKatha: number;
    totalValue: number;
    status: string;
  }[];
  agreements: {
    id: number;
    code: string;
    type: string;
    status: string;
    agreementDate: string;
    agreedPrice: number;
    advanceAmount: number;
    owner: { id: number; name: string } | null;
  }[];
  payments: {
    id: number;
    voucherNo: string;
    type: string;
    paymentDate: string;
    grossAmount: number;
    netAmount: number;
    method: string;
    status: string;
    owner: { id: number; name: string } | null;
  }[];
}

export default function ParcelDetailClient({
  parcel,
  projects,
}: {
  parcel: ParcelDetail;
  projects: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const stageMeta = getStageMeta(parcel.stage);
  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.value === parcel.stage);
  const nextStage =
    currentIdx >= 0 && currentIdx < PIPELINE_STAGES.length - 1
      ? PIPELINE_STAGES[currentIdx + 1]
      : null;

  async function updateParcel(patch: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch(`/api/land/parcels/${parcel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      router.refresh();
    } finally {
      setBusy(false);
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
            <h1>
              {parcel.title || `${parcel.mouza} Parcel`}{" "}
              <small className="text-muted fs-6">({parcel.code})</small>
            </h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Land</li>
                <li className="breadcrumb-item">
                  <Link href="/land/parcels">Parcels</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {parcel.code}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/land/parcels" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
          {nextStage && (
            <button
              type="button"
              className="btn btn-erp"
              disabled={busy}
              onClick={() => updateParcel({ stage: nextStage.value })}
            >
              <i className="fa-solid fa-forward-step me-2"></i>
              Advance to {nextStage.label}
            </button>
          )}
        </div>
      </div>

      {/* Key Stats */}
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="erp-stat">
            <span className="erp-stat-label">Current Stage</span>
            <strong className="erp-stat-value" style={{ fontSize: 18 }}>
              {stageMeta.label}
            </strong>
            <div className="mt-2">
              <select
                className="form-select form-select-sm"
                value={parcel.stage}
                disabled={busy}
                onChange={(e) => updateParcel({ stage: e.target.value })}
              >
                {ALL_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="erp-stat">
            <span className="erp-stat-label">Area</span>
            <strong className="erp-stat-value">
              {parcel.areaValue} {parcel.areaUnit}
            </strong>
            <small className="text-muted d-block">
              {parcel.areaSqft.toLocaleString()} sft &middot;{" "}
              {sqftToKatha(parcel.areaSqft).toFixed(2)} katha
            </small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="erp-stat">
            <span className="erp-stat-label">Book Value (Paid)</span>
            <strong className="erp-stat-value">৳ {formatMoney(parcel.bookValue)}</strong>
            <small className="text-muted d-block">
              {parcel.payments.length} posted/draft vouchers
            </small>
          </div>
        </div>

        <div className="col-md-3">
          <div className="erp-stat">
            <span className="erp-stat-label">Project Allocation</span>
            <select
              className="form-select form-select-sm mt-2"
              value={parcel.projectId ? String(parcel.projectId) : ""}
              disabled={busy}
              onChange={(e) =>
                updateParcel({
                  projectId: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">Unallocated</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <div className="erp-card h-100">
            <div className="erp-card-head">
              <h2>Parcel Summary</h2>
              <span className="erp-pill is-neutral">
                {getLabel(LAND_TYPES, parcel.landType)}
              </span>
            </div>
            <div className="erp-card-body">
              <div className="row g-2" style={{ fontSize: 13.5 }}>
                <div className="col-6">
                  <span className="text-muted d-block">Mouza / JL No</span>
                  <strong>
                    {parcel.mouza} {parcel.jlNo ? `(JL ${parcel.jlNo})` : ""}
                  </strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">District / Upazila</span>
                  <strong>
                    {parcel.district}
                    {parcel.upazila ? `, ${parcel.upazila}` : ""}
                  </strong>
                </div>
                <div className="col-6 mt-2">
                  <span className="text-muted d-block">Boundaries (N/S)</span>
                  <strong>
                    {parcel.boundaryNorth || "—"} / {parcel.boundarySouth || "—"}
                  </strong>
                </div>
                <div className="col-6 mt-2">
                  <span className="text-muted d-block">Boundaries (E/W)</span>
                  <strong>
                    {parcel.boundaryEast || "—"} / {parcel.boundaryWest || "—"}
                  </strong>
                </div>
                <div className="col-6 mt-2">
                  <span className="text-muted d-block">Source</span>
                  <strong>{parcel.source || "Not recorded"}</strong>
                </div>
                <div className="col-6 mt-2">
                  <span className="text-muted d-block">Broker</span>
                  <strong>{parcel.brokerName || "—"}</strong>
                </div>
                {parcel.remarks && (
                  <div className="col-12 mt-2">
                    <span className="text-muted d-block">Remarks</span>
                    <span>{parcel.remarks}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Linked Records Quick Actions */}
        <div className="col-lg-6">
          <div className="erp-card h-100">
            <div className="erp-card-head">
              <h2>Acquisition Activity</h2>
              <div className="d-flex gap-2">
                <Link href="/land/proposals" className="btn btn-erp-ghost btn-sm">
                  Proposals ({parcel.proposals.length})
                </Link>
                <Link href="/land/agreements" className="btn btn-erp-ghost btn-sm">
                  Agreements ({parcel.agreements.length})
                </Link>
                <Link href="/land/payments" className="btn btn-erp-ghost btn-sm">
                  Payments ({parcel.payments.length})
                </Link>
              </div>
            </div>
            <div className="erp-card-body">
              <h6 className="fw-semibold mb-2">Proposals</h6>
              {parcel.proposals.length === 0 ? (
                <p className="text-muted small mb-3">
                  No acquisition proposals raised yet.{" "}
                  <Link href="/land/proposals">Raise proposal &rarr;</Link>
                </p>
              ) : (
                <ul className="list-unstyled small mb-3">
                  {parcel.proposals.map((pr) => (
                    <li key={pr.id} className="mb-1">
                      <strong>{pr.code}</strong> &middot; {pr.proposalDate} &middot; ৳{" "}
                      {formatMoney(pr.totalValue)} (
                      {getLabel(PROPOSAL_STATUSES, pr.status)})
                    </li>
                  ))}
                </ul>
              )}

              <h6 className="fw-semibold mb-2">Agreements</h6>
              {parcel.agreements.length === 0 ? (
                <p className="text-muted small mb-3">
                  No agreements signed yet.{" "}
                  <Link href="/land/agreements">Draft agreement &rarr;</Link>
                </p>
              ) : (
                <ul className="list-unstyled small mb-3">
                  {parcel.agreements.map((ag) => (
                    <li key={ag.id} className="mb-1">
                      <strong>{ag.code}</strong> &middot; {getLabel(AGREEMENT_TYPES, ag.type)} &middot; ৳{" "}
                      {formatMoney(ag.agreedPrice)} ({ag.owner?.name || "No owner linked"})
                    </li>
                  ))}
                </ul>
              )}

              <h6 className="fw-semibold mb-2">Payments</h6>
              {parcel.payments.length === 0 ? (
                <p className="text-muted small mb-0">
                  No vouchers posted yet.{" "}
                  <Link href="/land/payments">New payment voucher &rarr;</Link>
                </p>
              ) : (
                <ul className="list-unstyled small mb-0">
                  {parcel.payments.map((pm) => (
                    <li key={pm.id} className="mb-1">
                      <strong>{pm.voucherNo}</strong> &middot; {getLabel(PAYMENT_TYPES, pm.type)} &middot; ৳{" "}
                      {formatMoney(pm.grossAmount)} ({pm.status})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
