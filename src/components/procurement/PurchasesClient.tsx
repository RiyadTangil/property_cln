"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

interface PoRow {
  id: number;
  code: string;
  supplierId: number | null;
  supplier: { id: number; companyName: string } | null;
  orderDate: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdBy: string | null;
}

export function PurchasesClient({
  purchases,
  suppliers,
}: {
  purchases: PoRow[];
  suppliers: { id: number; companyName: string }[];
}) {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");

  const rows = purchases.filter((p) => {
    if (supplierId && String(p.supplierId ?? "") !== supplierId) return false;
    if (status && p.status !== status) return false;
    if (from && p.orderDate < from) return false;
    if (to && p.orderDate > to) return false;
    const q = search.trim().toLowerCase();
    if (q && !`${p.code} ${p.supplier?.companyName ?? ""}`.toLowerCase().includes(q))
      return false;
    return true;
  });

  async function handleDelete(id: number) {
    await fetch(`/api/procurement/purchases/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-cart-flatbed"></i>
          </div>
          <div>
            <h1>Purchases</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Procurement</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Purchases
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
                "purchases.csv",
                ["PO", "Supplier", "Date", "Total", "Paid", "Due", "Status"],
                rows.map((r) => [
                  r.code,
                  r.supplier?.companyName ?? "",
                  r.orderDate,
                  r.totalAmount,
                  r.paidAmount,
                  r.totalAmount - r.paidAmount,
                  r.status,
                ])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </button>
          <Link href="/purchases/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Purchase
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-card-head">
          <form
            method="GET"
            action="/purchases"
            className="erp-filterbar"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-daterange" aria-label="Date range">
              <input
                type="date"
                name="from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="erp-select"
                aria-label="From date"
                title="From"
              />
              <span>–</span>
              <input
                type="date"
                name="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="erp-select"
                aria-label="To date"
                title="To"
              />
            </div>
            <div className="erp-search erp-search-sm">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Code or reference…"
                aria-label="Search"
              />
            </div>
            <select
              name="supplier_id"
              className="erp-select"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              aria-label="Supplier"
            >
              <option value="">All suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName}
                </option>
              ))}
            </select>
            <select
              name="status"
              className="erp-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Status"
            >
              <option value="">Any status</option>
              <option value="draft">Draft</option>
              <option value="ordered">Ordered</option>
              <option value="partially_received">Partially Received</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {rows.length} {rows.length === 1 ? "purchase" : "purchases"}
          </span>
        </div>

        <div className="erp-card-body is-flush">
          <div className="erp-table-wrap">
            <table className="table erp-table">
              <thead>
                <tr>
                  <th>Purchase</th>
                  <th>Supplier</th>
                  <th className="text-end">Total</th>
                  <th className="text-end">Paid</th>
                  <th className="text-end">Due</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="erp-cv-empty">
                      No purchases found.
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => {
                    const due = Math.max(0, p.totalAmount - p.paidAmount);
                    return (
                      <tr key={p.id}>
                        <td className="erp-cell-strong">
                          <Link href={`/purchases/${p.id}`} className="erp-link">
                            {p.code}
                          </Link>
                          <span className="erp-identity-meta d-block">{p.orderDate}</span>
                        </td>
                        <td>{p.supplier?.companyName ?? "—"}</td>
                        <td className="text-end">{p.totalAmount.toFixed(2)}</td>
                        <td className="text-end">{p.paidAmount.toFixed(2)}</td>
                        <td className="text-end ">{due.toFixed(2)}</td>
                        <td>
                          <span className="erp-pill is-neutral">
                            <i className="fa-solid fa-pen-ruler me-1"></i>
                            {p.status === "draft" ? "Draft" : p.status}
                          </span>
                        </td>
                        <td>
                          <span className="erp-created-by">
                            <span className="erp-cell-strong">
                              {p.createdBy ?? "System Administrator"}
                            </span>
                            <span className="erp-identity-meta d-block">{p.orderDate}</span>
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <Link
                            href={`/purchases/${p.id}`}
                            className="btn btn-erp-ghost btn-sm"
                            title="View"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </Link>
                          <Link
                            href={`/purchases/${p.id}/edit`}
                            className="btn btn-erp-ghost btn-sm"
                            title="Edit"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </Link>
                          <form
                            method="POST"
                            action={`/purchases/${p.id}`}
                            className="d-inline"
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleDelete(p.id);
                            }}
                          >
                            <input type="hidden" name="_method" value="DELETE" />
                            <button
                              type="submit"
                              className="btn btn-erp-ghost btn-sm text-danger"
                              title="Delete"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
