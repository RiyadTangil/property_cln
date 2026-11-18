"use client";

import Link from "next/link";
import { useState } from "react";
import { downloadCsv } from "@/lib/csv-client";
import { ContractorsSubmenu } from "./ContractorsSubmenu";

interface WorkOrderRow {
  id: number;
  code: string;
  title: string;
  orderDate: string;
  engagementType: string;
  contractValue: number;
  status: string;
  projectId?: number | null;
  contractor: { id: number; code: string; name: string };
}

const DEFAULT_PROJECTS = [
  { id: 2, code: "PRJ-2026-002", name: "Green Valley" },
  { id: 1, code: "PRJ-2026-001", name: "South Breeze Tower" },
];

export function ContractorWorkOrdersClient({
  mode,
  workOrders,
  contractors = [],
  projects = DEFAULT_PROJECTS,
}: {
  mode: "contracts" | "work-orders";
  workOrders: WorkOrderRow[];
  contractors?: { id: number; name: string }[];
  projects?: { id: number; code: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [contractorFilter, setContractorFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const contractorOptions =
    contractors.length > 0
      ? contractors
      : Array.from(
          new Map(workOrders.map((w) => [w.contractor.id, { id: w.contractor.id, name: w.contractor.name }])).values()
        );

  const projectOptions = projects.length > 0 ? projects : DEFAULT_PROJECTS;

  const filtered = workOrders.filter((w) => {
    if (contractorFilter && String(w.contractor.id) !== contractorFilter) return false;
    if (projectFilter && String(w.projectId ?? "") !== projectFilter) return false;
    if (statusFilter && w.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!w.title.toLowerCase().includes(q) && !w.code.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalVal = filtered.reduce((s, w) => s + w.contractValue, 0);
  const openCount = filtered.filter((w) => !["completed", "closed", "cancelled"].includes(w.status)).length;
  const draftCount = filtered.filter((w) => w.status === "draft").length;

  if (mode === "contracts") {
    return (
      <div className="container ">
        <ContractorsSubmenu />

        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-file-contract" />
            </div>
            <div>
              <h1>Contracts</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/contractors">Contractors</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Contracts
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() =>
                downloadCsv(
                  "contracts.csv",
                  ["Code", "Title", "Contractor", "Date", "Value", "Status"],
                  filtered.map((w) => [w.code, w.title, w.contractor.name, w.orderDate, w.contractValue, w.status])
                )
              }
            >
              <i className="fa-solid fa-file-excel me-2" />
              Export
            </button>
          </div>
        </div>

        <div className="erp-card mt-3">
          <div className="erp-card-body">
            <form
              method="GET"
              className="erp-filterbar mb-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-field mb-0">
                <input
                  type="search"
                  name="search"
                  className="form-control"
                  placeholder="Code or title…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="erp-field mb-0">
                <select
                  name="status"
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Any status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button type="submit" className="btn btn-erp-ghost">
                <i className="fa-solid fa-filter me-1" />
                Filter
              </button>
              <Link
                href="/contractors/contracts"
                className="btn btn-erp-ghost"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                }}
              >
                Clear
              </Link>
            </form>

            {filtered.length === 0 ? (
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-file-contract" />
                </div>
                <h3>No contracts found</h3>
                <p>Assign a contractor to a project from their page to open one.</p>
              </div>
            ) : (
              <div className="erp-table-wrap">
                <table className="table erp-table mb-0">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Title</th>
                      <th>Contractor</th>
                      <th>Engagement</th>
                      <th>Order Date</th>
                      <th className="text-end">Contract Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((w) => (
                      <tr key={w.id}>
                        <td>
                          <code>{w.code}</code>
                        </td>
                        <td className="erp-cell-strong">{w.title}</td>
                        <td>{w.contractor.name}</td>
                        <td className="text-capitalize">{w.engagementType.replace(/_/g, " ")}</td>
                        <td>{w.orderDate}</td>
                        <td className="text-end">{w.contractValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>
                          <span className="erp-pill is-booked text-capitalize">
                            {w.status.replace(/_/g, " ")}
                          </span>
                        </td>
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

  return (
    <div className="container ">
      <ContractorsSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-file-signature" />
          </div>
          <div>
            <h1>Work Orders</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/contractors">Contractors</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Work Orders
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/contractors/work-orders/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2" />
            New Work Order
          </Link>
        </div>
      </div>

      <div className="erp-sale-strip">
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Work orders</span>
          <strong>{filtered.length}</strong>
          <span className="erp-sale-stat-foot">{openCount} open</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Drafts</span>
          <strong className="">{draftCount}</strong>
          <span className="erp-sale-stat-foot">Not yet in force — nothing can be billed</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Contract value</span>
          <strong>{totalVal.toFixed(2)}</strong>
          <span className="erp-sale-stat-foot">Original, before variations</span>
        </div>
      </div>

      <div className="erp-card mt-3">
        <div className="erp-card-body">
          <form
            method="GET"
            className="erp-filterbar mb-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-field mb-0">
              <input
                type="search"
                name="search"
                className="form-control"
                placeholder="Number or title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="erp-field mb-0">
              <select
                name="contractor_id"
                className="form-select"
                value={contractorFilter}
                onChange={(e) => setContractorFilter(e.target.value)}
              >
                <option value="">Any contractor</option>
                {contractorOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="erp-field mb-0">
              <select
                name="project_id"
                className="form-select"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="">Any project</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="erp-field mb-0">
              <select
                name="status"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Any status</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button type="submit" className="btn btn-erp-ghost">
              <i className="fa-solid fa-filter me-1" />
              Filter
            </button>
          </form>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-file-signature" />
              </div>
              <h3>No work orders yet</h3>
              <p>A work order is the contract a contractor&apos;s bills are measured against.</p>
            </div>
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table mb-0">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Contractor</th>
                    <th>Type</th>
                    <th>Order Date</th>
                    <th className="text-end">Contract Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <code>{w.code}</code>
                      </td>
                      <td className="erp-cell-strong">{w.title}</td>
                      <td>{w.contractor.name}</td>
                      <td className="text-capitalize">{w.engagementType.replace(/_/g, " ")}</td>
                      <td>{w.orderDate}</td>
                      <td className="text-end">
                        {w.contractValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td>
                        <span className="erp-pill is-booked text-capitalize">
                          {w.status.replace(/_/g, " ")}
                        </span>
                      </td>
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
