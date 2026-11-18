"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";
import type { EmployeeRow } from "./HrEmployeesClient";

export interface SalaryStructureRow {
  id: number;
  employeeId: number | null;
  employeeName: string;
  branchId: number | null;
  basicSalary: number;
  effectiveFrom: string | null;
  note: string | null;
  allowancesJson: string;
  status: string;
}

export interface DeductionHeadRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isFixed: boolean;
  isActive: boolean;
}

interface Props {
  mode: "structures" | "structure-create" | "deduction-heads";
  structures?: SalaryStructureRow[];
  heads?: DeductionHeadRow[];
  employees: EmployeeRow[];
  branches: Array<{ id: number; code: string; name: string }>;
}

export default function HrCompensationClient({
  mode,
  structures = [],
  heads = [],
  employees,
  branches,
}: Props) {
  const router = useRouter();

  // Filter states
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; kind: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Salary structure create states
  const [employeeId, setEmployeeId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [note, setNote] = useState("");
  const [allowRows, setAllowRows] = useState<Array<{ name: string; type: string; amount: string }>>([
    { name: "", type: "fixed", amount: "" },
  ]);

  // Deduction head modal states
  const [headModalOpen, setHeadModalOpen] = useState(false);
  const [editingHeadId, setEditingHeadId] = useState<number | null>(null);
  const [headCode, setHeadCode] = useState("");
  const [headName, setHeadName] = useState("");
  const [headDescription, setHeadDescription] = useState("");
  const [headIsFixed, setHeadIsFixed] = useState(true);
  const [headIsActive, setHeadIsActive] = useState(true);

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/salary-structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId ? Number(employeeId) : 1,
          branch_id: branchId ? Number(branchId) : null,
          basic_salary: Number(basicSalary) || 0,
          effective_from: effectiveFrom || null,
          note: note || null,
          allowances: allowRows
            .filter((r) => r.name || r.amount)
            .map((r) => ({ name: r.name, type: r.type, amount: Number(r.amount) || 0 })),
        }),
      });
      if (res.ok) {
        router.push("/hr/salary-structures");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveHead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingHeadId
        ? `/api/hr/deduction-heads/${editingHeadId}`
        : "/api/hr/deduction-heads";
      const method = editingHeadId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: headCode,
          name: headName,
          description: headDescription,
          is_fixed: headIsFixed,
          is_active: headIsActive,
        }),
      });
      if (res.ok) {
        setHeadModalOpen(false);
        setEditingHeadId(null);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hr/${deleteTarget.kind}/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // MODE 1: SALARY STRUCTURES LIST (/hr/salary-structures)
  // ============================================================================
  if (mode === "structures") {
    const filtered = structures.filter((s) => {
      if (search.trim()) {
        if (!s.employeeName.toLowerCase().includes(search.trim().toLowerCase())) return false;
      }
      if (branchFilter && String(s.branchId ?? "") !== branchFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      return true;
    });

    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-sitemap"></i>
            </div>
            <div>
              <h1>Salary Structures</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">HR</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Salary Structures
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() => downloadCsv("salary-structures.csv", ["Employee", "Basic Salary", "Effective From", "Status"], filtered.map((r) => [r.employeeName, r.basicSalary, r.effectiveFrom, r.status]))}
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/hr/salary-structures/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Structure
            </Link>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-toolbar">
            <form
              method="GET"
              action="/hr/salary-structures"
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
                  placeholder="Search employee…"
                  aria-label="Search"
                />
              </div>
              <select
                name="branch_id"
                className="form-select erp-select"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                aria-label="Branch"
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <select
                name="status"
                className="form-select erp-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Status"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Closed</option>
              </select>
            </form>
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} structures
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-sitemap"></i>
              </div>
              <h3>No salary structures yet</h3>
              <p>
                Define each employee&apos;s basic pay and recurring allowances so payroll can
                disburse against them.
              </p>
              <Link href="/hr/salary-structures/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Structure
              </Link>
            </div>
          ) : (
            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th className="text-end">Basic Salary</th>
                      <th>Effective From</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id}>
                        <td className="erp-cell-strong">{s.employeeName}</td>
                        <td className="text-end">BDT {s.basicSalary.toFixed(2)}</td>
                        <td>{s.effectiveFrom || "—"}</td>
                        <td>
                          <span className="erp-pill is-available">Active</span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            data-bs-toggle="modal"
                            data-bs-target="#deleteRecordModal"
                            onClick={() =>
                              setDeleteTarget({
                                id: s.id,
                                name: s.employeeName,
                                kind: "salary-structures",
                              })
                            }
                          >
                            <i className="fa-solid fa-trash-can"></i>
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
                      Delete salary structure?
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
  // MODE 2: NEW SALARY STRUCTURE (/hr/salary-structures/create)
  // ============================================================================
  if (mode === "structure-create") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-sitemap"></i>
            </div>
            <div>
              <h1>New Salary Structure</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/hr/salary-structures">Salary Structures</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    New
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        <form
          method="POST"
          action="/hr/salary-structures"
          onSubmit={handleSaveStructure}
          className="erp-form"
          data-structure-form
        >
          <datalist id="allowanceTypeList">
            <option value="House Rent"></option>
            <option value="Medical"></option>
            <option value="Transport"></option>
            <option value="Food"></option>
            <option value="Mobile"></option>
            <option value="Overtime"></option>
            <option value="Special Allowance"></option>
          </datalist>

          <div className="erp-card p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="erp-field">
                  <label className="form-label">
                    Employee <span className="erp-required">*</span>
                  </label>
                  <select
                    name="employee_id"
                    className="form-select "
                    data-select2
                    data-placeholder="Select employee"
                    data-structure-employee
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
                    data-structure-branch
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
                    Basic Salary <span className="erp-required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="basic_salary"
                    className="form-control "
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label className="form-label">Effective From</label>
                  <input
                    type="date"
                    name="effective_from"
                    className="form-control"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label className="form-label">Note</label>
                  <input
                    type="text"
                    name="note"
                    className="form-control"
                    maxLength={1000}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="erp-divider my-3" />

            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="erp-cv-block-head erp-block-head-sm mb-0">
                <i className="fa-solid fa-coins"></i>
                <h3>Allowance Heads</h3>
              </div>
              <button
                type="button"
                className="btn btn-erp-ghost btn-sm"
                data-allow-add
                onClick={() =>
                  setAllowRows((prev) => [...prev, { name: "", type: "fixed", amount: "" }])
                }
              >
                <i className="fa-solid fa-plus me-1"></i>Add allowance
              </button>
            </div>

            <div className="erp-table-wrap">
              <table className="table erp-table mb-0" style={{ fontSize: "12.5px" }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: "200px" }}>Allowance</th>
                    <th style={{ width: "150px" }}>Type</th>
                    <th style={{ width: "150px" }}>Amount</th>
                    <th style={{ width: "44px" }}></th>
                  </tr>
                </thead>
                <tbody data-allow-body>
                  {allowRows.map((row, idx) => (
                    <tr key={idx} data-allow-row>
                      <td>
                        <input
                          type="text"
                          name={`allowances[${idx}][name]`}
                          list="allowanceTypeList"
                          className="form-control form-control-sm"
                          value={row.name}
                          onChange={(e) =>
                            setAllowRows((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, name: e.target.value } : item
                              )
                            )
                          }
                          placeholder="e.g. House Rent"
                        />
                      </td>
                      <td>
                        <select
                          name={`allowances[${idx}][type]`}
                          className="form-select form-select-sm"
                          value={row.type}
                          onChange={(e) =>
                            setAllowRows((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, type: e.target.value } : item
                              )
                            )
                          }
                        >
                          <option value="fixed">Fixed</option>
                          <option value="percentage">% of Basic</option>
                        </select>
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
                            setAllowRows((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, amount: e.target.value } : item
                              )
                            )
                          }
                          placeholder="0"
                        />
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm p-1 text-danger"
                          data-allow-remove
                          onClick={() =>
                            setAllowRows((prev) =>
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

            <div className="d-flex justify-content-end gap-2 mt-3">
              <Link href="/hr/salary-structures" className="btn btn-erp-ghost">
                Cancel
              </Link>
              <button type="submit" className="btn btn-erp" data-submit disabled={submitting}>
                <i className="fa-solid fa-floppy-disk me-2"></i>Save Structure
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ============================================================================
  // MODE 3: DEDUCTION HEADS (/hr/deduction-heads)
  // ============================================================================
  const filteredHeads = heads.filter((h) => {
    if (search.trim()) {
      const hay = `${h.code} ${h.name}`.toLowerCase();
      if (!hay.includes(search.trim().toLowerCase())) return false;
    }
    if (statusFilter === "active" && !h.isActive) return false;
    if (statusFilter === "inactive" && h.isActive) return false;
    return true;
  });

  const openNewHeadModal = () => {
    setEditingHeadId(null);
    setHeadCode("");
    setHeadName("");
    setHeadDescription("");
    setHeadIsFixed(true);
    setHeadIsActive(true);
    setHeadModalOpen(true);
  };

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-money-bill-transfer"></i>
          </div>
          <div>
            <h1>Deduction Heads</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">HR</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Deduction Heads
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() => downloadCsv("deduction-heads.csv", ["Code", "Name", "Fixed", "Active"], filteredHeads.map((r) => [r.code, r.name, r.isFixed, r.isActive]))}
          >
            <i className="fa-solid fa-file-excel me-2"></i>Export
          </button>
          <button
            type="button"
            className="btn btn-erp"
            data-head-add
            onClick={openNewHeadModal}
          >
            <i className="fa-solid fa-plus me-2"></i>New Deduction Head
          </button>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/hr/deduction-heads"
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
                placeholder="Search name or code…"
                aria-label="Search"
              />
            </div>
            <select
              name="status"
              className="form-select erp-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {filteredHeads.length} heads
          </span>
        </div>

        {filteredHeads.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-money-bill-transfer"></i>
            </div>
            <h3>No deduction heads yet</h3>
            <p>
              Define the deductions you apply at payroll time — PF, tax, advance recovery, loan
              instalments.
            </p>
            <button
              type="button"
              className="btn btn-erp"
              data-head-add
              onClick={openNewHeadModal}
            >
              <i className="fa-solid fa-plus me-2"></i>New Deduction Head
            </button>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Basis</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHeads.map((h) => (
                    <tr key={h.id}>
                      <td className="erp-cell-strong">{h.code}</td>
                      <td>{h.name}</td>
                      <td>{h.description || "—"}</td>
                      <td>
                        <span className="erp-pill is-neutral">
                          {h.isFixed ? "Fixed amount" : "Variable"}
                        </span>
                      </td>
                      <td>
                        <span className={`erp-pill ${h.isActive ? "is-available" : "is-neutral"}`}>
                          {h.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm"
                          title="Edit"
                          onClick={() => {
                            setEditingHeadId(h.id);
                            setHeadCode(h.code);
                            setHeadName(h.name);
                            setHeadDescription(h.description ?? "");
                            setHeadIsFixed(h.isFixed);
                            setHeadIsActive(h.isActive);
                            setHeadModalOpen(true);
                          }}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          title="Delete"
                          data-bs-toggle="modal"
                          data-bs-target="#deleteRecordModal"
                          onClick={() =>
                            setDeleteTarget({
                              id: h.id,
                              name: h.name,
                              kind: "deduction-heads",
                            })
                          }
                        >
                          <i className="fa-solid fa-trash-can"></i>
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

      <div
        className={`modal fade ${headModalOpen ? "show d-block" : ""}`}
        id="headModal"
        tabIndex={-1}
        aria-hidden={!headModalOpen}
        style={headModalOpen ? { backgroundColor: "rgba(15,23,42,0.5)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            onSubmit={handleSaveHead}
            className="modal-content erp-form"
            data-head-form
            style={{ border: "none", borderRadius: "14px" }}
          >
            <input
              type="hidden"
              name="_method"
              value={editingHeadId ? "PUT" : "POST"}
              data-head-method
            />
            <div className="modal-body p-4">
              <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: 600 }} data-head-title>
                {editingHeadId ? "Edit Deduction Head" : "New Deduction Head"}
              </h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">
                      Code <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      className="form-control"
                      maxLength={30}
                      data-field="code"
                      value={headCode}
                      onChange={(e) => setHeadCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="erp-field">
                    <label className="form-label">
                      Name <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      maxLength={120}
                      data-field="name"
                      value={headName}
                      onChange={(e) => setHeadName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="erp-field">
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      name="description"
                      className="form-control"
                      maxLength={1000}
                      data-field="description"
                      value={headDescription}
                      onChange={(e) => setHeadDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-3 mt-1">
                <label className="erp-check mb-0">
                  <input
                    type="checkbox"
                    name="is_fixed"
                    value="1"
                    checked={headIsFixed}
                    onChange={(e) => setHeadIsFixed(e.target.checked)}
                    data-field="is_fixed"
                  />
                  <span>Fixed amount</span>
                </label>
                <label className="erp-check mb-0">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="1"
                    checked={headIsActive}
                    onChange={(e) => setHeadIsActive(e.target.checked)}
                    data-field="is_active"
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setHeadModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" disabled={submitting}>
                <i className="fa-solid fa-floppy-disk me-2"></i>Save
              </button>
            </div>
          </form>
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
                    Delete deduction head?
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
