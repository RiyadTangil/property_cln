"use client";

import Link from "next/link";
import { useState } from "react";
import { downloadCsv } from "@/lib/csv-client";

interface DoRow {
  id: number;
  code: string;
  doNumber: string | null;
  brand: string | null;
  liftingPoint: string | null;
  issueDate: string;
  validUntil: string | null;
  status: string;
  supplier: { companyName: string } | null;
}

export function DeliveryOrdersClient({
  orders,
  suppliers,
}: {
  orders: DoRow[];
  suppliers: { id: number; companyName: string }[];
}) {
  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = orders.filter((o) => {
    if (status && o.status !== status) return false;
    if (from && o.issueDate < from) return false;
    if (to && o.issueDate > to) return false;
    if (
      supplierId &&
      o.supplier?.companyName !==
        suppliers.find((s) => String(s.id) === supplierId)?.companyName
    )
      return false;
    const q = search.trim().toLowerCase();
    if (
      q &&
      !`${o.code} ${o.doNumber ?? ""} ${o.brand ?? ""} ${o.liftingPoint ?? ""}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    return true;
  });

  const openCount = orders.filter((o) => o.status === "open").length;

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-truck-ramp-box"></i>
          </div>
          <div>
            <h1>
              Delivery Orders{" "}
              <span className="tw:text-base tw:font-medium tw:text-muted">(DO · ডিও)</span>
            </h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Procurement</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Delivery Orders
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
                "delivery-orders.csv",
                ["Code", "DO No", "Supplier", "Brand", "Issue Date", "Status"],
                rows.map((r) => [
                  r.code,
                  r.doNumber ?? "",
                  r.supplier?.companyName ?? "",
                  r.brand ?? "",
                  r.issueDate,
                  r.status,
                ])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </button>
          <Link href="/procurement/delivery-orders/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New DO
          </Link>
        </div>
      </div>

      <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2 tw:xl:grid-cols-4">
        <Link
          href="/procurement/delivery-orders?status=open"
          onClick={(e) => {
            e.preventDefault();
            setStatus("open");
          }}
          className="tw:flex tw:items-center tw:gap-3 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:p-4 tw:shadow-erp tw:no-underline tw:transition tw:hover:-translate-y-0.5 tw:hover:border-brand"
        >
          <span className="tw:grid tw:h-11 tw:w-11 tw:flex-none tw:place-items-center tw:rounded-xl tw:bg-brand-soft tw:text-brand tw:text-lg">
            <i className="fa-solid fa-file-circle-check"></i>
          </span>
          <span className="tw:min-w-0">
            <span className="tw:block tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-muted">
              Open DOs{" "}
              <span className="tw:font-normal tw:normal-case tw:tracking-normal">
                · চালু ডিও
              </span>
            </span>
            <span className="tw:block tw:truncate tw:text-xl tw:font-bold tw:text-ink">
              {openCount}
            </span>
          </span>
        </Link>
        <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:p-4 tw:shadow-erp tw:no-underline tw:transition">
          <span className="tw:grid tw:h-11 tw:w-11 tw:flex-none tw:place-items-center tw:rounded-xl tw:bg-info-soft tw:text-info tw:text-lg">
            <i className="fa-solid fa-boxes-stacked"></i>
          </span>
          <span className="tw:min-w-0">
            <span className="tw:block tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-muted">
              Balance to Lift{" "}
              <span className="tw:font-normal tw:normal-case tw:tracking-normal">
                · উত্তোলন বাকি
              </span>
            </span>
            <span className="tw:block tw:truncate tw:text-xl tw:font-bold tw:text-ink">
              ৳ 0
            </span>
          </span>
        </div>
        <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:p-4 tw:shadow-erp tw:no-underline tw:transition">
          <span className="tw:grid tw:h-11 tw:w-11 tw:flex-none tw:place-items-center tw:rounded-xl tw:bg-surface-2 tw:text-muted tw:text-lg">
            <i className="fa-solid fa-hourglass-half"></i>
          </span>
          <span className="tw:min-w-0">
            <span className="tw:block tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-muted">
              Expiring in 7 Days{" "}
              <span className="tw:font-normal tw:normal-case tw:tracking-normal">
                · ৭ দিনে মেয়াদ শেষ
              </span>
            </span>
            <span className="tw:block tw:truncate tw:text-xl tw:font-bold tw:text-ink">
              0
            </span>
          </span>
        </div>
        <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:p-4 tw:shadow-erp tw:no-underline tw:transition">
          <span className="tw:grid tw:h-11 tw:w-11 tw:flex-none tw:place-items-center tw:rounded-xl tw:bg-good-soft tw:text-good tw:text-lg">
            <i className="fa-solid fa-truck-moving"></i>
          </span>
          <span className="tw:min-w-0">
            <span className="tw:block tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-muted">
              Lifted This Month{" "}
              <span className="tw:font-normal tw:normal-case tw:tracking-normal">
                · এই মাসে উত্তোলন
              </span>
            </span>
            <span className="tw:block tw:truncate tw:text-xl tw:font-bold tw:text-ink">
              ৳ 0
            </span>
          </span>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-card-head">
          <form
            method="GET"
            action="/procurement/delivery-orders"
            className="tw:grid tw:w-full tw:gap-2 tw:grid-cols-1 tw:md:grid-cols-2 tw:xl:grid-cols-6 tw:items-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-search erp-search-sm tw:xl:col-span-2">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="DO no., dealer, brand, challan or vehicle…"
                aria-label="Search"
              />
            </div>
            <select
              name="supplier_id"
              className="erp-select"
              data-select2
              data-placeholder="Dealer"
              aria-label="Dealer"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value=""></option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName}
                </option>
              ))}
            </select>
            <select
              name="status"
              className="erp-select"
              data-select2
              data-placeholder="Status"
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value=""></option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="partially_lifted">Partially Lifted</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
            <div className="tw:flex tw:gap-2">
              <input
                type="date"
                name="from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="form-control form-control-sm"
                aria-label="From date"
              />
              <input
                type="date"
                name="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="form-control form-control-sm"
                aria-label="To date"
              />
            </div>
            <div className="tw:flex tw:gap-2 tw:justify-end">
              <button type="submit" className="btn btn-erp btn-sm">
                <i className="fa-solid fa-filter me-1"></i>Filter
              </button>
            </div>
          </form>
        </div>

        {rows.length === 0 ? (
          <div className="tw:px-6 tw:py-14 tw:text-center">
            <div className="tw:mx-auto tw:mb-4 tw:grid tw:h-16 tw:w-16 tw:place-items-center tw:rounded-full tw:bg-brand-soft tw:text-brand tw:text-2xl">
              <i className="fa-solid fa-truck-ramp-box"></i>
            </div>
            <h3 className="tw:mb-1 tw:text-lg tw:font-semibold tw:text-ink">
              No delivery orders yet
            </h3>
            <p className="tw:mx-auto tw:max-w-md tw:text-sm tw:text-muted">
              Record a dealer DO for cement, rod or any material you buy in advance and lift
              truck by truck. Each lifting goes straight into stock as a goods receipt.
            </p>
            <Link
              href="/procurement/delivery-orders/create"
              className="btn btn-erp tw:mt-3"
            >
              <i className="fa-solid fa-plus me-2"></i>Record the first DO
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>DO Code</th>
                    <th>Supplier</th>
                    <th>Brand &amp; Lifting Point</th>
                    <th>Issue Date</th>
                    <th>Valid Until</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id}>
                      <td className="erp-cell-strong">
                        {o.code}
                        <span className="erp-identity-meta d-block">
                          {o.doNumber ?? "—"}
                        </span>
                      </td>
                      <td>{o.supplier?.companyName ?? "—"}</td>
                      <td>
                        {o.brand ?? "—"} · {o.liftingPoint ?? "Factory Gate"}
                      </td>
                      <td>{o.issueDate}</td>
                      <td>{o.validUntil ?? "Open"}</td>
                      <td>
                        <span className="erp-pill is-booked">{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
