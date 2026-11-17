"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/tier0";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpIdentity,
  ErpPageHeader,
  ErpPill,
  ErpTableCard,
} from "@/components/ui";

export interface CompanyRow {
  id: number;
  code: string;
  name: string;
  registrationNumber: string | null;
  tin: string | null;
  email: string | null;
  currency: string;
  fiscalYear: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function CompaniesClient({
  companies,
  filters,
}: {
  companies: CompanyRow[];
  filters: { search: string; status: string };
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<CompanyRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await fetch(`/api/organization/companies/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-building-columns"
        title="Company"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Organization" },
          { label: "Company" },
        ]}
        actions={
          <Link href="/organization/companies/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Company
          </Link>
        }
      />

      <ErpTableCard
        toolbar={
          <form
            method="GET"
            action="/organization/companies"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search name, code, email, TIN…"
                aria-label="Search companies"
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
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
            {(filters.search || filters.status) && (
              <Link href="/organization/companies" className="btn btn-erp-ghost">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>
        }
        countText={`${companies.length} ${companies.length === 1 ? "company" : "companies"}`}
        isEmpty={companies.length === 0}
        emptyState={
          <ErpEmptyState
            icon="fa-solid fa-building-columns"
            title="No companies found"
            description="Add a legal entity to manage branches, fiscal years, and ledgers."
            action={
              <Link href="/organization/companies/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Company
              </Link>
            }
          />
        }
      >
        <table className="table erp-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Code</th>
              <th>Registration / TIN</th>
              <th>Currency</th>
              <th>Financial Year</th>
              <th>Status</th>
              <th>Created By</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>
                  <ErpIdentity
                    logoUrl={c.isDefault ? "/brand/erp-logo.jpg" : ""}
                    initials={getInitials(c.name)}
                    title={c.name}
                    badge={
                      c.isDefault && (
                        <ErpPill tone="sold" className="ms-1">
                          Default
                        </ErpPill>
                      )
                    }
                    meta={c.email || "No email"}
                  />
                </td>
                <td className="erp-cell-strong">{c.code}</td>
                <td>
                  <span className="d-block">{c.registrationNumber || "—"}</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {c.tin ? `TIN: ${c.tin}` : "No TIN"}
                  </span>
                </td>
                <td className="erp-cell-strong text-nowrap">
                  {c.currency} <span className="text-muted fw-normal">৳</span>
                </td>
                <td className="text-nowrap">{c.fiscalYear}</td>
                <td>
                  <ErpPill tone={c.isActive ? "available" : "neutral"}>
                    {c.isActive ? "Active" : "Inactive"}
                  </ErpPill>
                </td>
                <td>
                  <span className="erp-created-by">
                    <span className="erp-cell-strong">—</span>
                    <span className="erp-identity-meta d-block">{c.createdAt}</span>
                  </span>
                </td>
                <td className="text-end text-nowrap">
                  {!c.isDefault && (
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm text-danger"
                      title="Delete"
                      onClick={() => setDeleteTarget(c)}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ErpTableCard>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete company?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> will be removed from active use.
              Related records are retained and can be restored by an administrator.
            </>
          )
        }
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
