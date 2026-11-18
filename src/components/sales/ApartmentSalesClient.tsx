"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

export interface SaleItem {
  id: number;
  code: string;
  projectId: number | null;
  customerId: number | null;
  salesPersonId: number | null;
  saleDate: string;
  agreementDate: string | null;
  expectedHandoverDate: string | null;
  paymentPlanType: string;
  otherCharges: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paymentStatus: string;
  terms: string | null;
  note: string | null;
}

export interface SalesTargetItem {
  id: number;
  employeeId: number | null;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
  targetType: string;
  targetAmount: number;
  targetUnits: number;
  achievedAmount: number;
  status: string;
  note: string | null;
}

export interface ProjectRef {
  id: number;
  code: string;
  name: string;
}

export interface CustomerRef {
  id: number;
  code: string;
  firstName: string | null;
  lastName: string | null;
  organisationName: string | null;
  mobile: string | null;
}

export interface EmployeeRef {
  id: number;
  code: string;
  firstName: string;
  lastName: string | null;
  departmentName: string | null;
}

export interface DepartmentRef {
  id: number;
  code: string;
  name: string;
}

export interface UnitRef {
  id: number;
  unitNumber: string;
  unitType: string;
  price: number | null;
  status: string;
}

interface ApartmentSalesClientProps {
  view: "sales" | "sales_create" | "sales_targets";
  sales?: SaleItem[];
  targets?: SalesTargetItem[];
  projects?: ProjectRef[];
  customers?: CustomerRef[];
  employees?: EmployeeRef[];
  departments?: DepartmentRef[];
  units?: UnitRef[];
}

