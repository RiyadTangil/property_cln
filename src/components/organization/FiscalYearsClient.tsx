"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FISCAL_STATUSES } from "@/lib/tier0";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpPageHeader,
  ErpPill,
  ErpTableCard,
  type ErpPillTone,
} from "@/components/ui";

export interface FiscalYearRow {
  id: number;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  periodCadence: string;
  hasAdjustmentPeriod: boolean;
  isCurrent: boolean;
  status: string;
  notes: string | null;
}

const STATUS_TONE: Record<string, ErpPillTone> = {
  draft: "booked",
  open: "available",
  closed: "neutral",
  locked: "overdue",
};

export default function FiscalYearsClient({
  fiscalYears,
  filters,
}: {
  fiscalYears: FiscalYearRow[];
  filters: { search: string; status: string };
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<FiscalYearRow | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function updateYear(id: number, patch: Record<string, unknown>) {
    setBusyId(id);
    try {
      await fetch(`/api/organization/fiscal-years/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await fetch(`/api/organization/fiscal-years/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-calendar-days"
        title="Fiscal Years"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Organization" },
          { label: "Fiscal Years" },
        ]}
        actions={
          <Link href="/organization/fiscal-years/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Fiscal Year
          </Link>
        }
      />

      <ErpTableCard
        toolbar={
          <form
            method="GET"
            action="/organization/fiscal-years"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search name or code…"
                aria-label="Search fiscal years"
              />
            </div>
            <select
              name="status"
              className="form-select erp-select"
              aria-label="Status filter"
              defaultValue={filters.status}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">All statuses</option>
              {FISCAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
            {(filters.search || filters.status) && (
              <Link href="/organization/fiscal-years" className="btn btn-erp-ghost">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>
        }
        countText={`${fiscalYears.length} ${fiscalYears.length === 1 ? "year" : "years"}`}
        isEmpty={fiscalYears.length === 0}
        emptyState={
          <ErpEmptyState
            icon="fa-solid fa-calendar-days"
            title="No fiscal years match your filters"
            description="Try a different search term or clear the filters."
            action={
              filters.search || filters.status ? (
                <Link href="/organization/fiscal-years" className="btn btn-erp-ghost">
                  Clear filters
                </Link>
              ) : (
                <Link href="/organization/fiscal-years/create" className="btn btn-erp">
                  <i className="fa-solid fa-plus me-2"></i>New Fiscal Year
                </Link>
              )
            }
          />
        }
      >
        <table className="table erp-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Fiscal Year</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Periods</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fiscalYears.map((fy) => (
              <tr key={fy.id}>
                <td className="erp-cell-strong">{fy.code}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <span className="erp-cell-strong">{fy.name}</span>
                    {fy.isCurrent && <ErpPill tone="sold">Current</ErpPill>}
                  </div>
                  {fy.notes && <span className="erp-identity-meta d-block">{fy.notes}</span>}
                </td>
                <td className="text-nowrap">{fy.startDate}</td>
                <td className="text-nowrap">{fy.endDate}</td>
                <td>
                  <span className="text-capitalize">{fy.periodCadence}</span>
                  {fy.hasAdjustmentPeriod && (
                    <span className="erp-identity-meta d-block">+ Adjustment period</span>
                  )}
                </td>
                <td>
                  <ErpPill tone={STATUS_TONE[fy.status] ?? "neutral"}>
                    {FISCAL_STATUSES.find((s) => s.value === fy.status)?.label ?? fy.status}
                  </ErpPill>
                </td>
                <td className="text-end text-nowrap">
                  <div className="d-inline-flex gap-1">
                    {!fy.isCurrent && (
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        disabled={busyId === fy.id}
                        onClick={() => updateYear(fy.id, { isCurrent: true })}
                      >
                        Set Current
                      </button>
                    )}
                    {fy.status !== "closed" ? (
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        disabled={busyId === fy.id}
                        onClick={() => updateYear(fy.id, { status: "closed" })}
                      >
                        Close
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        disabled={busyId === fy.id}
                        onClick={() => updateYear(fy.id, { status: "open" })}
                      >
                        Reopen
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm text-danger"
                      onClick={() => setDeleteTarget(fy)}
                      title="Delete"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ErpTableCard>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete fiscal year?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> ({deleteTarget.code}) will be removed from
              active use.
            </>
          )
        }
        busy={busyId === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
