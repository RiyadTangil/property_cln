"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";
import type { EmployeeRow } from "./HrEmployeesClient";

export interface PayrollRow {
  id: number;
  code: string;
  employeeId: number | null;
  employeeName: string;
  branchId: number | null;
  month: number;
  year: number;
  period: string;
  type: string;
  disbursedOn: string | null;
  paymentMethod: string;
  paymentAccountId: number | null;
  basic: number;
  allowances: number;
  deductions: number;
  net: number;
  allowancesJson: string;
  deductionsJson: string;
  remarks: string | null;
}

interface Props {
  mode: "list" | "create" | "bonus" | "detail" | "payslip";
  payrolls?: PayrollRow[];
  payroll?: PayrollRow;
  employees: EmployeeRow[];
  branches: Array<{ id: number; code: string; name: string }>;
  accounts: Array<{ id: number; code: string; name: string }>;
}

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function HrPayrollClient({
  mode,
  payrolls = [],
  payroll,
  employees,
  branches,
  accounts,
}: Props) {
  const router = useRouter();

  // List filters
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Create / Bonus form states
  const [employeeId, setEmployeeId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [month, setMonth] = useState("11");
  const [year, setYear] = useState("2026");
  const [disbursedOn, setDisbursedOn] = useState("2026-11-18");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [basic, setBasic] = useState("0");

  const [allowanceRows, setAllowanceRows] = useState<Array<{ name: string; amount: string }>>(
    mode === "bonus"
      ? [{ name: "Festival Bonus", amount: "" }]
      : [{ name: "", amount: "" }]
  );
  const [deductionRows, setDeductionRows] = useState<Array<{ name: string; amount: string }>>([
    { name: "", amount: "" },
  ]);

  const basicNum = Number(basic) || 0;
  const allowSum = allowanceRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const deductSum = deductionRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const grossNum = basicNum + allowSum;
  const netNum = grossNum - deductSum;

  const handleDeleteConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hr/payroll/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        router.push("/hr/payroll");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisburseSubmit = async (e: React.FormEvent, isBonus: boolean) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId ? Number(employeeId) : 1,
          branch_id: branchId ? Number(branchId) : null,
          month: Number(month),
          year: Number(year),
          type: isBonus ? "bonus" : "regular",
          disbursed_on: disbursedOn,
          payment_method: paymentMethod || "bank",
          payment_account_id: paymentAccountId ? Number(paymentAccountId) : null,
          remarks,
          basic: isBonus ? 0 : basicNum,
          allowances: allowanceRows
            .filter((r) => r.name || r.amount)
            .map((r) => ({ name: r.name, amount: Number(r.amount) || 0 })),
          deductions: isBonus
            ? []
            : deductionRows
                .filter((r) => r.name || r.amount)
                .map((r) => ({ name: r.name, amount: Number(r.amount) || 0 })),
        }),
      });
      if (res.ok) {
        router.push("/hr/payroll");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // MODE 1: SALARY SHEET LIST (/hr/payroll)
  // ============================================================================
  if (mode === "list") {
    const filtered = payrolls.filter((r) => {
      if (search.trim()) {
        const hay = `${r.code} ${r.employeeName}`.toLowerCase();
        if (!hay.includes(search.trim().toLowerCase())) return false;
      }
      if (monthFilter && String(r.month) !== monthFilter) return false;
      if (yearFilter && String(r.year) !== yearFilter) return false;
      if (typeFilter) {
        const normType = r.type === "salary" ? "regular" : r.type;
        if (normType !== typeFilter) return false;
      }
      return true;
    });

    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <div>
              <h1>Salary Sheet</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">HR</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Salary Sheet
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() => downloadCsv("payroll.csv", ["Code", "Employee", "Period", "Type", "Basic", "Allowances", "Deductions", "Net"], filtered.map((r) => [r.code, r.employeeName, r.period, r.type, r.basic, r.allowances, r.deductions, r.net]))}
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/hr/payroll/bonus" className="btn btn-erp-ghost">
              <i className="fa-solid fa-gift me-2"></i>Disburse Bonus
            </Link>
            <Link href="/hr/payroll/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>Disburse Salary
            </Link>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-toolbar">
            <form
              method="GET"
              action="/hr/payroll"
              onSubmit={(e) => e.preventDefault()}
              className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
            >
              <div className="erp-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Code or employee…"
                  aria-label="Search"
                />
              </div>
              <select
                name="month"
                className="form-select erp-select"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                aria-label="Month"
              >
                <option value="">All months</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                name="year"
                className="form-select erp-select"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                aria-label="Year"
              >
                <option value="">All years</option>
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
              <select
                name="type"
                className="form-select erp-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Type"
              >
                <option value="">All types</option>
                <option value="regular">Regular</option>
                <option value="bonus">Bonus</option>
              </select>
            </form>
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} run
            </span>
          </div>

          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Employee</th>
                    <th>Period</th>
                    <th>Type</th>
                    <th className="text-end">Basic</th>
                    <th className="text-end">Allow.</th>
                    <th className="text-end">Deduct.</th>
                    <th className="text-end">Net</th>
                    <th>Method</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const empObj = employees.find((e) => e.id === r.employeeId);
                    return (
                      <tr key={r.id}>
                        <td className="erp-cell-strong">
                          <Link href={`/hr/payroll/${r.id}`} className="erp-link">
                            {r.code}
                          </Link>
                        </td>
                        <td>
                          {r.employeeName}
                          <span className="erp-identity-meta d-block">
                            {empObj?.code ?? `EMP-000${r.employeeId ?? 1}`}
                          </span>
                        </td>
                        <td>{r.period}</td>
                        <td>
                          <span className="erp-pill is-neutral">
                            {r.type === "bonus" ? "Bonus" : "Regular"}
                          </span>
                        </td>
                        <td className="text-end">{r.basic.toFixed(2)}</td>
                        <td className="text-end">{r.allowances.toFixed(2)}</td>
                        <td className="text-end ">{r.deductions.toFixed(2)}</td>
                        <td className="text-end erp-cell-strong">{r.net.toFixed(2)}</td>
                        <td>{r.paymentMethod || "—"}</td>
                        <td>
                          <span className="erp-created-by">
                            <span className="erp-cell-strong">System Administrator</span>
                            <span className="erp-identity-meta d-block">11 Nov 2026</span>
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <Link
                            href={`/hr/payroll/${r.id}`}
                            className="btn btn-erp-ghost btn-sm"
                            title="View"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </Link>
                          <Link
                            href={`/hr/payroll/${r.id}/payslip`}
                            className="btn btn-erp-ghost btn-sm"
                            title="Payslip"
                            target="_blank"
                          >
                            <i className="fa-solid fa-receipt"></i>
                          </Link>
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            data-bs-toggle="modal"
                            data-bs-target="#deleteRecordModal"
                            data-record-name={r.code}
                            data-record-action={`/hr/payroll/${r.id}`}
                            onClick={() => setDeleteTarget({ id: r.id, name: r.code })}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          className={`modal fade ${deleteTarget ? "show d-block" : ""}`}
          id="deleteRecordModal"
          tabIndex={-1}
          aria-hidden={!deleteTarget}
          style={deleteTarget ? { backgroundColor: "rgba(15,23,42,0.5)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ border: "none", borderRadius: "14px" }}>
              <div className="modal-body p-4">
                <div className="d-flex gap-3">
                  <div className="erp-kpi-icon is-danger">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div>
                    <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                      Delete disbursement?
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                      <strong data-delete-name>{deleteTarget?.name}</strong> will be removed from
                      active use. The record is retained and can be restored by an administrator.
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  data-bs-dismiss="modal"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>
                <form method="POST" data-delete-form onSubmit={handleDeleteConfirm}>
                  <input type="hidden" name="_method" value="DELETE" />
                  <button
                    type="submit"
                    className="btn btn-erp"
                    disabled={submitting}
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

  // ============================================================================
  // MODE 2: DISBURSE SALARY (/hr/payroll/create)
  // ============================================================================
  if (mode === "create") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <div>
              <h1>Disburse Salary</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/hr/payroll">Salary Sheet</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Disburse
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        <form
          method="POST"
          action="/hr/payroll"
          onSubmit={(e) => handleDisburseSubmit(e, false)}
          className="erp-form"
          data-disburse-form
          data-structure-url="/hr/payroll/structure"
        >
          <div className="row g-3">
            <div className="col-lg-7">
              <div className="erp-card p-4">
                <div className="erp-cv-block-head erp-block-head-sm mb-3">
                  <i className="fa-solid fa-user"></i>
                  <h3>Employee &amp; Period</h3>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label className="form-label">
                        Employee <span className="erp-required">*</span>
                      </label>
                      <select
                        name="employee_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Select employee"
                        data-disburse-employee
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        required
                      >
                        <option value="">— Select —</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id} data-branch={e.branchId ?? ""}>
                            {`${e.firstName} ${e.lastName ?? ""}`.trim()} ({e.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label className="form-label">Branch</label>
                      <select
                        name="branch_id"
                        className="form-select"
                        data-select2
                        data-placeholder="— Company-wide —"
                        data-disburse-branch
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                      >
                        <option value="">— Company-wide —</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="erp-field">
                      <label className="form-label">
                        Month <span className="erp-required">*</span>
                      </label>
                      <select
                        name="month"
                        className="form-select"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        required
                      >
                        {MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label className="form-label">
                        Year <span className="erp-required">*</span>
                      </label>
                      <select
                        name="year"
                        className="form-select"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        required
                      >
                        <option value="2027">2027</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label className="form-label">Disbursed On</label>
                      <input
                        type="date"
                        name="disbursed_on"
                        className="form-control"
                        value={disbursedOn}
                        onChange={(e) => setDisbursedOn(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label className="form-label">Payment Method</label>
                      <select
                        name="payment_method"
                        className="form-select"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="">—</option>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="mobile">Mobile Money</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label className="form-label">Paid From (Account)</label>
                      <select
                        name="payment_account_id"
                        className="form-select"
                        data-select2
                        data-placeholder="— Default cash —"
                        value={paymentAccountId}
                        onChange={(e) => setPaymentAccountId(e.target.value)}
                      >
                        <option value="">— Default cash —</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} · {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="erp-field">
                      <label className="form-label">Remarks</label>
                      <input
                        type="text"
                        name="remarks"
                        className="form-control"
                        maxLength={1000}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <hr className="erp-divider my-3" />

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="erp-cv-block-head erp-block-head-sm mb-0">
                    <i className="fa-solid fa-plus text-success"></i>
                    <h3>Earnings</h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    data-add="allowances"
                    onClick={() =>
                      setAllowanceRows((prev) => [...prev, { name: "", amount: "" }])
                    }
                  >
                    <i className="fa-solid fa-plus me-1"></i>Add allowance
                  </button>
                </div>
                <div className="erp-field mb-2">
                  <label className="form-label">
                    Basic Salary <span className="erp-required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="basic"
                    className="form-control"
                    value={basic}
                    onChange={(e) => setBasic(e.target.value)}
                    data-basic
                    required
                  />
                </div>
                <div className="erp-table-wrap">
                  <table className="table erp-table mb-0" style={{ fontSize: "12.5px" }}>
                    <thead>
                      <tr>
                        <th>Allowance</th>
                        <th style={{ width: "170px" }}>Amount</th>
                        <th style={{ width: "44px" }}></th>
                      </tr>
                    </thead>
                    <tbody data-body="allowances">
                      {allowanceRows.map((row, idx) => (
                        <tr key={idx} data-row>
                          <td>
                            <input
                              type="text"
                              name={`allowances[${idx}][name]`}
                              list="allowanceTypeList"
                              className="form-control form-control-sm"
                              value={row.name}
                              onChange={(e) =>
                                setAllowanceRows((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, name: e.target.value } : item
                                  )
                                )
                              }
                              placeholder="e.g. House Rent"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              name={`allowances[${idx}][amount]`}
                              className="form-control form-control-sm text-end"
                              value={row.amount}
                              onChange={(e) =>
                                setAllowanceRows((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, amount: e.target.value } : item
                                  )
                                )
                              }
                              placeholder="0"
                              data-amount
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm p-1 text-danger"
                              data-remove
                              onClick={() =>
                                setAllowanceRows((prev) =>
                                  prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
                                )
                              }
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2 mt-3">
                  <div className="erp-cv-block-head erp-block-head-sm mb-0">
                    <i className="fa-solid fa-minus text-danger"></i>
                    <h3>Deductions</h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    data-add="deductions"
                    onClick={() =>
                      setDeductionRows((prev) => [...prev, { name: "", amount: "" }])
                    }
                  >
                    <i className="fa-solid fa-plus me-1"></i>Add deduction
                  </button>
                </div>
                <div className="erp-table-wrap">
                  <table className="table erp-table mb-0" style={{ fontSize: "12.5px" }}>
                    <thead>
                      <tr>
                        <th>Deduction</th>
                        <th style={{ width: "170px" }}>Amount</th>
                        <th style={{ width: "44px" }}></th>
                      </tr>
                    </thead>
                    <tbody data-body="deductions">
                      {deductionRows.map((row, idx) => (
                        <tr key={idx} data-row>
                          <td>
                            <input
                              type="text"
                              name={`deductions[${idx}][name]`}
                              list="deductionHeadList"
                              className="form-control form-control-sm"
                              value={row.name}
                              onChange={(e) =>
                                setDeductionRows((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, name: e.target.value } : item
                                  )
                                )
                              }
                              placeholder="e.g. PF"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              name={`deductions[${idx}][amount]`}
                              className="form-control form-control-sm text-end"
                              value={row.amount}
                              onChange={(e) =>
                                setDeductionRows((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, amount: e.target.value } : item
                                  )
                                )
                              }
                              placeholder="0"
                              data-amount
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm p-1 text-danger"
                              data-remove
                              onClick={() =>
                                setDeductionRows((prev) =>
                                  prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
                                )
                              }
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="erp-card p-4" style={{ position: "sticky", top: "80px" }}>
                <div className="erp-cv-block-head erp-block-head-sm mb-3">
                  <i className="fa-solid fa-calculator"></i>
                  <h3>Summary</h3>
                </div>
                <div className="erp-summary-row d-flex justify-content-between py-2">
                  <span>Basic</span>
                  <strong>
                    BDT <span data-sum="basic">{basicNum.toFixed(2)}</span>
                  </strong>
                </div>
                <div className="erp-summary-row d-flex justify-content-between py-2">
                  <span>Total Allowances</span>
                  <strong>
                    BDT <span data-sum="allowances">{allowSum.toFixed(2)}</span>
                  </strong>
                </div>
                <div
                  className="erp-summary-row d-flex justify-content-between py-2"
                  style={{ borderTop: "1px solid var(--erp-line)" }}
                >
                  <span>Gross</span>
                  <strong>
                    BDT <span data-sum="gross">{grossNum.toFixed(2)}</span>
                  </strong>
                </div>
                <div className="erp-summary-row d-flex justify-content-between py-2 text-danger">
                  <span>Total Deductions</span>
                  <strong>
                    − BDT <span data-sum="deductions">{deductSum.toFixed(2)}</span>
                  </strong>
                </div>
                <div
                  className="erp-summary-row d-flex justify-content-between py-2"
                  style={{ borderTop: "2px solid var(--erp-primary)", fontSize: "16px" }}
                >
                  <span>
                    <strong>Net Payable</strong>
                  </span>
                  <strong className="text-success">
                    BDT <span data-sum="net">{netNum.toFixed(2)}</span>
                  </strong>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <Link href="/hr/payroll" className="btn btn-erp-ghost flex-grow-1">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-erp flex-grow-1"
                    data-submit
                    disabled={submitting}
                  >
                    <i className="fa-solid fa-check me-2"></i>Disburse
                  </button>
                </div>
                <p className="erp-help mt-2 mb-0">
                  <i className="fa-solid fa-circle-info me-1"></i>Posts to the ledger automatically
                  when accounts are mapped.
                </p>
              </div>
            </div>
          </div>

          <datalist id="allowanceTypeList">
            <option value="Food"></option>
            <option value="House Rent"></option>
            <option value="Medical"></option>
            <option value="Mobile"></option>
            <option value="Overtime"></option>
            <option value="Special Allowance"></option>
            <option value="Transport"></option>
          </datalist>
          <datalist id="deductionHeadList"></datalist>
        </form>
      </div>
    );
  }

  // ============================================================================
  // MODE 3: DISBURSE BONUS (/hr/payroll/bonus)
  // ============================================================================
  if (mode === "bonus") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-gift"></i>
            </div>
            <div>
              <h1>Disburse Bonus</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/hr/payroll">Salary Sheet</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Bonus
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        <form
          method="POST"
          action="/hr/payroll/bonus"
          onSubmit={(e) => handleDisburseSubmit(e, true)}
          className="erp-form"
          data-bonus-form
        >
          <div className="erp-card p-4" style={{ maxWidth: "820px" }}>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="erp-field">
                  <label className="form-label">
                    Employee <span className="erp-required">*</span>
                  </label>
                  <select
                    name="employee_id"
                    className="form-select"
                    data-select2
                    data-placeholder="Select employee"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                  >
                    <option value="">— Select —</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id} data-branch={e.branchId ?? ""}>
                        {`${e.firstName} ${e.lastName ?? ""}`.trim()} ({e.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="erp-field">
                  <label className="form-label">Branch</label>
                  <select
                    name="branch_id"
                    className="form-select"
                    data-select2
                    data-placeholder="— Company-wide —"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    <option value="">— Company-wide —</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field">
                  <label className="form-label">
                    Month <span className="erp-required">*</span>
                  </label>
                  <select
                    name="month"
                    className="form-select"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label className="form-label">
                    Year <span className="erp-required">*</span>
                  </label>
                  <select
                    name="year"
                    className="form-select"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  >
                    <option value="2027">2027</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label className="form-label">Disbursed On</label>
                  <input
                    type="date"
                    name="disbursed_on"
                    className="form-control"
                    value={disbursedOn}
                    onChange={(e) => setDisbursedOn(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label className="form-label">Method</label>
                  <select
                    name="payment_method"
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="">—</option>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="mobile">Mobile Money</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="erp-field">
                  <label className="form-label">Paid From (Account)</label>
                  <select
                    name="payment_account_id"
                    className="form-select"
                    data-select2
                    data-placeholder="— Default cash —"
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                  >
                    <option value="">— Default cash —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} · {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="erp-field">
                  <label className="form-label">Remarks</label>
                  <input
                    type="text"
                    name="remarks"
                    className="form-control"
                    maxLength={1000}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="erp-divider my-3" />

            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="erp-cv-block-head erp-block-head-sm mb-0">
                <i className="fa-solid fa-gift"></i>
                <h3>Bonus Lines</h3>
              </div>
              <button
                type="button"
                className="btn btn-erp-ghost btn-sm"
                data-add
                onClick={() =>
                  setAllowanceRows((prev) => [...prev, { name: "", amount: "" }])
                }
              >
                <i className="fa-solid fa-plus me-1"></i>Add line
              </button>
            </div>
            <div className="erp-table-wrap">
              <table className="table erp-table mb-0" style={{ fontSize: "12.5px" }}>
                <thead>
                  <tr>
                    <th>Bonus</th>
                    <th style={{ width: "170px" }}>Amount</th>
                    <th style={{ width: "44px" }}></th>
                  </tr>
                </thead>
                <tbody data-body>
                  {allowanceRows.map((row, idx) => (
                    <tr key={idx} data-row>
                      <td>
                        <input
                          type="text"
                          name={`allowances[${idx}][name]`}
                          className="form-control form-control-sm"
                          value={row.name}
                          onChange={(e) =>
                            setAllowanceRows((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, name: e.target.value } : item
                              )
                            )
                          }
                          placeholder="e.g. Festival Bonus"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name={`allowances[${idx}][amount]`}
                          className="form-control form-control-sm text-end"
                          value={row.amount}
                          onChange={(e) =>
                            setAllowanceRows((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, amount: e.target.value } : item
                              )
                            )
                          }
                          placeholder="0"
                          data-amount
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm p-1 text-danger"
                          data-remove
                          onClick={() =>
                            setAllowanceRows((prev) =>
                              prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
                            )
                          }
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="erp-cell-strong">
                    <td className="text-end">Total Bonus</td>
                    <td className="text-end">
                      BDT <span data-total>{allowSum.toFixed(2)}</span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <Link href="/hr/payroll" className="btn btn-erp-ghost">
                Cancel
              </Link>
              <button type="submit" className="btn btn-erp" data-submit disabled={submitting}>
                <i className="fa-solid fa-check me-2"></i>Disburse Bonus
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ============================================================================
  // MODE 4: SALARY DETAIL (/hr/payroll/[id])
  // ============================================================================
  const rec = payroll ?? payrolls[0];
  const empObj = employees.find((e) => e.id === rec?.employeeId) ?? employees[0];

  if (mode === "detail") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <div>
              <h1>{rec?.code ?? "SAL-00001"}</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/hr/payroll">Salary Sheet</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {rec?.code ?? "SAL-00001"}
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <span className="erp-pill is-available align-self-center">Regular · Paid</span>
            <Link
              href={`/hr/payroll/${rec?.id ?? 1}/payslip`}
              className="btn btn-erp-ghost"
              target="_blank"
            >
              <i className="fa-solid fa-receipt me-2"></i>Payslip
            </Link>
            <button
              type="button"
              className="btn btn-erp-ghost text-danger"
              data-bs-toggle="modal"
              data-bs-target="#deleteRecordModal"
              data-record-name={rec?.code ?? "SAL-00001"}
              data-record-action={`/hr/payroll/${rec?.id ?? 1}`}
              onClick={() =>
                setDeleteTarget({ id: rec?.id ?? 1, name: rec?.code ?? "SAL-00001" })
              }
            >
              <i className="fa-solid fa-trash-can me-2"></i>Delete
            </button>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-4">
            <div className="erp-card p-3">
              <div className="erp-cv-block">
                <div className="erp-cv-block-head">
                  <i className="fa-solid fa-file-lines"></i>
                  <h3>Disbursement</h3>
                </div>
                <div className="erp-deflist">
                  <div className="erp-def">
                    <span className="erp-def-label">Employee</span>
                    <span className="erp-def-value">
                      {rec?.employeeName ?? "MD. GOLAM RABBANY RONY"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Designation</span>
                    <span className="erp-def-value">
                      {empObj?.designationName ?? "Project Coordinator"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Branch</span>
                    <span className="erp-def-value">Company-wide</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Period</span>
                    <span className="erp-def-value">{rec?.period ?? "November 2026"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Disbursed On</span>
                    <span className="erp-def-value">{rec?.disbursedOn ?? "11 Nov 2026"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Method</span>
                    <span className="erp-def-value">{rec?.paymentMethod || "—"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Paid From</span>
                    <span className="erp-def-value">—</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Voucher</span>
                    <span className="erp-def-value is-empty">—</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Created By</span>
                    <span className="erp-def-value">System Administrator</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="erp-card p-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="erp-cv-block-head erp-block-head-sm mb-2">
                    <i className="fa-solid fa-plus text-success"></i>
                    <h3>Earnings</h3>
                  </div>
                  <table className="table erp-table mb-0" style={{ fontSize: "12.5px" }}>
                    <tbody>
                      <tr>
                        <td className="erp-cell-strong">Basic Salary</td>
                        <td className="text-end">{(rec?.basic ?? 0).toFixed(2)}</td>
                      </tr>
                      <tr className="erp-cell-strong">
                        <td>Gross</td>
                        <td className="text-end">
                          BDT {((rec?.basic ?? 0) + (rec?.allowances ?? 0)).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <div className="erp-cv-block-head erp-block-head-sm mb-2">
                    <i className="fa-solid fa-minus text-danger"></i>
                    <h3>Deductions</h3>
                  </div>
                  <table className="table erp-table mb-0" style={{ fontSize: "12.5px" }}>
                    <tbody>
                      <tr>
                        <td className="text-muted" colSpan={2}>
                          No deductions
                        </td>
                      </tr>
                      <tr className="erp-cell-strong">
                        <td>Total Deductions</td>
                        <td className="text-end">BDT {(rec?.deductions ?? 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                className="d-flex justify-content-end align-items-center mt-3 pt-3"
                style={{ borderTop: "2px solid var(--erp-primary)" }}
              >
                <span className="me-3" style={{ fontSize: "15px" }}>
                  Net Payable
                </span>
                <span className="text-success" style={{ fontSize: "20px", fontWeight: 700 }}>
                  BDT {(rec?.net ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`modal fade ${deleteTarget ? "show d-block" : ""}`}
          id="deleteRecordModal"
          tabIndex={-1}
          aria-hidden={!deleteTarget}
          style={deleteTarget ? { backgroundColor: "rgba(15,23,42,0.5)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ border: "none", borderRadius: "14px" }}>
              <div className="modal-body p-4">
                <div className="d-flex gap-3">
                  <div className="erp-kpi-icon is-danger">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div>
                    <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                      Delete disbursement?
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                      <strong data-delete-name>{deleteTarget?.name}</strong> will be removed from
                      active use. The record is retained and can be restored by an administrator.
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  data-bs-dismiss="modal"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>
                <form method="POST" data-delete-form onSubmit={handleDeleteConfirm}>
                  <input type="hidden" name="_method" value="DELETE" />
                  <button
                    type="submit"
                    className="btn btn-erp"
                    disabled={submitting}
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

  // ============================================================================
  // MODE 5: PAYSLIP (/hr/payroll/[id]/payslip)
  // ============================================================================
  return (
    <div className="container ">
      <div className="erp-pagehead d-print-none">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div>
            <h1>Payslip</h1>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href={`/hr/payroll/${rec?.id ?? 1}`} className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back
          </Link>
          <button type="button" className="btn btn-erp" onClick={() => window.print()}>
            <i className="fa-solid fa-print me-2"></i>Print
          </button>
        </div>
      </div>

      <div className="erp-card p-4 mx-auto" style={{ maxWidth: "820px" }}>
        <div
          className="d-flex justify-content-between align-items-start pb-3"
          style={{ borderBottom: "2px solid var(--erp-primary)" }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>E-Hishabi ERP</h2>
            <div className="text-muted" style={{ fontSize: "12px" }}>
              Head office, Dhaka
            </div>
          </div>
          <div className="text-end">
            <div style={{ fontSize: "15px", fontWeight: 600 }}>PAYSLIP</div>
            <div className="text-muted" style={{ fontSize: "12px" }}>
              {rec?.code ?? "SAL-00001"}
            </div>
            <div className="text-muted" style={{ fontSize: "12px" }}>
              {rec?.period ?? "November 2026"}
            </div>
          </div>
        </div>

        <div className="row g-2 py-3" style={{ fontSize: "12.5px" }}>
          <div className="col-6">
            <strong>Employee:</strong> {rec?.employeeName ?? "MD. GOLAM RABBANY RONY"}
          </div>
          <div className="col-6 text-end">
            <strong>Code:</strong> {empObj?.code ?? "EMP-0002"}
          </div>
          <div className="col-6">
            <strong>Designation:</strong> {empObj?.designationName ?? "Project Coordinator"}
          </div>
          <div className="col-6 text-end">
            <strong>Department:</strong> {empObj?.departmentName ?? "Administration"}
          </div>
          <div className="col-6">
            <strong>Branch:</strong> Company-wide
          </div>
          <div className="col-6 text-end">
            <strong>Paid On:</strong> {rec?.disbursedOn ?? "11 Nov 2026"}
          </div>
        </div>

        <div className="row g-0" style={{ border: "1px solid var(--erp-line)" }}>
          <div className="col-6" style={{ borderRight: "1px solid var(--erp-line)" }}>
            <div
              className="p-2 erp-cell-strong"
              style={{
                background: "var(--erp-surface-2)",
                borderBottom: "1px solid var(--erp-line)",
              }}
            >
              Earnings
            </div>
            <table className="table mb-0" style={{ fontSize: "12.5px" }}>
              <tbody>
                <tr>
                  <td className="ps-2">Basic Salary</td>
                  <td className="text-end pe-2">{(rec?.basic ?? 0).toFixed(2)}</td>
                </tr>
                <tr className="erp-cell-strong">
                  <td className="ps-2">Gross</td>
                  <td className="text-end pe-2">
                    {((rec?.basic ?? 0) + (rec?.allowances ?? 0)).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="col-6">
            <div
              className="p-2 erp-cell-strong"
              style={{
                background: "var(--erp-surface-2)",
                borderBottom: "1px solid var(--erp-line)",
              }}
            >
              Deductions
            </div>
            <table className="table mb-0" style={{ fontSize: "12.5px" }}>
              <tbody>
                <tr>
                  <td className="ps-2 text-muted">—</td>
                  <td></td>
                </tr>
                <tr className="erp-cell-strong">
                  <td className="ps-2">Total</td>
                  <td className="text-end pe-2">{(rec?.deductions ?? 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          className="d-flex justify-content-between align-items-center p-3 mt-2"
          style={{ background: "var(--erp-surface-2)", borderRadius: "8px" }}
        >
          <span style={{ fontSize: "15px", fontWeight: 600 }}>Net Payable</span>
          <span style={{ fontSize: "20px", fontWeight: 700 }}>
            BDT {(rec?.net ?? 0).toFixed(2)}
          </span>
        </div>

        <div className="row g-2 mt-5 pt-4" style={{ fontSize: "12px" }}>
          <div className="col-6 text-center">
            <div style={{ borderTop: "1px solid var(--erp-ink)", paddingTop: "4px" }}>
              Employee Signature
            </div>
          </div>
          <div className="col-6 text-center">
            <div style={{ borderTop: "1px solid var(--erp-ink)", paddingTop: "4px" }}>
              Authorised Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