export default function ApartmentSalesClient({
  view,
  sales = [],
  targets = [],
  projects = [],
  customers = [],
  employees = [],
  departments = [],
  units = [],
}: ApartmentSalesClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // /sales filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [saleSearch, setSaleSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState("");

  // /sales/create state
  const [saleForm, setSaleForm] = useState({
    project_id: "",
    customer_id: "",
    sales_person_id: "",
    sale_date: "2026-11-18",
    agreement_date: "",
    expected_handover_date: "",
    payment_plan_type: "installment",
    other_charges: "0",
    terms: "",
    note: "",
  });
  const [unitFilter, setUnitFilter] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<
    Record<
      number,
      {
        unit: UnitRef;
        unit_price: number;
        discount_amount: number;
        other_charges: number;
        note: string;
      }
    >
  >({});
  const [showTermsCollapse, setShowTermsCollapse] = useState(false);
  const [showNoteCollapse, setShowNoteCollapse] = useState(false);

  // /sales/targets filters & modal state
  const [targetQ, setTargetQ] = useState("");
  const [targetEmployeeFilter, setTargetEmployeeFilter] = useState("");
  const [targetDeptFilter, setTargetDeptFilter] = useState("");
  const [targetYearFilter, setTargetYearFilter] = useState("");
  const [targetMonthFilter, setTargetMonthFilter] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [targetStatusFilter, setTargetStatusFilter] = useState("");

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [deleteTargetItem, setDeleteTargetItem] =
    useState<SalesTargetItem | null>(null);
  const [targetForm, setTargetForm] = useState({
    employee_id: "",
    period_start: "2026-11-01",
    period_end: "2026-11-30",
    target_type: "sale_value",
    target_amount: "",
    target_units: "",
    status: "active",
    note: "",
  });

  function toggleUnit(u: UnitRef) {
    setSelectedUnits((prev) => {
      const next = { ...prev };
      if (next[u.id]) {
        delete next[u.id];
      } else {
        next[u.id] = {
          unit: u,
          unit_price: u.price || 5000000,
          discount_amount: 0,
          other_charges: 0,
          note: "",
        };
      }
      return next;
    });
  }

  const selectedList = Object.values(selectedUnits);
  const grossPrice = selectedList.reduce((acc, l) => acc + l.unit_price, 0);
  const totalDiscount = selectedList.reduce(
    (acc, l) => acc + l.discount_amount,
    0
  );
  const unitCharges = selectedList.reduce((acc, l) => acc + l.other_charges, 0);
  const saleLevelCharges = Number(saleForm.other_charges) || 0;
  const netSalePrice =
    grossPrice - totalDiscount + unitCharges + saleLevelCharges;

  async function handleCreateSale(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...saleForm,
          total_amount: netSalePrice,
        }),
      });
      if (res.ok) {
        router.push("/sales");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateTarget(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetForm),
      });
      if (res.ok) {
        setShowTargetModal(false);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTarget(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTargetItem) return;
    await fetch(`/api/sales/targets/${deleteTargetItem.id}`, {
      method: "DELETE",
    });
    setDeleteTargetItem(null);
    router.refresh();
  }

  if (view === "sales") {
    const filtered = sales.filter((s) => {
      if (fromDate && s.saleDate < fromDate) return false;
      if (toDate && s.saleDate > toDate) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (paymentStatusFilter && s.paymentStatus !== paymentStatusFilter)
        return false;
      if (projectFilter && String(s.projectId) !== projectFilter) return false;
      if (saleSearch) {
        const q = saleSearch.toLowerCase();
        const cust = customers.find((c) => c.id === s.customerId);
        const custName = cust
          ? `${cust.firstName} ${cust.lastName ?? ""}`.toLowerCase()
          : "";
        if (!s.code.toLowerCase().includes(q) && !custName.includes(q))
          return false;
      }
      return true;
    });

    const confirmedCount = sales.filter((s) => s.status === "confirmed").length;
    const totalContract = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalCollected = sales.reduce((acc, s) => acc + s.paidAmount, 0);
    const totalOutstanding = Math.max(0, totalContract - totalCollected);
    const collectedPct =
      totalContract > 0 ? Math.round((totalCollected / totalContract) * 100) : 0;

    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-file-signature"></i>
            </div>
            <div>
              <h1>Apartment Sales</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Sales</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Apartment Sales
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() => downloadCsv("apartment-sales.csv", ["Code", "Sale Date", "Total", "Paid", "Status"], filtered.map((r) => [r.code, r.saleDate, r.totalAmount, r.paidAmount, r.status]))}
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/payments/create" className="btn btn-erp-ghost">
              <i className="fa-solid fa-hand-holding-dollar me-2"></i>Receive
              Payment
            </Link>
            <Link href="/sales/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Sale
            </Link>
          </div>
        </div>

        <div className="erp-card mb-3">
          <div className="erp-card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="erp-stat">
                  <span className="erp-stat-label">Confirmed Sales</span>
                  <strong className="erp-stat-value">{confirmedCount}</strong>
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-stat">
                  <span className="erp-stat-label">Contract Value</span>
                  <strong className="erp-stat-value">
                    {totalContract.toFixed(2)}
                  </strong>
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-stat">
                  <span className="erp-stat-label">Collected</span>
                  <strong className="erp-stat-value">
                    {totalCollected.toFixed(2)}
                  </strong>
                  <div
                    className="erp-progress mt-2"
                    title={`${collectedPct}% collected`}
                  >
                    <div
                      className="erp-progress-bar"
                      style={{ width: `${collectedPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-stat">
                  <span className="erp-stat-label">Outstanding</span>
                  <strong className="erp-stat-value">
                    {totalOutstanding.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-card-head">
            <form
              method="GET"
              action="/sales"
              className="erp-filterbar"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-daterange" aria-label="Sale date range">
                <input
                  type="date"
                  name="from"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="erp-select"
                  aria-label="From"
                />
                <span>–</span>
                <input
                  type="date"
                  name="to"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="erp-select"
                  aria-label="To"
                />
              </div>
              <div className="erp-search erp-search-sm">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={saleSearch}
                  onChange={(e) => setSaleSearch(e.target.value)}
                  placeholder="Sale no, customer, flat…"
                  aria-label="Search"
                />
              </div>
              <select
                name="status"
                className="erp-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Status"
              >
                <option value="">Any status</option>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                name="payment_status"
                className="erp-select"
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                aria-label="Payment status"
              >
                <option value="">Any payment state</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partially Paid</option>
                <option value="overdue">Overdue</option>
                <option value="paid">Fully Paid</option>
              </select>
              <select
                name="project_id"
                className="erp-select"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                aria-label="Project"
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                name="flag"
                className="erp-select"
                value={flagFilter}
                onChange={(e) => setFlagFilter(e.target.value)}
                aria-label="Attention"
              >
                <option value="">All sales</option>
                <option value="overdue">Has overdue</option>
                <option value="outstanding">Money outstanding</option>
              </select>
            </form>
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} sales
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-file-signature"></i>
              </div>
              <h3>No apartment sales yet</h3>
              <p>
                A sale starts from available apartments in a project — pick the
                flats, the customer and the payment terms.
              </p>
              <Link href="/sales/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Sale
              </Link>
            </div>
          ) : (
            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Sale No</th>
                      <th>Customer</th>
                      <th>Project</th>
                      <th>Date</th>
                      <th>Plan</th>
                      <th className="text-end">Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const cust = customers.find((c) => c.id === s.customerId);
                      const proj = projects.find((p) => p.id === s.projectId);
                      return (
                        <tr key={s.id}>
                          <td className="erp-cell-strong">{s.code}</td>
                          <td>
                            {cust
                              ? `${cust.firstName} ${cust.lastName ?? ""}`.trim()
                              : "—"}
                          </td>
                          <td>{proj ? proj.name : "—"}</td>
                          <td>{s.saleDate}</td>
                          <td className="text-capitalize">
                            {s.paymentPlanType.replace("_", " ")}
                          </td>
                          <td className="text-end">
                            {s.totalAmount.toFixed(2)}
                          </td>
                          <td className="text-capitalize">{s.status}</td>
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

  if (view === "sales_create") {
    const filteredUnits = units.filter((u) => {
      if (!unitFilter) return true;
      return u.unitNumber.toLowerCase().includes(unitFilter.toLowerCase());
    });

    return (
      <div className="container ">
        <div className="sw tw:mb-4 tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-3">
          <span
            className="tw:grid tw:size-12 tw:shrink-0 tw:place-items-center tw:rounded-2xl tw:text-xl tw:text-white"
            style={{
              background: "var(--sw-grad)",
              boxShadow:
                "var(--sw-glow), inset 0 1px 0 rgb(255 255 255 / .35)",
            }}
          >
            <i className="fa-solid fa-file-signature"></i>
          </span>
          <div className="tw:min-w-0">
            <nav className="tw:text-xs tw:text-slate-500" aria-label="breadcrumb">
              <Link
                href="/dashboard"
                className="tw:text-slate-500 tw:no-underline tw:hover:text-slate-800"
              >
                Home
              </Link>
              <span className="tw:mx-1">/</span>
              <Link
                href="/sales"
                className="tw:text-slate-500 tw:no-underline tw:hover:text-slate-800"
              >
                Apartment Sales
              </Link>
              <span className="tw:mx-1">/</span>
              New
            </nav>
            <h1
              className="tw:m-0 tw:text-2xl tw:font-bold tw:tracking-tight"
              style={{ color: "var(--sw-text)" }}
            >
              New apartment sale
            </h1>
          </div>

          <ol className="sw-steps" data-sale-steps>
            <li data-step="units">
              <span className="sw-step-dot">
                <i className="fa-solid fa-building"></i>
              </span>
              <span className="sw-step-label">Apartments</span>
            </li>
            <li data-step="customer">
              <span className="sw-step-dot">
                <i className="fa-solid fa-user"></i>
              </span>
              <span className="sw-step-label">Customer</span>
            </li>
            <li data-step="details">
              <span className="sw-step-dot">
                <i className="fa-solid fa-id-badge"></i>
              </span>
              <span className="sw-step-label">Details</span>
            </li>
            <li data-step="terms">
              <span className="sw-step-dot">
                <i className="fa-solid fa-money-bill-wave"></i>
              </span>
              <span className="sw-step-label">Terms</span>
            </li>
          </ol>

          <Link
            href="/sales"
            className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-xl tw:bg-white tw:px-3.5 tw:py-2 tw:text-sm tw:font-semibold tw:text-slate-700 tw:no-underline tw:shadow-sm tw:ring-1 tw:ring-slate-900/10 tw:hover:bg-slate-50"
          >
            <i className="fa-solid fa-arrow-left"></i>Back to list
          </Link>
        </div>

        <form
          method="POST"
          action="/sales"
          className="sw"
          data-sale-form
          autoComplete="off"
          noValidate
          data-units-url="/sales/available-units"
          data-customers-url="/sales/customer-lookup"
          data-sales-people-url="/sales/sales-person-lookup"
          data-sale-id=""
          data-preselect=""
          data-currency="BDT"
          onSubmit={handleCreateSale}
        >
          <div
            className="row gx-3 gy-3 gy-xl-0 sw-workspace"
            data-sale-workspace
          >
            <div className="col-xl-5">
              <div className="sw-col">
                <div className="sw-card sw-fill">
                  <div className="sw-card-head">
                    <span className="sw-no">1</span>
                    <h6>Choose apartments</h6>
                    <span
                      className="sw-badge"
                      data-unit-count
                      hidden={selectedList.length === 0}
                    >
                      {selectedList.length}
                    </span>
                  </div>
                  <div className="sw-card-body">
                    <div className="row g-2 mb-2">
                      <div className="col-sm-7">
                        <select
                          id="project_id"
                          name="project_id"
                          className="form-select form-select-sm "
                          data-select2
                          data-project
                          value={saleForm.project_id}
                          onChange={(e) =>
                            setSaleForm({
                              ...saleForm,
                              project_id: e.target.value,
                            })
                          }
                          required
                          aria-label="Project"
                        >
                          <option value="">Choose a project…</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-sm-5">
                        <div className="sw-search">
                          <i className="fa-solid fa-magnifying-glass"></i>
                          <input
                            type="search"
                            className="form-control form-control-sm"
                            data-unit-filter
                            value={unitFilter}
                            onChange={(e) => setUnitFilter(e.target.value)}
                            placeholder="Flat, building, floor…"
                            aria-label="Find an apartment"
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className="sw-sel mb-2"
                      data-selection
                      hidden={selectedList.length === 0}
                    >
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="fw-semibold">
                          <i className="fa-solid fa-square-check me-1"></i>
                          <span data-sel-count>{selectedList.length}</span>{" "}
                          selected
                        </span>
                        <div
                          className="d-flex flex-wrap gap-1 flex-grow-1"
                          data-sel-chips
                        ></div>
                        <span className="fw-bold" data-sel-total>
                          BDT {grossPrice.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          className="sw-clear"
                          data-sel-clear
                          onClick={() => setSelectedUnits({})}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="sw-scroll" data-unit-grid>
                      {!saleForm.project_id || filteredUnits.length === 0 ? (
                        <div className="sw-empty">
                          <i className="fa-solid fa-city"></i>
                          <h6>Choose a project</h6>
                          <p className="mb-0">
                            Its available apartments appear here. Choosing one
                            holds it for this sale.
                          </p>
                        </div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {filteredUnits.map((u) => {
                            const isSelected = Boolean(selectedUnits[u.id]);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                className="sw-unit"
                                data-unit
                                aria-pressed={isSelected}
                                onClick={() => toggleUnit(u)}
                              >
                                <span className="dot"></span>
                                <span className="tick">
                                  <i className="fa-solid fa-check"></i>
                                </span>
                                <div className="code" data-f-code>
                                  {u.unitNumber}
                                </div>
                                <div className="meta" data-f-kind>
                                  {u.unitType}
                                </div>
                                <div className="price" data-f-price>
                                  BDT {(u.price || 5000000).toLocaleString()}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div
                      className="invalid-feedback d-block"
                      data-error-for="units"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-4">
              <div className="sw-col is-middle">
                <div className="sw-card">
                  <div className="sw-card-head">
                    <span className="sw-no is-buyer">2</span>
                    <h6>Customer</h6>
                  </div>
                  <div className="sw-card-body">
                    <select
                      id="customer_id"
                      name="customer_id"
                      className="form-select "
                      data-customer-picker
                      value={saleForm.customer_id}
                      onChange={(e) =>
                        setSaleForm({
                          ...saleForm,
                          customer_id: e.target.value,
                        })
                      }
                      required
                      aria-label="Customer"
                    >
                      <option value="">Choose customer…</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName ?? ""} · {c.code}
                        </option>
                      ))}
                    </select>

                    <div
                      className="sw-cust mt-2"
                      data-customer-card
                      hidden
                    ></div>

                    <span className="sw-help">
                      Not on file yet?{" "}
                      <Link
                        href="/crm/customers/create"
                        target="_blank"
                        rel="noopener"
                        className="sw-link"
                      >
                        Add a customer
                      </Link>
                    </span>
                  </div>
                </div>

                <div className="sw-card">
                  <div className="sw-card-head">
                    <span className="sw-no is-buyer">3</span>
                    <h6>Sale details</h6>
                  </div>
                  <div className="sw-card-body">
                    <div className="sw-field">
                      <label htmlFor="sales_person_id" className="form-label">
                        Sales person <span className="text-danger">*</span>
                      </label>
                      <select
                        id="sales_person_id"
                        name="sales_person_id"
                        className="form-select "
                        data-sales-person-picker
                        value={saleForm.sales_person_id}
                        onChange={(e) =>
                          setSaleForm({
                            ...saleForm,
                            sales_person_id: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Choose sales person…</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName ?? ""} · {emp.code}
                          </option>
                        ))}
                      </select>
                      <span className="sw-help">
                        Earns the commission on this sale.
                      </span>
                    </div>

                    <div className="row g-2">
                      <div className="col-sm-4">
                        <label htmlFor="sale_date" className="form-label">
                          Sale date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          id="sale_date"
                          name="sale_date"
                          className="form-control form-control-sm "
                          value={saleForm.sale_date}
                          onChange={(e) =>
                            setSaleForm({
                              ...saleForm,
                              sale_date: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="col-sm-4">
                        <label htmlFor="agreement_date" className="form-label">
                          Agreement
                        </label>
                        <input
                          type="date"
                          id="agreement_date"
                          name="agreement_date"
                          className="form-control form-control-sm"
                          value={saleForm.agreement_date}
                          onChange={(e) =>
                            setSaleForm({
                              ...saleForm,
                              agreement_date: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-sm-4">
                        <label
                          htmlFor="expected_handover_date"
                          className="form-label"
                        >
                          Handover
                        </label>
                        <input
                          type="date"
                          id="expected_handover_date"
                          name="expected_handover_date"
                          className="form-control form-control-sm "
                          value={saleForm.expected_handover_date}
                          onChange={(e) =>
                            setSaleForm({
                              ...saleForm,
                              expected_handover_date: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sw-card">
                  <div className="sw-card-head">
                    <span className="sw-no">4</span>
                    <h6>Payment terms</h6>
                  </div>
                  <div className="sw-card-body">
                    <label className="form-label d-block">
                      Paid as <span className="text-danger">*</span>
                    </label>
                    <div
                      className="sw-toggle"
                      role="radiogroup"
                      aria-label="Payment type"
                    >
                      <input
                        type="radio"
                        name="payment_plan_type"
                        id="plan_full_payment"
                        value="full_payment"
                        checked={saleForm.payment_plan_type === "full_payment"}
                        onChange={() =>
                          setSaleForm({
                            ...saleForm,
                            payment_plan_type: "full_payment",
                          })
                        }
                      />
                      <label
                        htmlFor="plan_full_payment"
                        title="The whole consideration is due at once. Receipts are recorded against the sale directly."
                      >
                        <i className="fa-solid fa-money-bill-wave"></i>Full
                        Payment
                      </label>
                      <input
                        type="radio"
                        name="payment_plan_type"
                        id="plan_installment"
                        value="installment"
                        checked={saleForm.payment_plan_type === "installment"}
                        onChange={() =>
                          setSaleForm({
                            ...saleForm,
                            payment_plan_type: "installment",
                          })
                        }
                      />
                      <label
                        htmlFor="plan_installment"
                        title="The consideration is split into booking, down payment, periodic installments and handover."
                      >
                        <i className="fa-solid fa-calendar-days"></i>Installment
                      </label>
                    </div>
                    <span className="sw-help" data-plan-help></span>

                    <div className="sw-field mt-3">
                      <label htmlFor="other_charges" className="form-label">
                        Sale-level charges
                      </label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text">BDT</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          id="other_charges"
                          name="other_charges"
                          className="form-control text-end"
                          value={saleForm.other_charges}
                          onChange={(e) =>
                            setSaleForm({
                              ...saleForm,
                              other_charges: e.target.value,
                            })
                          }
                          data-sale-charges
                        />
                      </div>
                      <span className="sw-help">
                        Utility, registration deposit, etc.
                      </span>
                    </div>

                    <div className="d-flex gap-3">
                      <a
                        href="#saleTermsWrap"
                        className="sw-link"
                        data-bs-toggle="collapse"
                        role="button"
                        aria-expanded={showTermsCollapse}
                        aria-controls="saleTermsWrap"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTermsCollapse(!showTermsCollapse);
                        }}
                      >
                        <i className="fa-solid fa-file-contract me-1"></i>Terms
                        &amp; conditions
                      </a>
                      <a
                        href="#saleNoteWrap"
                        className="sw-link"
                        data-bs-toggle="collapse"
                        role="button"
                        aria-expanded={showNoteCollapse}
                        aria-controls="saleNoteWrap"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowNoteCollapse(!showNoteCollapse);
                        }}
                      >
                        <i className="fa-solid fa-note-sticky me-1"></i>
                        Internal note
                      </a>
                    </div>
                    <div
                      className={`collapse ${showTermsCollapse ? "show" : ""} mt-2`}
                      id="saleTermsWrap"
                    >
                      <textarea
                        id="terms"
                        name="terms"
                        className="form-control form-control-sm"
                        rows={3}
                        maxLength={5000}
                        aria-label="Terms and conditions"
                        value={saleForm.terms}
                        onChange={(e) =>
                          setSaleForm({ ...saleForm, terms: e.target.value })
                        }
                      ></textarea>
                    </div>
                    <div
                      className={`collapse ${showNoteCollapse ? "show" : ""} mt-2`}
                      id="saleNoteWrap"
                    >
                      <textarea
                        id="note"
                        name="note"
                        className="form-control form-control-sm"
                        rows={2}
                        maxLength={5000}
                        aria-label="Internal note"
                        value={saleForm.note}
                        onChange={(e) =>
                          setSaleForm({ ...saleForm, note: e.target.value })
                        }
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3">
              <div className="sw-col">
                <div className="sw-sum" data-summary>
                  <div className="tw:mb-2 tw:flex tw:items-center tw:justify-between">
                    <span className="tw:text-[0.66rem] tw:font-bold tw:uppercase tw:tracking-[0.14em] tw:text-slate-400">
                      Sale summary
                    </span>
                    <span className="tw:grid tw:size-7 tw:place-items-center tw:rounded-lg tw:bg-white/10 tw:text-amber-300 tw:ring-1 tw:ring-white/10">
                      <i className="fa-solid fa-receipt"></i>
                    </span>
                  </div>
                  <div className="row-line">
                    <span>
                      <span data-t-count>{selectedList.length}</span>{" "}
                      apartment(s) ·{" "}
                      <span data-t-area>{selectedList.length * 1450}</span> sft
                    </span>
                  </div>
                  <div className="row-line">
                    <span>Price</span>
                    <span className="v" data-t-gross>
                      {selectedList.length > 0
                        ? grossPrice.toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <div className="row-line">
                    <span>Discount</span>
                    <span className="v" data-t-discount>
                      {totalDiscount > 0 ? totalDiscount.toLocaleString() : "—"}
                    </span>
                  </div>
                  <div className="row-line">
                    <span>Apartment charges</span>
                    <span className="v" data-t-charges>
                      {unitCharges > 0 ? unitCharges.toLocaleString() : "—"}
                    </span>
                  </div>
                  <div className="row-line">
                    <span>Sale-level charges</span>
                    <span className="v" data-t-sale-charges>
                      {saleLevelCharges > 0
                        ? saleLevelCharges.toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <div className="row-line grand">
                    <span>Net sale price</span>
                    <span className="v" data-t-final>
                      {netSalePrice > 0 ? netSalePrice.toLocaleString() : "—"}
                    </span>
                  </div>
                </div>

                <div className="sw-card sw-fill">
                  <div className="sw-card-head">
                    <i className="fa-solid fa-tags tw:text-amber-600"></i>
                    <h6>Price lines</h6>
                    <span
                      className="sw-badge"
                      data-line-count
                      hidden={selectedList.length === 0}
                    >
                      {selectedList.length}
                    </span>
                  </div>
                  <div className="sw-scroll" data-unit-rows>
                    {selectedList.length === 0 ? (
                      <div className="sw-empty">
                        <i className="fa-solid fa-tag"></i>
                        <h6>No apartments yet</h6>
                        <p className="mb-0">
                          Pick apartments to set their price, discount and
                          charges.
                        </p>
                      </div>
                    ) : (
                      selectedList.map((line) => (
                        <div
                          key={line.unit.id}
                          className="sw-line"
                          data-unit-row
                        >
                          <div className="sw-line-head">
                            <strong data-f-label>
                              {line.unit.unitNumber}
                            </strong>
                            <span className="meta" data-f-meta>
                              {line.unit.unitType}
                            </span>
                            <span className="net" data-f-net>
                              {(
                                line.unit_price -
                                line.discount_amount +
                                line.other_charges
                              ).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              className="sw-remove"
                              data-remove-unit
                              title="Remove"
                              onClick={() => toggleUnit(line.unit)}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="sw-submit"
                  data-submit-button
                  disabled={submitting}
                >
                  <i className="fa-solid fa-floppy-disk me-1"></i>Create sale{" "}
                  <i className="fa-solid fa-arrow-right ms-1"></i>
                </button>
                <p className="tw:m-0 tw:text-center tw:text-[11px] tw:leading-snug tw:text-slate-500">
                  Saves a <strong>draft</strong> and holds the apartments.
                  Nothing is billed until you confirm it.
                </p>
              </div>
            </div>
          </div>

          <div data-unit-inputs hidden></div>
        </form>
      </div>
    );
  }

  // sales_targets
  const filteredTargets = targets.filter((t) => {
    if (
      targetEmployeeFilter &&
      String(t.employeeId) !== targetEmployeeFilter
    )
      return false;
    if (targetTypeFilter && t.targetType !== targetTypeFilter) return false;
    if (targetStatusFilter && t.status !== targetStatusFilter) return false;
    if (targetQ) {
      const q = targetQ.toLowerCase();
      if (!t.employeeName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const metCount = filteredTargets.filter(
    (t) => t.targetAmount > 0 && t.achievedAmount >= t.targetAmount
  ).length;

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-bullseye"></i>
          </div>
          <div>
            <h1>Sales Targets</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Sales</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Targets
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() => downloadCsv("sales-targets.csv", ["Employee", "Start", "End", "Amount", "Units", "Achieved"], filteredTargets.map((r) => [r.employeeName, r.periodStart, r.periodEnd, r.targetAmount, r.targetUnits, r.achievedAmount]))}
          >
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </button>
          <button
            type="button"
            className="btn btn-erp"
            data-target-create
            onClick={() => setShowTargetModal(true)}
          >
            <i className="fa-solid fa-plus me-2"></i>Set Target
          </button>
        </div>
      </div>

      <div className="erp-card mb-3">
        <div className="erp-card-body">
          <div className="erp-target-summary" data-target-summary>
            <div className="erp-target-summary-card is-headline">
              <span className="erp-target-summary-label">
                <i className="fa-solid fa-bullseye me-1"></i>Targets met
              </span>
              <strong>
                {metCount} <small>of {filteredTargets.length}</small>
              </strong>
              <div className="erp-target-progress is-none">
                <div className="erp-target-progress-track">
                  <span
                    className="erp-target-progress-bar"
                    style={{ width: "0%" }}
                  ></span>
                </div>
                <span className="erp-target-progress-value">0%</span>
              </div>
            </div>

            <div className="erp-target-summary-card">
              <span className="erp-target-summary-label">
                {filteredTargets.length === 0
                  ? "No targets match these filters"
                  : "Active targets"}
              </span>
              <strong>
                {filteredTargets.length === 0 ? "—" : filteredTargets.length}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div
        className="erp-card"
        data-target-page
        data-store-url="/sales/targets"
      >
        <div className="erp-card-head">
          <form
            method="GET"
            action="/sales/targets"
            className="erp-filter-grid is-targets"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-search erp-search-sm erp-filter-wide">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="q"
                value={targetQ}
                onChange={(e) => setTargetQ(e.target.value)}
                placeholder="Search people…"
                aria-label="Search by name or employee code"
              />
            </div>

            <select
              name="employee_id"
              className="erp-select"
              data-select2
              data-placeholder="Person"
              value={targetEmployeeFilter}
              onChange={(e) => setTargetEmployeeFilter(e.target.value)}
              aria-label="Sales person"
            >
              <option value="">Person</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName ?? ""}
                </option>
              ))}
            </select>

            <select
              name="department_id"
              className="erp-select"
              data-select2
              data-placeholder="Department"
              value={targetDeptFilter}
              onChange={(e) => setTargetDeptFilter(e.target.value)}
              aria-label="Department"
            >
              <option value="">Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              name="period_year"
              className="erp-select"
              value={targetYearFilter}
              onChange={(e) => setTargetYearFilter(e.target.value)}
              aria-label="Year"
            >
              <option value="">Year</option>
              <option value="2026">2026</option>
            </select>

            <select
              name="period_month"
              className="erp-select"
              value={targetMonthFilter}
              onChange={(e) => setTargetMonthFilter(e.target.value)}
              aria-label="Month"
            >
              <option value="">Month</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>

            <select
              name="target_type"
              className="erp-select"
              data-select2
              data-placeholder="Measure"
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              aria-label="Measure"
            >
              <option value="">Measure</option>
              <option value="sale_value">Sale Value</option>
              <option value="units">Units Sold</option>
              <option value="collection">Collection</option>
            </select>

            <select
              name="status"
              className="erp-select"
              data-select2
              data-placeholder="Status"
              value={targetStatusFilter}
              onChange={(e) => setTargetStatusFilter(e.target.value)}
              aria-label="Status"
            >
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="passed">Passed</option>
            </select>

            <div className="erp-filter-actions">
              <button type="submit" className="btn btn-erp btn-sm">
                <i className="fa-solid fa-filter me-1"></i>Filter
              </button>
            </div>
          </form>
        </div>

        <div className="erp-card-body">
          {filteredTargets.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-bullseye"></i>
              </div>
              <h3>No targets here</h3>
              <p>
                Set a monthly target for each sales person and their progress
                shows up here.
              </p>
              <button
                type="button"
                className="btn btn-erp"
                data-target-create
                onClick={() => setShowTargetModal(true)}
              >
                <i className="fa-solid fa-plus me-2"></i>Set the first target
              </button>
            </div>
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Sales Person</th>
                    <th>Period</th>
                    <th>Measure</th>
                    <th className="text-end">Target</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTargets.map((t) => (
                    <tr key={t.id}>
                      <td className="erp-cell-strong">{t.employeeName}</td>
                      <td>
                        {t.periodStart} – {t.periodEnd}
                      </td>
                      <td className="text-capitalize">
                        {t.targetType.replace("_", " ")}
                      </td>
                      <td className="text-end">
                        {t.targetType === "units"
                          ? `${t.targetUnits} units`
                          : t.targetAmount.toLocaleString()}
                      </td>
                      <td className="text-capitalize">{t.status}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          onClick={() => setDeleteTargetItem(t)}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div
        className={`modal fade ${showTargetModal ? "show d-block" : ""}`}
        id="salesTargetModal"
        tabIndex={-1}
        aria-hidden={!showTargetModal}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form
              method="POST"
              className="erp-form"
              data-target-form
              data-submit-lock="off"
              noValidate
              onSubmit={handleCreateTarget}
            >
              <input
                type="hidden"
                name="_method"
                value="POST"
                data-target-method
              />

              <div className="modal-header">
                <h5 className="mb-0" style={{ fontSize: "16px", fontWeight: 600 }}>
                  <i className="fa-solid fa-bullseye me-2 text-muted"></i>
                  <span data-target-title>Set Target</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => setShowTargetModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <div
                  className="alert alert-danger py-2 px-3 mb-3"
                  role="alert"
                  style={{ borderRadius: "9px", fontSize: "12.5px" }}
                  data-target-error
                  hidden
                >
                  <span data-target-error-text></span>
                </div>

                <div className="erp-field">
                  <label className="form-label">
                    Sales Person <span className="erp-required">*</span>
                  </label>
                  <select
                    name="employee_id"
                    className="form-select"
                    data-select2
                    data-target-employee
                    data-placeholder="Choose a sales person"
                    value={targetForm.employee_id}
                    onChange={(e) =>
                      setTargetForm({
                        ...targetForm,
                        employee_id: e.target.value,
                      })
                    }
                    required
                  >
                    <option value=""></option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName ?? ""} · {emp.code} —{" "}
                        {emp.departmentName || "Administration"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="erp-field">
                  <label className="form-label">
                    Target Period <span className="erp-required">*</span>
                  </label>

                  <div className="erp-daterange erp-target-range">
                    <input
                      type="date"
                      name="period_start"
                      className="form-control"
                      data-target-start
                      value={targetForm.period_start}
                      onChange={(e) =>
                        setTargetForm({
                          ...targetForm,
                          period_start: e.target.value,
                        })
                      }
                      aria-label="Period starts"
                      required
                    />
                    <span>–</span>
                    <input
                      type="date"
                      name="period_end"
                      className="form-control"
                      data-target-end
                      value={targetForm.period_end}
                      onChange={(e) =>
                        setTargetForm({
                          ...targetForm,
                          period_end: e.target.value,
                        })
                      }
                      aria-label="Period ends"
                      required
                    />
                  </div>

                  <div className="erp-range-presets" data-range-presets>
                    <button type="button" data-preset="10d">
                      10 days
                    </button>
                    <button type="button" data-preset="1m">
                      1 month
                    </button>
                    <button type="button" data-preset="3m">
                      3 months
                    </button>
                    <button type="button" data-preset="6m">
                      6 months
                    </button>
                    <button type="button" data-preset="1y">
                      1 year
                    </button>
                  </div>

                  <span className="erp-range-summary" data-range-summary hidden>
                    <i className="fa-solid fa-calendar-day me-1"></i>
                    <strong data-range-length></strong>
                    <span data-range-dates></span>
                  </span>
                </div>

                <div className="erp-field">
                  <label className="form-label">
                    Measured In <span className="erp-required">*</span>
                  </label>
                  <div className="erp-target-types" data-target-types>
                    <label className="erp-target-type">
                      <input
                        type="radio"
                        name="target_type"
                        value="sale_value"
                        checked={targetForm.target_type === "sale_value"}
                        onChange={() =>
                          setTargetForm({
                            ...targetForm,
                            target_type: "sale_value",
                          })
                        }
                        data-target-type
                      />
                      <span className="erp-target-type-body">
                        <i className="fa-solid fa-sack-dollar"></i>
                        <strong>Sale Value</strong>
                        <small>Value of sales confirmed in the period</small>
                      </span>
                    </label>
                    <label className="erp-target-type">
                      <input
                        type="radio"
                        name="target_type"
                        value="units"
                        checked={targetForm.target_type === "units"}
                        onChange={() =>
                          setTargetForm({
                            ...targetForm,
                            target_type: "units",
                          })
                        }
                        data-target-type
                      />
                      <span className="erp-target-type-body">
                        <i className="fa-solid fa-building-circle-check"></i>
                        <strong>Units Sold</strong>
                        <small>Number of apartments sold in the period</small>
                      </span>
                    </label>
                    <label className="erp-target-type">
                      <input
                        type="radio"
                        name="target_type"
                        value="collection"
                        checked={targetForm.target_type === "collection"}
                        onChange={() =>
                          setTargetForm({
                            ...targetForm,
                            target_type: "collection",
                          })
                        }
                        data-target-type
                      />
                      <span className="erp-target-type-body">
                        <i className="fa-solid fa-hand-holding-dollar"></i>
                        <strong>Collection</strong>
                        <small>Money actually received in the period</small>
                      </span>
                    </label>
                  </div>
                </div>

                <div
                  className="erp-field"
                  data-target-amount-field
                  hidden={targetForm.target_type === "units"}
                >
                  <label className="form-label">
                    Target Amount <span className="erp-required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="target_amount"
                    className="form-control"
                    data-target-amount
                    value={targetForm.target_amount}
                    onChange={(e) =>
                      setTargetForm({
                        ...targetForm,
                        target_amount: e.target.value,
                      })
                    }
                    placeholder="e.g. 25000000"
                  />
                  <span className="erp-help">
                    What this person is expected to reach over the period.
                  </span>
                </div>

                <div
                  className="erp-field"
                  data-target-units-field
                  hidden={targetForm.target_type !== "units"}
                >
                  <label className="form-label">
                    Target Units <span className="erp-required">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="target_units"
                    className="form-control"
                    data-target-units
                    value={targetForm.target_units}
                    onChange={(e) =>
                      setTargetForm({
                        ...targetForm,
                        target_units: e.target.value,
                      })
                    }
                    placeholder="e.g. 4"
                  />
                  <span className="erp-help">
                    How many apartments this person is expected to sell in the
                    period.
                  </span>
                </div>

                <div className="erp-field">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    className="form-select"
                    data-target-status
                    value={targetForm.status}
                    onChange={(e) =>
                      setTargetForm({ ...targetForm, status: e.target.value })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <span className="erp-help">
                    A target whose period has ended is marked Passed
                    automatically.
                  </span>
                </div>

                <div className="erp-field mb-0">
                  <label className="form-label">Note</label>
                  <textarea
                    name="note"
                    className="form-control"
                    rows={2}
                    maxLength={1000}
                    data-target-note
                    value={targetForm.note}
                    onChange={(e) =>
                      setTargetForm({ ...targetForm, note: e.target.value })
                    }
                    placeholder="Anything worth recording about this target…"
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  data-bs-dismiss="modal"
                  onClick={() => setShowTargetModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-erp"
                  data-target-submit
                  disabled={submitting}
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        className={`modal fade ${deleteTargetItem ? "show d-block" : ""}`}
        id="deleteRecordModal"
        tabIndex={-1}
        aria-hidden={!deleteTargetItem}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div
            className="modal-content"
            style={{ border: "none", borderRadius: "14px" }}
          >
            <div className="modal-body p-4">
              <div className="d-flex gap-3">
                <div className="erp-kpi-icon is-danger">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <h5
                    className="mb-2"
                    style={{ fontSize: "16px", fontWeight: 600 }}
                  >
                    Delete sales target?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>
                      {deleteTargetItem?.employeeName ?? ""}
                    </strong>{" "}
                    will be removed from active use. The record is retained and
                    can be restored by an administrator.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setDeleteTargetItem(null)}
              >
                Cancel
              </button>
              <form
                method="POST"
                data-delete-form
                onSubmit={handleDeleteTarget}
              >
                <input type="hidden" name="_method" value="DELETE" />
                <button
                  type="submit"
                  className="btn btn-erp"
                  style={{
                    background: "var(--erp-danger)",
                    borderColor: "var(--erp-danger)",
                  }}
                >
                  <i className="fa-solid fa-trash-can me-2"></i>Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
