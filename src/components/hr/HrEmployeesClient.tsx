"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

export interface EmployeeRow {
  id: number;
  code: string;
  firstName: string;
  lastName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  maritalStatus: string | null;
  bloodGroup: string | null;
  religion: string | null;
  nationality: string | null;
  fatherName: string | null;
  motherName: string | null;
  spouseName: string | null;
  nationalId: string | null;
  passportNo: string | null;
  tin: string | null;
  workEmail: string | null;
  personalEmail: string | null;
  phone: string | null;
  personalPhone: string | null;
  presentAddress: string | null;
  presentCity: string | null;
  presentCountry: string | null;
  permanentAddress: string | null;
  permanentCity: string | null;
  permanentCountry: string | null;
  departmentId: number | null;
  departmentName: string | null;
  designationId: number | null;
  designationName: string | null;
  branchId: number | null;
  shiftId: number | null;
  reportingTo: number | null;
  employmentType: string;
  employmentStatus: string;
  dateJoined: string | null;
  probationEndDate: string | null;
  confirmationDate: string | null;
  separationDate: string | null;
  separationReason: string | null;
  userId: number | null;
  grossSalary: number;
  basicSalary: number;
  salaryCurrency: string;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankRoutingNumber: string | null;
  notes: string | null;
  contactsJson?: string;
  educationJson?: string;
  experienceJson?: string;
  dependentsJson?: string;
  documentsJson?: string;
}

export interface HrCommonRefs {
  branches: Array<{ id: number; code: string; name: string }>;
  departments: Array<{ id: number; code: string; name: string }>;
  designations: Array<{ id: number; name: string }>;
  shifts: Array<{ id: number; name: string }>;
  users: Array<{ id: number; name: string; email: string }>;
  employees: EmployeeRow[];
}

interface Props extends HrCommonRefs {
  mode: "list" | "tree" | "create" | "edit" | "detail";
  employee?: EmployeeRow;
}

function getInitials(emp: EmployeeRow) {
  const full = `${emp.firstName} ${emp.lastName ?? ""}`.trim();
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return full.slice(0, 2).toUpperCase() || "EM";
}

function getFullName(emp: EmployeeRow) {
  return `${emp.firstName} ${emp.lastName ?? ""}`.trim();
}

function formatEmploymentType(t: string) {
  const map: Record<string, string> = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    consultant: "Consultant",
    intern: "Intern",
    daily_labour: "Daily Labour",
  };
  return map[t] ?? t;
}

function formatStatusLabel(s: string) {
  const map: Record<string, string> = {
    probation: "Probation",
    active: "Active",
    on_leave: "On Leave",
    suspended: "Suspended",
    resigned: "Resigned",
    terminated: "Terminated",
  };
  return map[s] ?? s;
}

export default function HrEmployeesClient({
  mode,
  employee,
  branches,
  departments,
  designations,
  shifts,
  users,
  employees,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // List filter states
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [deptFilter, setDeptFilter] = useState(searchParams.get("department_id") ?? "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("employment_type") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Tree states
  const [treeSearch, setTreeSearch] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<number[]>([]);
  const [zoom, setZoom] = useState(100);
  const [compactLayout, setCompactLayout] = useState(false);

  // Wizard step state (1..5)
  const [activeStep, setActiveStep] = useState(1);

  // Detail tab & modal states
  const [activeTab, setActiveTab] = useState<"overview" | "contacts" | "education" | "experience" | "dependents" | "documents">("overview");
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [statusVal, setStatusVal] = useState(employee?.employmentStatus ?? "active");
  const [separationDate, setSeparationDate] = useState(employee?.separationDate ?? "2026-11-18");
  const [separationReason, setSeparationReason] = useState(employee?.separationReason ?? "");
  const [isCurrentRole, setIsCurrentRole] = useState(false);
  const [isNominee, setIsNominee] = useState(false);
  const [docUploadRows, setDocUploadRows] = useState<Array<{ type: string; title: string }>>([
    { type: "national_id", title: "" },
  ]);

  // Wizard form state (48 fields)
  const [form, setForm] = useState({
    first_name: employee?.firstName ?? "",
    last_name: employee?.lastName ?? "",
    gender: employee?.gender ?? (mode === "edit" ? "male" : ""),
    date_of_birth: employee?.dateOfBirth ?? "",
    marital_status: employee?.maritalStatus ?? (mode === "edit" ? "married" : ""),
    blood_group: employee?.bloodGroup ?? "",
    religion: employee?.religion ?? "",
    nationality: employee?.nationality ?? "",
    father_name: employee?.fatherName ?? "",
    mother_name: employee?.motherName ?? "",
    spouse_name: employee?.spouseName ?? "",
    national_id: employee?.nationalId ?? "",
    passport_no: employee?.passportNo ?? "",
    tin: employee?.tin ?? "",
    work_email: employee?.workEmail ?? "",
    personal_email: employee?.personalEmail ?? "",
    phone: employee?.phone ?? "",
    personal_phone: employee?.personalPhone ?? "",
    present_address: employee?.presentAddress ?? "",
    present_city: employee?.presentCity ?? "",
    present_country: employee?.presentCountry ?? "BD",
    permanent_address: employee?.permanentAddress ?? "",
    permanent_city: employee?.permanentCity ?? "",
    permanent_country: employee?.permanentCountry ?? "BD",
    department_id: employee?.departmentId ? String(employee.departmentId) : "",
    designation_id: employee?.designationId ? String(employee.designationId) : "",
    branch_id: employee?.branchId ? String(employee.branchId) : "",
    shift_id: employee?.shiftId ? String(employee.shiftId) : "",
    reporting_to: employee?.reportingTo ? String(employee.reportingTo) : "",
    employment_type: employee?.employmentType ?? "full_time",
    employment_status: employee?.employmentStatus ?? (mode === "create" ? "probation" : "active"),
    date_joined: employee?.dateJoined ?? "",
    probation_end_date: employee?.probationEndDate ?? "",
    confirmation_date: employee?.confirmationDate ?? "",
    separation_date: employee?.separationDate ?? "",
    separation_reason: employee?.separationReason ?? "",
    user_id: employee?.userId ? String(employee.userId) : "",
    create_account: false,
    gross_salary: employee?.grossSalary !== undefined && mode === "edit" ? String(employee.grossSalary) : "",
    basic_salary: employee?.basicSalary !== undefined && mode === "edit" ? String(employee.basicSalary) : "",
    salary_currency: employee?.salaryCurrency ?? (mode === "edit" ? "BDT" : ""),
    bank_name: employee?.bankName ?? "",
    bank_branch: employee?.bankBranch ?? "",
    bank_account_name: employee?.bankAccountName ?? "",
    bank_account_number: employee?.bankAccountNumber ?? "",
    bank_routing_number: employee?.bankRoutingNumber ?? "",
    notes: employee?.notes ?? "",
  });

  const updateField = (k: keyof typeof form, v: string | boolean) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const handleCopyPresentAddress = () => {
    setForm((prev) => ({
      ...prev,
      permanent_address: prev.present_address,
      permanent_city: prev.present_city,
      permanent_country: prev.present_country,
    }));
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = mode === "edit" && employee ? `/api/hr/employees/${employee.id}` : "/api/hr/employees";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/hr/employees");
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
      const res = await fetch(`/api/hr/employees/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        router.push("/hr/employees");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    setSubmitting(true);
    try {
      await fetch(`/api/hr/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employment_status: statusVal,
          separation_date: separationDate,
          separation_reason: separationReason,
        }),
      });
      setOpenModal(null);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // MODE 1: LIST VIEW (/hr/employees)
  // ============================================================================
  if (mode === "list") {
    const filtered = employees.filter((emp) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const hay = `${emp.firstName} ${emp.lastName ?? ""} ${emp.code} ${emp.workEmail ?? ""} ${emp.nationalId ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (deptFilter && String(emp.departmentId ?? "") !== deptFilter) return false;
      if (typeFilter && emp.employmentType !== typeFilter) return false;
      if (statusFilter && emp.employmentStatus !== statusFilter) return false;
      return true;
    });

    const countByStatus = (st: string) => employees.filter((e) => e.employmentStatus === st).length;

    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-id-badge"></i>
            </div>
            <div>
              <h1>Employees</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">HR</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Employees
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <Link href="/hr/employees/tree" className="btn btn-erp-ghost">
              <i className="fa-solid fa-sitemap me-2"></i>Tree View
            </Link>
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() => downloadCsv("employees.csv", ["Code", "Name", "Designation", "Department", "Type", "Status"], filtered.map((r) => [r.code, `${r.firstName} ${r.lastName ?? ""}`.trim(), r.designationName, r.departmentName, r.employmentType, r.employmentStatus]))}
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/settings/code-sequences" className="btn btn-erp-ghost">
              <i className="fa-solid fa-hashtag me-2"></i>Code Format
            </Link>
            <Link href="/hr/employees/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Employee
            </Link>
          </div>
        </div>

        <div className="erp-statrow">
          <a
            href="/hr/employees?status=probation"
            onClick={(e) => {
              e.preventDefault();
              setStatusFilter(statusFilter === "probation" ? "" : "probation");
            }}
            className={`erp-stat ${statusFilter === "probation" ? "is-active" : ""}`}
          >
            <span className="erp-stat-icon">
              <i className="fa-solid fa-hourglass-half"></i>
            </span>
            <span className="erp-stat-body">
              <strong>{countByStatus("probation")}</strong>
              <small>Probation</small>
            </span>
          </a>
          <a
            href="/hr/employees?status=active"
            onClick={(e) => {
              e.preventDefault();
              setStatusFilter(statusFilter === "active" ? "" : "active");
            }}
            className={`erp-stat ${statusFilter === "active" ? "is-active" : ""}`}
          >
            <span className="erp-stat-icon">
              <i className="fa-solid fa-circle-check"></i>
            </span>
            <span className="erp-stat-body">
              <strong>{countByStatus("active")}</strong>
              <small>Active</small>
            </span>
          </a>
          <a
            href="/hr/employees?status=on_leave"
            onClick={(e) => {
              e.preventDefault();
              setStatusFilter(statusFilter === "on_leave" ? "" : "on_leave");
            }}
            className={`erp-stat ${statusFilter === "on_leave" ? "is-active" : ""}`}
          >
            <span className="erp-stat-icon">
              <i className="fa-solid fa-plane-departure"></i>
            </span>
            <span className="erp-stat-body">
              <strong>{countByStatus("on_leave")}</strong>
              <small>On Leave</small>
            </span>
          </a>
          <a
            href="/hr/employees?status=suspended"
            onClick={(e) => {
              e.preventDefault();
              setStatusFilter(statusFilter === "suspended" ? "" : "suspended");
            }}
            className={`erp-stat ${statusFilter === "suspended" ? "is-active" : ""}`}
          >
            <span className="erp-stat-icon">
              <i className="fa-solid fa-ban"></i>
            </span>
            <span className="erp-stat-body">
              <strong>{countByStatus("suspended")}</strong>
              <small>Suspended</small>
            </span>
          </a>
          <a
            href="/hr/employees?status=resigned"
            onClick={(e) => {
              e.preventDefault();
              setStatusFilter(statusFilter === "resigned" ? "" : "resigned");
            }}
            className={`erp-stat ${statusFilter === "resigned" ? "is-active" : ""}`}
          >
            <span className="erp-stat-icon">
              <i className="fa-solid fa-right-from-bracket"></i>
            </span>
            <span className="erp-stat-body">
              <strong>{countByStatus("resigned")}</strong>
              <small>Resigned</small>
            </span>
          </a>
          <a
            href="/hr/employees?status=terminated"
            onClick={(e) => {
              e.preventDefault();
              setStatusFilter(statusFilter === "terminated" ? "" : "terminated");
            }}
            className={`erp-stat ${statusFilter === "terminated" ? "is-active" : ""}`}
          >
            <span className="erp-stat-icon">
              <i className="fa-solid fa-user-slash"></i>
            </span>
            <span className="erp-stat-body">
              <strong>{countByStatus("terminated")}</strong>
              <small>Terminated</small>
            </span>
          </a>
        </div>

        <div className="erp-card">
          <div className="erp-toolbar">
            <form
              method="GET"
              action="/hr/employees"
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
                  placeholder="Search name, code, email, NID…"
                  aria-label="Search employees"
                />
              </div>

              <select
                name="department_id"
                className="form-select erp-select"
                aria-label="Department filter"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                name="employment_type"
                className="form-select erp-select"
                aria-label="Type filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All types</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="consultant">Consultant</option>
                <option value="intern">Intern</option>
                <option value="daily_labour">Daily Labour</option>
              </select>

              <button type="submit" className="btn btn-erp-ghost">
                Filter
              </button>
            </form>

            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} employees
            </span>
          </div>

          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Code</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => {
                    const fullName = getFullName(emp);
                    return (
                      <tr key={emp.id}>
                        <td>
                          <div className="erp-identity">
                            <span className="erp-initials">{getInitials(emp)}</span>
                            <span>
                              <span className="erp-identity-name">
                                <Link href={`/hr/employees/${emp.id}`} className="erp-plain-link">
                                  {fullName}
                                </Link>
                              </span>
                              <span className="erp-identity-meta">
                                {emp.workEmail ?? "—"}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="erp-cell-strong">{emp.code}</td>
                        <td>{emp.designationName ?? "—"}</td>
                        <td>{emp.departmentName ?? "—"}</td>
                        <td>
                          <span className="erp-scope-tag">
                            {formatEmploymentType(emp.employmentType)}
                          </span>
                        </td>
                        <td>
                          <span className="erp-pill is-available">
                            <i className="fa-solid fa-circle-check me-1"></i>
                            {formatStatusLabel(emp.employmentStatus)}
                          </span>
                        </td>
                        <td>
                          <span className="erp-created-by">
                            <span className="erp-cell-strong">System Administrator</span>
                            <span className="erp-identity-meta d-block">10 Nov 2026</span>
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <Link
                            href={`/hr/employees/tree?focus=${emp.id}`}
                            className="btn btn-erp-ghost btn-sm"
                            title={`View ${fullName} in the org chart`}
                          >
                            <i className="fa-solid fa-sitemap"></i>
                          </Link>
                          <Link
                            href={`/hr/employees/${emp.id}`}
                            className="btn btn-erp-ghost btn-sm"
                            title="View"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </Link>
                          <Link
                            href={`/hr/employees/${emp.id}/edit`}
                            className="btn btn-erp-ghost btn-sm"
                            title="Edit"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </Link>
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            data-bs-toggle="modal"
                            data-bs-target="#deleteRecordModal"
                            data-record-name={fullName}
                            data-record-action={`/hr/employees/${emp.id}`}
                            onClick={() => setDeleteTarget({ id: emp.id, name: fullName })}
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
                      Delete employee?
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
  // MODE 2: TREE VIEW (/hr/employees/tree)
  // ============================================================================
  if (mode === "tree") {
    const filteredEmps = employees.filter((emp) => {
      if (deptFilter && String(emp.departmentId ?? "") !== deptFilter) return false;
      if (treeSearch.trim()) {
        const hay = `${emp.firstName} ${emp.lastName ?? ""} ${emp.code} ${emp.designationName ?? ""} ${emp.departmentName ?? ""}`.toLowerCase();
        if (!hay.includes(treeSearch.trim().toLowerCase())) return false;
      }
      return true;
    });

    const managerIds = new Set(employees.map((e) => e.reportingTo).filter(Boolean));
    const managersCount = employees.filter((e) => managerIds.has(e.id)).length;
    const icCount = employees.length - managersCount;
    const noManagerCount = employees.filter((e) => !e.reportingTo).length;

    const getChildren = (parentId: number) =>
      filteredEmps.filter((e) => e.reportingTo === parentId);

    const roots = filteredEmps.filter(
      (e) => !e.reportingTo || !filteredEmps.some((p) => p.id === e.reportingTo)
    );

    const renderTreeNode = (emp: EmployeeRow): React.ReactNode => {
      const children = getChildren(emp.id);
      const hasChildren = children.length > 0;
      const isClosed = collapsedIds.includes(emp.id);
      const fullName = getFullName(emp);

      return (
        <li
          key={emp.id}
          className={`erp-tree-item ctree-node ${hasChildren ? "has-children" : ""} ${
            isClosed ? "is-closed" : ""
          }`}
          data-tree-node
          data-id={emp.id}
          data-name={`${fullName} ${emp.code} ${emp.designationName ?? ""} ${emp.departmentName ?? ""}`.toLowerCase()}
        >
          <div className="erp-tree-card ctree-card">
            <div className="erp-tree-avatar ctree-avatar">
              <span>{getInitials(emp)}</span>
            </div>

            <div className="erp-tree-body ctree-body">
              <Link href={`/hr/employees/${emp.id}`} className="erp-tree-name ctree-name">
                {fullName}
              </Link>
              <span className="erp-tree-role ctree-role">{emp.designationName ?? "—"}</span>
              {emp.departmentName && (
                <span className="erp-tree-dept ctree-dept">{emp.departmentName}</span>
              )}
            </div>

            <div className="erp-tree-tags ctree-tags">
              {hasChildren && (
                <span
                  className="erp-tree-count ctree-count"
                  title={`${children.length} direct, ${children.length} in the whole branch`}
                >
                  <i className="fa-solid fa-users"></i>
                  {children.length}
                  <span className="text-muted">/{children.length}</span>
                </span>
              )}

              <Link
                href={`/hr/employees/tree?focus=${emp.id}`}
                className="erp-tree-focus"
                title={`Centre the chart on ${fullName}`}
              >
                <i className="fa-solid fa-crosshairs"></i>
              </Link>
            </div>

            {hasChildren && (
              <button
                type="button"
                className="erp-tree-toggle ctree-toggle"
                data-tree-toggle
                aria-expanded={!isClosed}
                aria-label={`Expand or collapse ${fullName}'s reports`}
                onClick={() =>
                  setCollapsedIds((prev) =>
                    prev.includes(emp.id) ? prev.filter((i) => i !== emp.id) : [...prev, emp.id]
                  )
                }
              >
                <i className={`fa-solid ${isClosed ? "fa-plus" : "fa-minus"}`}></i>
              </button>
            )}
          </div>

          {hasChildren && !isClosed && (
            <ul className="erp-tree-children ctree-children">
              {children.map((ch) => renderTreeNode(ch))}
            </ul>
          )}
        </li>
      );
    };

    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-sitemap"></i>
            </div>
            <div>
              <h1>Organisation Chart</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">HR</li>
                  <li className="breadcrumb-item">
                    <Link href="/hr/employees">Employees</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Reporting Tree
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <button
              type="button"
              className="btn btn-erp-ghost"
              data-tree-expand-all
              onClick={() => setCollapsedIds([])}
            >
              <i className="fa-solid fa-angles-down me-2"></i>Expand All
            </button>
            <button
              type="button"
              className="btn btn-erp-ghost"
              data-tree-collapse-all
              onClick={() => setCollapsedIds(employees.map((e) => e.id))}
            >
              <i className="fa-solid fa-angles-up me-2"></i>Collapse All
            </button>

            <div className="erp-chart-zoom" role="group" aria-label="Zoom">
              <button
                type="button"
                data-zoom-out
                title="Zoom out"
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
              >
                <i className="fa-solid fa-minus"></i>
              </button>
              <span data-zoom-level>{zoom}%</span>
              <button
                type="button"
                data-zoom-in
                title="Zoom in"
                onClick={() => setZoom((z) => Math.min(150, z + 10))}
              >
                <i className="fa-solid fa-plus"></i>
              </button>
              <button
                type="button"
                data-zoom-fit
                title="Fit to width"
                onClick={() => setZoom(100)}
              >
                <i className="fa-solid fa-compress"></i>
              </button>
            </div>
            <button
              type="button"
              className="btn btn-erp-ghost"
              data-layout-toggle
              title="Switch between the chart and a compact indented list"
              onClick={() => setCompactLayout((c) => !c)}
            >
              <i className="fa-solid fa-list-ul me-2"></i>
              <span data-layout-label>{compactLayout ? "Chart" : "Compact"}</span>
            </button>
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() => window.print()}
            >
              <i className="fa-solid fa-print me-2"></i>Print
            </button>
            <Link href="/hr/employees" className="btn btn-erp-ghost">
              <i className="fa-solid fa-list me-2"></i>List View
            </Link>
          </div>
        </div>

        <div className="erp-card mb-3">
          <div className="erp-card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="erp-stat">
                  <span className="erp-stat-label">Employees</span>
                  <strong className="erp-stat-value">{employees.length}</strong>
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-stat">
                  <span className="erp-stat-label">Managers</span>
                  <strong className="erp-stat-value">{managersCount}</strong>
                  <small className="text-muted d-block">people with at least one report</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-stat">
                  <span className="erp-stat-label">Individual Contributors</span>
                  <strong className="erp-stat-value">{icCount}</strong>
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-stat">
                  <span className="erp-stat-label">No Manager Set</span>
                  <strong className="erp-stat-value ">{noManagerCount}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="erp-card ctree-wrap" data-tree-root>
          <div className="erp-card-head">
            <form
              method="GET"
              action="/hr/employees/tree"
              onSubmit={(e) => e.preventDefault()}
              className="erp-filterbar"
            >
              <div className="erp-search erp-search-sm">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  data-tree-search
                  value={treeSearch}
                  onChange={(e) => setTreeSearch(e.target.value)}
                  placeholder="Find someone in the chart…"
                  aria-label="Search the chart"
                />
              </div>
              <select
                name="department_id"
                className="erp-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                aria-label="Department"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </form>
          </div>

          <div className="erp-card-body">
            <div className="erp-chart-viewport ctree-viewport" data-chart-viewport>
              <div
                className="erp-chart-canvas ctree-canvas"
                data-chart-canvas
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
              >
                <ul className={`erp-tree ctree-tree ${compactLayout ? "" : "is-crow"}`} data-tree>
                  {roots.map((r) => renderTreeNode(r))}
                </ul>
              </div>
            </div>

            <p
              className={`erp-cv-empty ${roots.length === 0 ? "" : "d-none"}`}
              data-tree-no-match
            >
              No one in the chart matches that search.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODE 3 & 4: CREATE & EDIT WIZARD (/hr/employees/create & /hr/employees/[id]/edit)
  // ============================================================================
  if (mode === "create" || mode === "edit") {
    const isEdit = mode === "edit" && !!employee;
    const fullName = employee ? getFullName(employee) : "New Employee";
    const isSeparated =
      form.employment_status === "resigned" || form.employment_status === "terminated";

    return (
      <div className="container erp-container-form">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-id-badge"></i>
            </div>
            <div>
              <h1>{isEdit ? fullName : "New Employee"}</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">HR</li>
                  <li className="breadcrumb-item">
                    <Link href="/hr/employees">Employees</Link>
                  </li>
                  {isEdit && employee ? (
                    <>
                      <li className="breadcrumb-item">
                        <Link href={`/hr/employees/${employee.id}`}>{employee.code}</Link>
                      </li>
                      <li className="breadcrumb-item active" aria-current="page">
                        Edit
                      </li>
                    </>
                  ) : (
                    <li className="breadcrumb-item active" aria-current="page">
                      New
                    </li>
                  )}
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            {isEdit && employee ? (
              <Link href={`/hr/employees/${employee.id}`} className="btn btn-erp-ghost">
                <i className="fa-solid fa-arrow-left me-2"></i>Back to profile
              </Link>
            ) : (
              <Link href="/hr/employees" className="btn btn-erp-ghost">
                <i className="fa-solid fa-arrow-left me-2"></i>Back to list
              </Link>
            )}
          </div>
        </div>

        <form
          method="POST"
          encType="multipart/form-data"
          action={isEdit && employee ? `/hr/employees/${employee.id}` : "/hr/employees"}
          onSubmit={handleSaveEmployee}
          className="erp-form erp-wizard"
          data-employee-form
          noValidate
          data-manager-options-url="/hr/employees/manager-options"
          data-company-id="1"
          data-employee-id={isEdit && employee ? String(employee.id) : ""}
        >
          {isEdit && <input type="hidden" name="_method" value="PUT" />}

          <div className="erp-context-banner">
            <span className="erp-context-banner-icon">
              <i className="fa-solid fa-building-columns"></i>
            </span>
            <div className="erp-context-banner-body">
              <strong>E-Hishabi ERP</strong>
              <span>
                {isEdit
                  ? "This employee belongs to HQ and stays with it."
                  : "Filed under HQ — switch companies from the top bar to change this."}
              </span>
            </div>
          </div>

          <div className="erp-card">
            <ol className="erp-wizard-steps" data-wizard-tabs>
              <li
                className={activeStep === 1 ? "is-active" : ""}
                data-step-tab="1"
                onClick={() => setActiveStep(1)}
                style={{ cursor: "pointer" }}
              >
                <span>1</span> Identity
              </li>
              <li
                className={activeStep === 2 ? "is-active" : ""}
                data-step-tab="2"
                onClick={() => setActiveStep(2)}
                style={{ cursor: "pointer" }}
              >
                <span>2</span> Personal
              </li>
              <li
                className={activeStep === 3 ? "is-active" : ""}
                data-step-tab="3"
                onClick={() => setActiveStep(3)}
                style={{ cursor: "pointer" }}
              >
                <span>3</span> Contact
              </li>
              <li
                className={activeStep === 4 ? "is-active" : ""}
                data-step-tab="4"
                onClick={() => setActiveStep(4)}
                style={{ cursor: "pointer" }}
              >
                <span>4</span> Posting
              </li>
              <li
                className={activeStep === 5 ? "is-active" : ""}
                data-step-tab="5"
                onClick={() => setActiveStep(5)}
                style={{ cursor: "pointer" }}
              >
                <span>5</span> Compensation
              </li>
            </ol>

            <div className="erp-wizard-panels">
              <fieldset data-step="1" hidden={activeStep !== 1}>
                <div className="erp-section-head">
                  <div className="erp-section-icon">
                    <i className="fa-solid fa-id-card"></i>
                  </div>
                  <div>
                    <h2>Identity</h2>
                    <p>Who this person is and how they appear across the system.</p>
                  </div>
                </div>
                <div className="erp-card-body">
                  <div className="erp-photo-field">
                    <div className="erp-photo-preview" data-photo-preview>
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <div className="flex-grow-1">
                      <label htmlFor="photo" className="form-label">
                        Photograph
                      </label>
                      <input
                        type="file"
                        id="photo"
                        name="photo"
                        accept="image/*"
                        className="form-control "
                        data-photo-input
                      />
                      <span className="erp-help">JPG, PNG or WebP up to 2 MB.</span>
                    </div>
                    {isEdit && employee && (
                      <div className="erp-code-chip">
                        <small>Employee code</small>
                        <strong>{employee.code}</strong>
                      </div>
                    )}
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="first_name" className="form-label">
                          First Name <span className="erp-required">*</span>
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          name="first_name"
                          className="form-control "
                          value={form.first_name}
                          onChange={(e) => updateField("first_name", e.target.value)}
                          maxLength={100}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="last_name" className="form-label">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          name="last_name"
                          className="form-control "
                          value={form.last_name}
                          onChange={(e) => updateField("last_name", e.target.value)}
                          maxLength={100}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </fieldset>

              <fieldset data-step="2" hidden={activeStep !== 2}>
                <div className="erp-section-head">
                  <div className="erp-section-icon">
                    <i className="fa-solid fa-address-card"></i>
                  </div>
                  <div>
                    <h2>Personal Details</h2>
                    <p>Bio data kept for records, statutory reporting and payroll.</p>
                  </div>
                </div>
                <div className="erp-card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="gender" className="form-label">
                          Gender
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          className="form-select "
                          value={form.gender}
                          onChange={(e) => updateField("gender", e.target.value)}
                        >
                          <option value="">—</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="date_of_birth" className="form-label">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          id="date_of_birth"
                          name="date_of_birth"
                          className="form-control "
                          value={form.date_of_birth}
                          onChange={(e) => updateField("date_of_birth", e.target.value)}
                          max="2026-11-18"
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="marital_status" className="form-label">
                          Marital Status
                        </label>
                        <select
                          id="marital_status"
                          name="marital_status"
                          className="form-select "
                          value={form.marital_status}
                          onChange={(e) => updateField("marital_status", e.target.value)}
                        >
                          <option value="">—</option>
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="blood_group" className="form-label">
                          Blood Group
                        </label>
                        <select
                          id="blood_group"
                          name="blood_group"
                          className="form-select "
                          value={form.blood_group}
                          onChange={(e) => updateField("blood_group", e.target.value)}
                        >
                          <option value="">—</option>
                          <option value="a_pos">A+</option>
                          <option value="a_neg">A-</option>
                          <option value="b_pos">B+</option>
                          <option value="b_neg">B-</option>
                          <option value="ab_pos">AB+</option>
                          <option value="ab_neg">AB-</option>
                          <option value="o_pos">O+</option>
                          <option value="o_neg">O-</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="religion" className="form-label">
                          Religion
                        </label>
                        <select
                          id="religion"
                          name="religion"
                          className="form-select "
                          value={form.religion}
                          onChange={(e) => updateField("religion", e.target.value)}
                        >
                          <option value="">—</option>
                          <option value="islam">Islam</option>
                          <option value="hinduism">Hinduism</option>
                          <option value="christianity">Christianity</option>
                          <option value="buddhism">Buddhism</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="nationality" className="form-label">
                          Nationality
                        </label>
                        <input
                          type="text"
                          id="nationality"
                          name="nationality"
                          className="form-control"
                          value={form.nationality}
                          onChange={(e) => updateField("nationality", e.target.value)}
                          maxLength={60}
                          placeholder="Bangladeshi"
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="father_name" className="form-label">
                          Father&apos;s Name
                        </label>
                        <input
                          type="text"
                          id="father_name"
                          name="father_name"
                          className="form-control"
                          value={form.father_name}
                          onChange={(e) => updateField("father_name", e.target.value)}
                          maxLength={150}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="mother_name" className="form-label">
                          Mother&apos;s Name
                        </label>
                        <input
                          type="text"
                          id="mother_name"
                          name="mother_name"
                          className="form-control"
                          value={form.mother_name}
                          onChange={(e) => updateField("mother_name", e.target.value)}
                          maxLength={150}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="spouse_name" className="form-label">
                          Spouse&apos;s Name
                        </label>
                        <input
                          type="text"
                          id="spouse_name"
                          name="spouse_name"
                          className="form-control"
                          value={form.spouse_name}
                          onChange={(e) => updateField("spouse_name", e.target.value)}
                          maxLength={150}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="erp-fieldset-label">Statutory identifiers</div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="national_id" className="form-label">
                          National ID
                        </label>
                        <input
                          type="text"
                          id="national_id"
                          name="national_id"
                          className="form-control "
                          value={form.national_id}
                          onChange={(e) => updateField("national_id", e.target.value)}
                          maxLength={40}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="passport_no" className="form-label">
                          Passport No.
                        </label>
                        <input
                          type="text"
                          id="passport_no"
                          name="passport_no"
                          className="form-control"
                          value={form.passport_no}
                          onChange={(e) => updateField("passport_no", e.target.value)}
                          maxLength={40}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="tin" className="form-label">
                          TIN
                        </label>
                        <input
                          type="text"
                          id="tin"
                          name="tin"
                          className="form-control"
                          value={form.tin}
                          onChange={(e) => updateField("tin", e.target.value)}
                          maxLength={40}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </fieldset>

              <fieldset data-step="3" hidden={activeStep !== 3}>
                <div className="erp-section-head">
                  <div className="erp-section-icon">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <div>
                    <h2>Contact &amp; Address</h2>
                    <p>How to reach them, and where they live.</p>
                  </div>
                </div>
                <div className="erp-card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="work_email" className="form-label">
                          Work Email
                        </label>
                        <input
                          type="email"
                          id="work_email"
                          name="work_email"
                          className="form-control "
                          value={form.work_email}
                          onChange={(e) => updateField("work_email", e.target.value)}
                          maxLength={150}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="personal_email" className="form-label">
                          Personal Email
                        </label>
                        <input
                          type="email"
                          id="personal_email"
                          name="personal_email"
                          className="form-control "
                          value={form.personal_email}
                          onChange={(e) => updateField("personal_email", e.target.value)}
                          maxLength={150}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="phone" className="form-label">
                          Official Phone
                        </label>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          className="form-control"
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          maxLength={40}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="personal_phone" className="form-label">
                          Personal Phone
                        </label>
                        <input
                          type="text"
                          id="personal_phone"
                          name="personal_phone"
                          className="form-control"
                          value={form.personal_phone}
                          onChange={(e) => updateField("personal_phone", e.target.value)}
                          maxLength={40}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="erp-fieldset-label">Present address</div>
                  <div className="row" data-address-group="present">
                    <div className="col-md-12">
                      <div className="erp-field">
                        <label htmlFor="present_address" className="form-label">
                          Street Address
                        </label>
                        <input
                          type="text"
                          id="present_address"
                          name="present_address"
                          className="form-control"
                          value={form.present_address}
                          onChange={(e) => updateField("present_address", e.target.value)}
                          maxLength={255}
                          data-address-field="address"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="present_city" className="form-label">
                          City / District
                        </label>
                        <input
                          type="text"
                          id="present_city"
                          name="present_city"
                          className="form-control"
                          value={form.present_city}
                          onChange={(e) => updateField("present_city", e.target.value)}
                          maxLength={100}
                          data-address-field="city"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="present_country" className="form-label">
                          Country
                        </label>
                        <select
                          id="present_country"
                          name="present_country"
                          className="form-select"
                          data-select2
                          data-placeholder="Select country"
                          data-address-field="country"
                          value={form.present_country}
                          onChange={(e) => updateField("present_country", e.target.value)}
                        >
                          <option value=""></option>
                          <option value="BD">Bangladesh</option>
                          <option value="IN">India</option>
                          <option value="US">United States</option>
                          <option value="GB">United Kingdom</option>
                          <option value="AE">United Arab Emirates</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="erp-fieldset-label d-flex align-items-center justify-content-between">
                    <span>Permanent address</span>
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm"
                      data-copy-address
                      onClick={handleCopyPresentAddress}
                    >
                      <i className="fa-solid fa-copy me-1"></i>Same as present
                    </button>
                  </div>
                  <div className="row" data-address-group="permanent">
                    <div className="col-md-12">
                      <div className="erp-field">
                        <label htmlFor="permanent_address" className="form-label">
                          Street Address
                        </label>
                        <input
                          type="text"
                          id="permanent_address"
                          name="permanent_address"
                          className="form-control"
                          value={form.permanent_address}
                          onChange={(e) => updateField("permanent_address", e.target.value)}
                          maxLength={255}
                          data-address-field="address"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="permanent_city" className="form-label">
                          City / District
                        </label>
                        <input
                          type="text"
                          id="permanent_city"
                          name="permanent_city"
                          className="form-control"
                          value={form.permanent_city}
                          onChange={(e) => updateField("permanent_city", e.target.value)}
                          maxLength={100}
                          data-address-field="city"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="permanent_country" className="form-label">
                          Country
                        </label>
                        <select
                          id="permanent_country"
                          name="permanent_country"
                          className="form-select"
                          data-select2
                          data-placeholder="Select country"
                          data-address-field="country"
                          value={form.permanent_country}
                          onChange={(e) => updateField("permanent_country", e.target.value)}
                        >
                          <option value=""></option>
                          <option value="BD">Bangladesh</option>
                          <option value="IN">India</option>
                          <option value="US">United States</option>
                          <option value="GB">United Kingdom</option>
                          <option value="AE">United Arab Emirates</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </fieldset>

              <fieldset data-step="4" hidden={activeStep !== 4}>
                <div className="erp-section-head">
                  <div className="erp-section-icon">
                    <i className="fa-solid fa-sitemap"></i>
                  </div>
                  <div>
                    <h2>Posting &amp; Employment</h2>
                    <p>Where they sit in the organisation and their terms of service.</p>
                  </div>
                </div>
                <div className="erp-card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="department_id" className="form-label">
                          Department
                        </label>
                        <select
                          id="department_id"
                          name="department_id"
                          className="form-select "
                          data-select2
                          data-placeholder="Select department"
                          value={form.department_id}
                          onChange={(e) => updateField("department_id", e.target.value)}
                        >
                          <option value=""></option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="designation_id" className="form-label">
                          Designation
                        </label>
                        <select
                          id="designation_id"
                          name="designation_id"
                          className="form-select "
                          data-select2
                          data-placeholder="Select designation"
                          value={form.designation_id}
                          onChange={(e) => updateField("designation_id", e.target.value)}
                        >
                          <option value=""></option>
                          {designations.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="branch_id" className="form-label">
                          Branch
                        </label>
                        <select
                          id="branch_id"
                          name="branch_id"
                          className="form-select "
                          data-select2
                          data-placeholder="Select branch"
                          value={form.branch_id}
                          onChange={(e) => updateField("branch_id", e.target.value)}
                        >
                          <option value=""></option>
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
                        <label htmlFor="shift_id" className="form-label">
                          Shift
                        </label>
                        <select
                          id="shift_id"
                          name="shift_id"
                          className="form-select "
                          data-select2
                          data-placeholder="Select shift"
                          value={form.shift_id}
                          onChange={(e) => updateField("shift_id", e.target.value)}
                        >
                          <option value=""></option>
                          {shifts.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="reporting_to" className="form-label">
                          Reports To
                        </label>
                        <select
                          id="reporting_to"
                          name="reporting_to"
                          className="form-select"
                          data-select2
                          data-placeholder="No manager"
                          data-reporting-to
                          value={form.reporting_to}
                          onChange={(e) => updateField("reporting_to", e.target.value)}
                        >
                          <option value=""></option>
                          {employees
                            .filter((e) => !employee || e.id !== employee.id)
                            .map((e) => (
                              <option key={e.id} value={e.id} data-meta={e.code}>
                                {getFullName(e)}
                              </option>
                            ))}
                        </select>
                        <small className="text-muted" data-reporting-note>
                          The chosen department is listed first. Others stay available for department
                          heads.
                        </small>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="employment_type" className="form-label">
                          Employment Type <span className="erp-required">*</span>
                        </label>
                        <select
                          id="employment_type"
                          name="employment_type"
                          className="form-select "
                          value={form.employment_type}
                          onChange={(e) => updateField("employment_type", e.target.value)}
                          required
                        >
                          <option value="full_time">Full Time</option>
                          <option value="part_time">Part Time</option>
                          <option value="contract">Contract</option>
                          <option value="consultant">Consultant</option>
                          <option value="intern">Intern</option>
                          <option value="daily_labour">Daily Labour</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="employment_status" className="form-label">
                          Status <span className="erp-required">*</span>
                        </label>
                        <select
                          id="employment_status"
                          name="employment_status"
                          className="form-select "
                          data-status-select
                          value={form.employment_status}
                          onChange={(e) => updateField("employment_status", e.target.value)}
                          required
                        >
                          <option value="probation" data-separated="0">
                            Probation
                          </option>
                          <option value="active" data-separated="0">
                            Active
                          </option>
                          <option value="on_leave" data-separated="0">
                            On Leave
                          </option>
                          <option value="suspended" data-separated="0">
                            Suspended
                          </option>
                          <option value="resigned" data-separated="1">
                            Resigned
                          </option>
                          <option value="terminated" data-separated="1">
                            Terminated
                          </option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="date_joined" className="form-label">
                          Joining Date
                        </label>
                        <input
                          type="date"
                          id="date_joined"
                          name="date_joined"
                          className="form-control "
                          value={form.date_joined}
                          onChange={(e) => updateField("date_joined", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="probation_end_date" className="form-label">
                          Probation Ends
                        </label>
                        <input
                          type="date"
                          id="probation_end_date"
                          name="probation_end_date"
                          className="form-control "
                          value={form.probation_end_date}
                          onChange={(e) => updateField("probation_end_date", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="confirmation_date" className="form-label">
                          Confirmation Date
                        </label>
                        <input
                          type="date"
                          id="confirmation_date"
                          name="confirmation_date"
                          className="form-control "
                          value={form.confirmation_date}
                          onChange={(e) => updateField("confirmation_date", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-4" data-separation-field hidden={!isSeparated}>
                      <div className="erp-field">
                        <label htmlFor="separation_date" className="form-label">
                          Separation Date
                        </label>
                        <input
                          type="date"
                          id="separation_date"
                          name="separation_date"
                          className="form-control "
                          value={form.separation_date}
                          onChange={(e) => updateField("separation_date", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-4" data-separation-field hidden={!isSeparated}>
                      <div className="erp-field">
                        <label htmlFor="separation_reason" className="form-label">
                          Separation Reason
                        </label>
                        <input
                          type="text"
                          id="separation_reason"
                          name="separation_reason"
                          className="form-control"
                          value={form.separation_reason}
                          onChange={(e) => updateField("separation_reason", e.target.value)}
                          maxLength={190}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="erp-field mb-0">
                        <label htmlFor="user_id" className="form-label">
                          Linked Login Account
                        </label>
                        <select
                          id="user_id"
                          name="user_id"
                          className="form-select"
                          data-select2
                          data-placeholder="Not linked"
                          data-account-link
                          value={form.user_id}
                          onChange={(e) => updateField("user_id", e.target.value)}
                        >
                          <option value=""></option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id} data-meta="">
                              {u.name}
                            </option>
                          ))}
                        </select>
                        <span className="erp-help">
                          Optional — connects this employee to a system login for self-service later.
                        </span>
                      </div>
                    </div>

                    {!isEdit && (
                      <div className="col-md-6 d-flex align-items-center">
                        <div className="erp-switch-row w-100 mb-0" data-account-create-wrap>
                          <div>
                            <h6>Create a login account</h6>
                            <p>
                              Username is the phone, password <code>123456</code>. Skipped if a login
                              is linked above.
                            </p>
                          </div>
                          <div className="form-check form-switch">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              role="switch"
                              id="create_account"
                              name="create_account"
                              value="1"
                              checked={form.create_account}
                              onChange={(e) => updateField("create_account", e.target.checked)}
                              data-account-create
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset data-step="5" hidden={activeStep !== 5}>
                <div className="erp-section-head">
                  <div className="erp-section-icon">
                    <i className="fa-solid fa-money-check-dollar"></i>
                  </div>
                  <div>
                    <h2>Compensation &amp; Bank</h2>
                    <p>Pay and where it is deposited. Visible only to those with employee access.</p>
                  </div>
                </div>
                <div className="erp-card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="gross_salary" className="form-label">
                          Gross Salary
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          id="gross_salary"
                          name="gross_salary"
                          className="form-control "
                          value={form.gross_salary}
                          onChange={(e) => updateField("gross_salary", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="basic_salary" className="form-label">
                          Basic Salary
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          id="basic_salary"
                          name="basic_salary"
                          className="form-control "
                          value={form.basic_salary}
                          onChange={(e) => updateField("basic_salary", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label htmlFor="salary_currency" className="form-label">
                          Currency
                        </label>
                        <select
                          id="salary_currency"
                          name="salary_currency"
                          className="form-select"
                          data-select2
                          value={form.salary_currency}
                          onChange={(e) => updateField("salary_currency", e.target.value)}
                        >
                          <option value="">Company default (BDT)</option>
                          <option value="AED">AED — UAE Dirham</option>
                          <option value="AUD">AUD — Australian Dollar</option>
                          <option value="BDT">BDT — Bangladeshi Taka</option>
                          <option value="BHD">BHD — Bahraini Dinar</option>
                          <option value="BRL">BRL — Brazilian Real</option>
                          <option value="USD">USD — US Dollar</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="erp-fieldset-label">Bank account</div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="bank_name" className="form-label">
                          Bank
                        </label>
                        <input
                          type="text"
                          id="bank_name"
                          name="bank_name"
                          className="form-control"
                          value={form.bank_name}
                          onChange={(e) => updateField("bank_name", e.target.value)}
                          maxLength={120}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="bank_branch" className="form-label">
                          Branch
                        </label>
                        <input
                          type="text"
                          id="bank_branch"
                          name="bank_branch"
                          className="form-control"
                          value={form.bank_branch}
                          onChange={(e) => updateField("bank_branch", e.target.value)}
                          maxLength={120}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="bank_account_name" className="form-label">
                          Account Name
                        </label>
                        <input
                          type="text"
                          id="bank_account_name"
                          name="bank_account_name"
                          className="form-control"
                          value={form.bank_account_name}
                          onChange={(e) => updateField("bank_account_name", e.target.value)}
                          maxLength={150}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="erp-field">
                        <label htmlFor="bank_account_number" className="form-label">
                          Account No.
                        </label>
                        <input
                          type="text"
                          id="bank_account_number"
                          name="bank_account_number"
                          className="form-control"
                          value={form.bank_account_number}
                          onChange={(e) => updateField("bank_account_number", e.target.value)}
                          maxLength={40}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="erp-field">
                        <label htmlFor="bank_routing_number" className="form-label">
                          Routing No.
                        </label>
                        <input
                          type="text"
                          id="bank_routing_number"
                          name="bank_routing_number"
                          className="form-control"
                          value={form.bank_routing_number}
                          onChange={(e) => updateField("bank_routing_number", e.target.value)}
                          maxLength={40}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="erp-field mb-0">
                    <label htmlFor="notes" className="form-label">
                      Internal Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      className="form-control"
                      maxLength={5000}
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      placeholder="Anything HR should know…"
                    ></textarea>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="erp-wizard-nav erp-card-foot">
              <Link href="/hr/employees" className="btn btn-erp-ghost">
                Cancel
              </Link>
              <span className="erp-form-bar-note ms-3 d-none d-md-inline">
                <i className="fa-solid fa-circle-info me-1"></i>
                Fields marked <span className="erp-required">*</span> are required.
                {!isEdit && " The employee code is generated automatically."}
              </span>
              <div className="ms-auto d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  data-step-prev
                  hidden={activeStep === 1}
                  onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
                >
                  <i className="fa-solid fa-arrow-left me-1"></i>Back
                </button>
                <button
                  type="button"
                  className="btn btn-erp"
                  data-step-next
                  hidden={activeStep === 5}
                  onClick={() => setActiveStep((s) => Math.min(5, s + 1))}
                >
                  Next<i className="fa-solid fa-arrow-right ms-1"></i>
                </button>
                <button
                  type="submit"
                  className="btn btn-erp"
                  data-step-save
                  data-submit-button
                  disabled={submitting}
                >
                  <i className="fa-solid fa-floppy-disk me-2"></i>
                  {isEdit ? "Save Changes" : "Create Employee"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ============================================================================
  // MODE 5: DETAIL VIEW (/hr/employees/[id])
  // ============================================================================
  const emp = employee ?? employees[0];
  const fullName = emp ? getFullName(emp) : "Employee";
  const directReports = emp ? employees.filter((e) => e.reportingTo === emp.id).length : 0;

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-id-badge"></i>
          </div>
          <div>
            <h1>{fullName}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">HR</li>
                <li className="breadcrumb-item">
                  <Link href="/hr/employees">Employees</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {emp?.code ?? "EMP-0001"}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link
            href={`/hr/employees/tree?focus=${emp?.id ?? 1}`}
            className="btn btn-erp-ghost"
          >
            <i className="fa-solid fa-sitemap me-2"></i>Tree View
          </Link>
          <Link href="/hr/employees" className="btn btn-erp-ghost">
            <i className="fa-solid fa-list me-2"></i>All Employees
          </Link>
          <button
            type="button"
            className="btn btn-erp-ghost"
            data-bs-toggle="modal"
            data-bs-target="#statusModal"
            onClick={() => setOpenModal("statusModal")}
          >
            <i className="fa-solid fa-arrows-rotate me-2"></i>Change Status
          </button>

          <button
            type="button"
            className="btn btn-erp-ghost"
            data-bs-toggle="modal"
            data-bs-target="#employeeLoginModal"
            onClick={() => setOpenModal("employeeLoginModal")}
          >
            <i className="fa-solid fa-user-plus me-2"></i>Create Login
          </button>

          <Link href={`/hr/employees/${emp?.id ?? 1}/edit`} className="btn btn-erp">
            <i className="fa-solid fa-pen me-2"></i>Edit
          </Link>
          <div className="dropdown">
            <button
              className="btn btn-erp-ghost"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              aria-label="More"
              onClick={() =>
                setDeleteTarget({ id: emp?.id ?? 1, name: fullName })
              }
            >
              <i className="fa-solid fa-ellipsis"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end notika-dropdown erp-user-menu">
              <li>
                <button
                  type="button"
                  className="dropdown-item text-danger"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteRecordModal"
                  data-record-name={fullName}
                  data-record-action={`/hr/employees/${emp?.id ?? 1}`}
                  onClick={() => setDeleteTarget({ id: emp?.id ?? 1, name: fullName })}
                >
                  <i className="fa-solid fa-trash-can text-danger"></i> Delete Employee
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="erp-card erp-cv">
        <div className="erp-cv-head">
          <span className="erp-cv-photo">{emp ? getInitials(emp) : "MA"}</span>
          <div className="erp-cv-id">
            <h2>{fullName}</h2>
            <p>
              {emp?.designationName ?? "Chief Executive Officer"} &middot;{" "}
              {emp?.departmentName ?? "Administration"}
            </p>
            <div className="erp-rec-pills">
              <span className="erp-pill is-available" data-status-pill>
                <i className="fa-solid fa-circle-check me-1"></i>
                {formatStatusLabel(emp?.employmentStatus ?? "active")}
              </span>
              <span className="erp-pill is-neutral">{emp?.code ?? "EMP-0001"}</span>
              <span className="erp-pill is-neutral">
                {formatEmploymentType(emp?.employmentType ?? "full_time")}
              </span>
            </div>
          </div>
        </div>

        <div className="erp-rec-metrics">
          <div className="erp-rec-metric">
            <strong>{emp?.dateJoined || "—"}</strong>
            <small>Joined</small>
          </div>
          <div className="erp-rec-metric">
            <strong>—</strong>
            <small>Tenure</small>
          </div>
          <div className="erp-rec-metric">
            <strong>47</strong>
            <small>Age</small>
          </div>
          <div className="erp-rec-metric">
            <strong>{directReports}</strong>
            <small>Direct reports</small>
          </div>
        </div>

        <div className="erp-tabs" role="tablist" data-employee-tabs>
          <button
            type="button"
            className={`erp-tab ${activeTab === "overview" ? "is-active" : ""}`}
            role="tab"
            data-tab="overview"
            id="section-overview"
            onClick={() => setActiveTab("overview")}
          >
            <i className="fa-solid fa-user"></i>
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${activeTab === "contacts" ? "is-active" : ""}`}
            role="tab"
            data-tab="contacts"
            id="section-contacts"
            onClick={() => setActiveTab("contacts")}
          >
            <i className="fa-solid fa-phone"></i>
            <span>Emergency &amp; References</span>
            <span className="erp-tab-count">0</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${activeTab === "education" ? "is-active" : ""}`}
            role="tab"
            data-tab="education"
            id="section-education"
            onClick={() => setActiveTab("education")}
          >
            <i className="fa-solid fa-graduation-cap"></i>
            <span>Education</span>
            <span className="erp-tab-count">0</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${activeTab === "experience" ? "is-active" : ""}`}
            role="tab"
            data-tab="experience"
            id="section-experience"
            onClick={() => setActiveTab("experience")}
          >
            <i className="fa-solid fa-briefcase"></i>
            <span>Experience</span>
            <span className="erp-tab-count">0</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${activeTab === "dependents" ? "is-active" : ""}`}
            role="tab"
            data-tab="dependents"
            id="section-dependents"
            onClick={() => setActiveTab("dependents")}
          >
            <i className="fa-solid fa-people-roof"></i>
            <span>Dependents</span>
            <span className="erp-tab-count">0</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${activeTab === "documents" ? "is-active" : ""}`}
            role="tab"
            data-tab="documents"
            id="section-documents"
            onClick={() => setActiveTab("documents")}
          >
            <i className="fa-solid fa-folder-open"></i>
            <span>Documents</span>
            <span className="erp-tab-count">0</span>
          </button>
        </div>

        <div className="erp-tab-panels">
          <div
            className={`erp-tab-panel ${activeTab === "overview" ? "is-active" : ""}`}
            data-panel="overview"
          >
            <div className="erp-cv-grid">
              <div className="erp-cv-block">
                <div className="erp-cv-block-head">
                  <i className="fa-solid fa-user"></i>
                  <h3>Personal</h3>
                </div>
                <div className="erp-deflist">
                  <div className="erp-def">
                    <span className="erp-def-label">Father</span>
                    <span className="erp-def-value">{emp?.fatherName || "—"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Mother</span>
                    <span className="erp-def-value">{emp?.motherName || "—"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Spouse</span>
                    <span className="erp-def-value">{emp?.spouseName || "—"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Gender</span>
                    <span className="erp-def-value">{emp?.gender || "Male"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Date of birth</span>
                    <span className="erp-def-value">
                      {emp?.dateOfBirth || "10 Oct 1979 (47 yrs)"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Marital status</span>
                    <span className="erp-def-value">{emp?.maritalStatus || "Married"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Blood group</span>
                    <span className="erp-def-value">{emp?.bloodGroup || "B+"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Nationality</span>
                    <span className={`erp-def-value ${emp?.nationality ? "" : "is-empty"}`}>
                      {emp?.nationality || "—"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Religion</span>
                    <span className="erp-def-value">{emp?.religion || "Islam"}</span>
                  </div>
                </div>
              </div>

              <div className="erp-cv-block">
                <div className="erp-cv-block-head">
                  <i className="fa-solid fa-id-card"></i>
                  <h3>Statutory</h3>
                </div>
                <div className="erp-deflist">
                  <div className="erp-def">
                    <span className="erp-def-label">National ID</span>
                    <span className="erp-def-value">{emp?.nationalId || "—"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Passport</span>
                    <span className="erp-def-value">{emp?.passportNo || "—"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">TIN</span>
                    <span className="erp-def-value">{emp?.tin || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="erp-cv-block">
                <div className="erp-cv-block-head">
                  <i className="fa-solid fa-phone"></i>
                  <h3>Contact</h3>
                </div>
                <div className="erp-deflist">
                  <div className="erp-def">
                    <span className="erp-def-label">Work email</span>
                    <span className="erp-def-value">{emp?.workEmail || "—"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Personal email</span>
                    <span className="erp-def-value">{emp?.personalEmail || "—"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Official phone</span>
                    <span className="erp-def-value">
                      {emp?.phone ? <a href={`tel:${emp.phone}`}>{emp.phone}</a> : "—"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Personal phone</span>
                    <span className="erp-def-value">
                      {emp?.personalPhone ? (
                        <a href={`tel:${emp.personalPhone}`}>{emp.personalPhone}</a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="erp-cv-block">
                <div className="erp-cv-block-head">
                  <i className="fa-solid fa-sitemap"></i>
                  <h3>Employment</h3>
                </div>
                <div className="erp-deflist">
                  <div className="erp-def">
                    <span className="erp-def-label">Designation</span>
                    <span className="erp-def-value">
                      {emp?.designationName || "Chief Executive Officer"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Department</span>
                    <span className="erp-def-value">
                      {emp?.departmentName || "Administration"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Branch</span>
                    <span className="erp-def-value is-empty">—</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Shift</span>
                    <span className="erp-def-value is-empty">—</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Reports to</span>
                    <span className="erp-def-value is-empty">—</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Employment type</span>
                    <span className="erp-def-value">
                      {formatEmploymentType(emp?.employmentType ?? "full_time")}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Joined</span>
                    <span className="erp-def-value is-empty">{emp?.dateJoined || "—"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Probation ends</span>
                    <span className="erp-def-value is-empty">
                      {emp?.probationEndDate || "—"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Confirmed</span>
                    <span className="erp-def-value">
                      {emp?.confirmationDate || "10 Nov 2026"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Login account</span>
                    <span className="erp-def-value is-empty">—</span>
                  </div>
                </div>
              </div>

              <div className="erp-cv-block">
                <div className="erp-cv-block-head">
                  <i className="fa-solid fa-location-dot"></i>
                  <h3>Address</h3>
                </div>
                <div className="erp-deflist">
                  <div className="erp-def">
                    <span className="erp-def-label">Present</span>
                    <span className="erp-def-value">
                      {emp?.presentAddress || "56/L South Mugda, Dhaka, Bangladesh"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Permanent</span>
                    <span className="erp-def-value">
                      {emp?.permanentAddress || "56/L South Mugda, Dhaka, Bangladesh"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="erp-cv-block">
                <div className="erp-cv-block-head">
                  <i className="fa-solid fa-money-check-dollar"></i>
                  <h3>Compensation &amp; Bank</h3>
                </div>
                <div className="erp-deflist">
                  <div className="erp-def">
                    <span className="erp-def-label">Gross salary</span>
                    <span className="erp-def-value">
                      BDT {(emp?.grossSalary ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Basic salary</span>
                    <span className="erp-def-value">
                      BDT {(emp?.basicSalary ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Bank</span>
                    <span className="erp-def-value is-empty">{emp?.bankName || "—"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Branch</span>
                    <span className="erp-def-value is-empty">{emp?.bankBranch || "—"}</span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Account name</span>
                    <span className="erp-def-value is-empty">
                      {emp?.bankAccountName || "—"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Account number</span>
                    <span className="erp-def-value is-empty">
                      {emp?.bankAccountNumber || "—"}
                    </span>
                  </div>
                  <div className="erp-def">
                    <span className="erp-def-label">Routing number</span>
                    <span className="erp-def-value is-empty">
                      {emp?.bankRoutingNumber || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`erp-tab-panel ${activeTab === "contacts" ? "is-active" : ""}`}
            data-panel="contacts"
          >
            <div className="erp-cv-section-head">
              <h3>
                <i className="fa-solid fa-phone-volume me-2"></i>Emergency Contacts &amp; References
              </h3>
              <button
                type="button"
                className="btn btn-erp btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#contactModal"
                data-contact-new
                data-action={`/hr/employees/${emp?.id ?? 1}/contacts`}
                onClick={() => setOpenModal("contactModal")}
              >
                <i className="fa-solid fa-plus me-1"></i>Add Contact
              </button>
            </div>
            <p className="erp-cv-empty">No emergency contacts or references recorded yet.</p>
          </div>

          <div
            className={`erp-tab-panel ${activeTab === "education" ? "is-active" : ""}`}
            data-panel="education"
          >
            <div className="erp-cv-section-head">
              <h3>
                <i className="fa-solid fa-graduation-cap me-2"></i>Education
              </h3>
              <button
                type="button"
                className="btn btn-erp btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#educationModal"
                data-education-new
                data-action={`/hr/employees/${emp?.id ?? 1}/education`}
                onClick={() => setOpenModal("educationModal")}
              >
                <i className="fa-solid fa-plus me-1"></i>Add Qualification
              </button>
            </div>
            <p className="erp-cv-empty">No qualifications recorded yet.</p>
          </div>

          <div
            className={`erp-tab-panel ${activeTab === "experience" ? "is-active" : ""}`}
            data-panel="experience"
          >
            <div className="erp-cv-section-head">
              <h3>
                <i className="fa-solid fa-briefcase me-2"></i>Work Experience
              </h3>
              <button
                type="button"
                className="btn btn-erp btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#experienceModal"
                data-experience-new
                data-action={`/hr/employees/${emp?.id ?? 1}/experience`}
                onClick={() => setOpenModal("experienceModal")}
              >
                <i className="fa-solid fa-plus me-1"></i>Add Experience
              </button>
            </div>
            <p className="erp-cv-empty">No previous experience recorded yet.</p>
          </div>

          <div
            className={`erp-tab-panel ${activeTab === "dependents" ? "is-active" : ""}`}
            data-panel="dependents"
          >
            <div className="erp-cv-section-head">
              <h3>
                <i className="fa-solid fa-people-roof me-2"></i>Dependents &amp; Nominees
              </h3>
              <button
                type="button"
                className="btn btn-erp btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#dependentModal"
                data-dependent-new
                data-action={`/hr/employees/${emp?.id ?? 1}/dependents`}
                onClick={() => setOpenModal("dependentModal")}
              >
                <i className="fa-solid fa-plus me-1"></i>Add Dependent
              </button>
            </div>
            <div className="erp-card-grid">
              <p className="erp-cv-empty">No dependents or nominees recorded yet.</p>
            </div>
          </div>

          <div
            className={`erp-tab-panel ${activeTab === "documents" ? "is-active" : ""}`}
            data-panel="documents"
          >
            <div className="erp-cv-section-head">
              <h3>
                <i className="fa-solid fa-folder-open me-2"></i>Documents
              </h3>
              <button
                type="button"
                className="btn btn-erp btn-sm"
                data-bs-toggle="modal"
                data-bs-target="#documentModal"
                data-document-new
                data-action={`/hr/employees/${emp?.id ?? 1}/documents`}
                onClick={() => setOpenModal("documentModal")}
              >
                <i className="fa-solid fa-upload me-1"></i>Upload Document
              </button>
            </div>
            <div className="erp-card-grid">
              <p className="erp-cv-empty">No documents uploaded yet.</p>
            </div>

            <div
              className={`modal fade ${openModal === "documentEditModal" ? "show d-block" : ""}`}
              id="documentEditModal"
              tabIndex={-1}
              aria-hidden={openModal !== "documentEditModal"}
            >
              <div className="modal-dialog modal-dialog-centered">
                <form
                  method="POST"
                  className="modal-content erp-form"
                  style={{ border: "none", borderRadius: "14px" }}
                  data-satellite-form
                  data-satellite="document"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setOpenModal(null);
                  }}
                >
                  <input type="hidden" name="_method" value="PUT" data-method-field />
                  <div className="modal-body p-4">
                    <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: 600 }}>
                      Edit document details
                    </h5>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label htmlFor="de_type" className="form-label">
                            Type <span className="erp-required">*</span>
                          </label>
                          <select
                            id="de_type"
                            name="type"
                            className="form-select"
                            data-field="type"
                            required
                          >
                            <option value="national_id">National ID</option>
                            <option value="passport">Passport</option>
                            <option value="photo">Photograph</option>
                            <option value="cv">CV / Résumé</option>
                            <option value="certificate">Academic Certificate</option>
                            <option value="experience_letter">Experience Letter</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label htmlFor="de_title" className="form-label">
                            Title
                          </label>
                          <input
                            type="text"
                            id="de_title"
                            name="title"
                            className="form-control"
                            maxLength={190}
                            data-field="title"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label htmlFor="de_issue" className="form-label">
                            Issue Date
                          </label>
                          <input
                            type="date"
                            id="de_issue"
                            name="issue_date"
                            className="form-control"
                            data-field="issue_date"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label htmlFor="de_expiry" className="form-label">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            id="de_expiry"
                            name="expiry_date"
                            className="form-control"
                            data-field="expiry_date"
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="erp-field mb-0">
                          <label htmlFor="de_notes" className="form-label">
                            Notes
                          </label>
                          <input
                            type="text"
                            id="de_notes"
                            name="notes"
                            className="form-control"
                            maxLength={255}
                            data-field="notes"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-0 pt-0 px-4 pb-4">
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      data-bs-dismiss="modal"
                      onClick={() => setOpenModal(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-erp">
                      <i className="fa-solid fa-floppy-disk me-2"></i>Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 2: #statusModal */}
      <div
        className={`modal fade ${openModal === "statusModal" ? "show d-block" : ""}`}
        id="statusModal"
        tabIndex={-1}
        aria-hidden={openModal !== "statusModal"}
        style={openModal === "statusModal" ? { backgroundColor: "rgba(15,23,42,0.5)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            action={`/hr/employees/${emp?.id ?? 1}/status`}
            onSubmit={handleStatusUpdate}
            className="modal-content erp-form"
            style={{ border: "none", borderRadius: "14px" }}
            data-status-form
            data-submit-lock="off"
          >
            <div className="modal-body p-4">
              <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: 600 }}>
                Change employment status
              </h5>

              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-status-error
                hidden
              >
                <span data-status-error-text></span>
              </div>

              <div className="erp-field">
                <label htmlFor="status_value" className="form-label">
                  Status <span className="erp-required">*</span>
                </label>
                <select
                  id="status_value"
                  name="employment_status"
                  className="form-select"
                  data-status-input
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  required
                >
                  <option value="probation" data-separated="0">
                    Probation
                  </option>
                  <option value="active" data-separated="0">
                    Active
                  </option>
                  <option value="on_leave" data-separated="0">
                    On Leave
                  </option>
                  <option value="suspended" data-separated="0">
                    Suspended
                  </option>
                  <option value="resigned" data-separated="1">
                    Resigned
                  </option>
                  <option value="terminated" data-separated="1">
                    Terminated
                  </option>
                </select>
                <span className="erp-help">
                  Moving to Active off probation records a confirmation date; a separation records
                  the leaving date.
                </span>
              </div>

              <div
                data-status-separation
                hidden={statusVal !== "resigned" && statusVal !== "terminated"}
              >
                <div className="erp-field">
                  <label htmlFor="status_separation_date" className="form-label">
                    Separation Date <span className="erp-required">*</span>
                  </label>
                  <input
                    type="date"
                    id="status_separation_date"
                    name="separation_date"
                    className="form-control"
                    value={separationDate}
                    onChange={(e) => setSeparationDate(e.target.value)}
                  />
                </div>
                <div className="erp-field mb-0">
                  <label htmlFor="status_separation_reason" className="form-label">
                    Reason
                  </label>
                  <input
                    type="text"
                    id="status_separation_reason"
                    name="separation_reason"
                    className="form-control"
                    maxLength={190}
                    value={separationReason}
                    onChange={(e) => setSeparationReason(e.target.value)}
                    placeholder="Resignation, end of contract…"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setOpenModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" data-loading-text="Saving…">
                <i className="fa-solid fa-arrows-rotate me-2"></i>Update Status
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 3: #employeeLoginModal */}
      <div
        className={`modal fade ${openModal === "employeeLoginModal" ? "show d-block" : ""}`}
        id="employeeLoginModal"
        tabIndex={-1}
        aria-hidden={openModal !== "employeeLoginModal"}
        style={
          openModal === "employeeLoginModal" ? { backgroundColor: "rgba(15,23,42,0.5)" } : undefined
        }
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ border: "none", borderRadius: "14px" }}>
            <form
              method="POST"
              action={`/hr/employees/${emp?.id ?? 1}/account`}
              onSubmit={(e) => {
                e.preventDefault();
                setOpenModal(null);
              }}
            >
              <div className="modal-header border-0 px-4 pt-4 pb-0">
                <h5 className="mb-0" style={{ fontSize: "16px", fontWeight: 600 }}>
                  <i className="fa-solid fa-user-plus me-2 text-muted"></i>Create login
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => setOpenModal(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="erp-emp-cred">
                  <div>
                    <span>Signs in with</span>
                    <strong>{emp?.phone || "01916100416"}</strong>
                  </div>
                  <div>
                    <span>Starter password</span>
                    <strong>123456</strong>
                  </div>
                </div>

                <div className="erp-field mt-3 mb-0">
                  <label className="form-label">
                    Role <span className="erp-required">*</span>
                  </label>
                  <select name="role" className="form-control" data-select2 defaultValue="Staff">
                    <option value="Administrator">Administrator</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                  </select>
                  <span className="erp-help">
                    Staff is the smallest useful grant. The role can be changed later from Settings
                    &rarr; Users without touching this record.
                  </span>
                </div>

                <p className="erp-emp-note">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>
                    Tell {fullName} to change the password on first sign-in. Until they do, anyone
                    who knows the starter password can use this account.
                  </span>
                </p>
              </div>

              <div className="modal-footer border-0 px-4 pb-4 pt-0">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  data-bs-dismiss="modal"
                  onClick={() => setOpenModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-erp" data-loading-text="Creating…">
                  <i className="fa-solid fa-user-plus me-2"></i>Create Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal 4: #contactModal */}
      <div
        className={`modal fade ${openModal === "contactModal" ? "show d-block" : ""}`}
        id="contactModal"
        tabIndex={-1}
        aria-hidden={openModal !== "contactModal"}
        style={openModal === "contactModal" ? { backgroundColor: "rgba(15,23,42,0.5)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            className="modal-content erp-form"
            style={{ border: "none", borderRadius: "14px" }}
            data-satellite-form
            data-satellite="contact"
            onSubmit={(e) => {
              e.preventDefault();
              setOpenModal(null);
            }}
          >
            <input type="hidden" name="_method" value="POST" data-method-field />

            <div className="modal-body p-4">
              <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: 600 }} data-modal-title>
                Add contact
              </h5>

              <div className="row">
                <div className="col-md-6">
                  <div className="erp-field">
                    <label htmlFor="c_type" className="form-label">
                      Type <span className="erp-required">*</span>
                    </label>
                    <select id="c_type" name="type" className="form-select" data-field="type" required>
                      <option value="emergency">Emergency Contact</option>
                      <option value="reference">Reference</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label htmlFor="c_relationship" className="form-label">
                      Relationship
                    </label>
                    <select
                      id="c_relationship"
                      name="relationship"
                      className="form-select"
                      data-field="relationship"
                    >
                      <option value="">—</option>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="spouse">Spouse</option>
                      <option value="son">Son</option>
                      <option value="daughter">Daughter</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="erp-field">
                    <label htmlFor="c_name" className="form-label">
                      Name <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="c_name"
                      name="name"
                      className="form-control"
                      maxLength={150}
                      data-field="name"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label htmlFor="c_phone" className="form-label">
                      Phone
                    </label>
                    <input
                      type="text"
                      id="c_phone"
                      name="phone"
                      className="form-control"
                      maxLength={40}
                      data-field="phone"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label htmlFor="c_alt_phone" className="form-label">
                      Alternate Phone
                    </label>
                    <input
                      type="text"
                      id="c_alt_phone"
                      name="alt_phone"
                      className="form-control"
                      maxLength={40}
                      data-field="alt_phone"
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="erp-field">
                    <label htmlFor="c_email" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      id="c_email"
                      name="email"
                      className="form-control"
                      maxLength={150}
                      data-field="email"
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="erp-field">
                    <label htmlFor="c_address" className="form-label">
                      Address
                    </label>
                    <input
                      type="text"
                      id="c_address"
                      name="address"
                      className="form-control"
                      maxLength={255}
                      data-field="address"
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="erp-field mb-0">
                    <label htmlFor="c_notes" className="form-label">
                      Notes
                    </label>
                    <input
                      type="text"
                      id="c_notes"
                      name="notes"
                      className="form-control"
                      maxLength={255}
                      data-field="notes"
                    />
                  </div>
                </div>
              </div>

              <label
                className="d-inline-flex align-items-center gap-2 mt-3"
                style={{ fontSize: "12.5px" }}
                data-contact-primary-wrap
              >
                <input type="checkbox" name="is_primary" value="1" data-field-check="is_primary" />
                Primary emergency contact — the first person to call.
              </label>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setOpenModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp">
                <i className="fa-solid fa-floppy-disk me-2"></i>Save
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 5: #educationModal */}
      <div
        className={`modal fade ${openModal === "educationModal" ? "show d-block" : ""}`}
        id="educationModal"
        tabIndex={-1}
        aria-hidden={openModal !== "educationModal"}
        style={
          openModal === "educationModal" ? { backgroundColor: "rgba(15,23,42,0.5)" } : undefined
        }
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            className="modal-content erp-form"
            style={{ border: "none", borderRadius: "14px" }}
            data-satellite-form
            data-satellite="education"
            onSubmit={(e) => {
              e.preventDefault();
              setOpenModal(null);
            }}
          >
            <input type="hidden" name="_method" value="POST" data-method-field />

            <div className="modal-body p-4">
              <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: 600 }} data-modal-title>
                Add qualification
              </h5>

              <div className="row">
                <div className="col-md-7">
                  <div className="erp-field">
                    <label htmlFor="e_degree" className="form-label">
                      Degree / Certification <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="e_degree"
                      name="degree"
                      className="form-control"
                      maxLength={120}
                      data-field="degree"
                      required
                      placeholder="B.Sc. in Civil Engineering"
                    />
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="erp-field">
                    <label htmlFor="e_field" className="form-label">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      id="e_field"
                      name="field_of_study"
                      className="form-control"
                      maxLength={120}
                      data-field="field_of_study"
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="erp-field">
                    <label htmlFor="e_institution" className="form-label">
                      Institution
                    </label>
                    <input
                      type="text"
                      id="e_institution"
                      name="institution"
                      className="form-control"
                      maxLength={190}
                      data-field="institution"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="e_start" className="form-label">
                      Start Year
                    </label>
                    <input
                      type="number"
                      id="e_start"
                      name="start_year"
                      className="form-control"
                      min="1950"
                      max="2027"
                      data-field="start_year"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="e_end" className="form-label">
                      End Year
                    </label>
                    <input
                      type="number"
                      id="e_end"
                      name="end_year"
                      className="form-control"
                      min="1950"
                      max="2033"
                      data-field="end_year"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="e_result" className="form-label">
                      Result / GPA
                    </label>
                    <input
                      type="text"
                      id="e_result"
                      name="result"
                      className="form-control"
                      maxLength={60}
                      data-field="result"
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="erp-field mb-0">
                    <label htmlFor="e_notes" className="form-label">
                      Notes
                    </label>
                    <input
                      type="text"
                      id="e_notes"
                      name="notes"
                      className="form-control"
                      maxLength={255}
                      data-field="notes"
                    />
                  </div>
                </div>
              </div>

              <label
                className="d-inline-flex align-items-center gap-2 mt-3"
                style={{ fontSize: "12.5px" }}
              >
                <input type="checkbox" name="is_current" value="1" data-field-check="is_current" />{" "}
                Currently studying
              </label>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setOpenModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp">
                <i className="fa-solid fa-floppy-disk me-2"></i>Save
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 6: #experienceModal */}
      <div
        className={`modal fade ${openModal === "experienceModal" ? "show d-block" : ""}`}
        id="experienceModal"
        tabIndex={-1}
        aria-hidden={openModal !== "experienceModal"}
        style={
          openModal === "experienceModal" ? { backgroundColor: "rgba(15,23,42,0.5)" } : undefined
        }
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            className="modal-content erp-form"
            style={{ border: "none", borderRadius: "14px" }}
            data-satellite-form
            data-satellite="experience"
            onSubmit={(e) => {
              e.preventDefault();
              setOpenModal(null);
            }}
          >
            <input type="hidden" name="_method" value="POST" data-method-field />

            <div className="modal-body p-4">
              <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: 600 }} data-modal-title>
                Add experience
              </h5>

              <div className="row">
                <div className="col-md-7">
                  <div className="erp-field">
                    <label htmlFor="x_company" className="form-label">
                      Company <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="x_company"
                      name="company_name"
                      className="form-control"
                      maxLength={190}
                      data-field="company_name"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="erp-field">
                    <label htmlFor="x_title" className="form-label">
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="x_title"
                      name="job_title"
                      className="form-control"
                      maxLength={150}
                      data-field="job_title"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label htmlFor="x_location" className="form-label">
                      Location
                    </label>
                    <input
                      type="text"
                      id="x_location"
                      name="location"
                      className="form-control"
                      maxLength={120}
                      data-field="location"
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="erp-field">
                    <label htmlFor="x_start" className="form-label">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="x_start"
                      name="start_date"
                      className="form-control"
                      data-field="start_date"
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="erp-field">
                    <label htmlFor="x_end" className="form-label">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="x_end"
                      name="end_date"
                      className="form-control"
                      data-field="end_date"
                      data-disable-when-current
                      disabled={isCurrentRole}
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="erp-field mb-0">
                    <label htmlFor="x_resp" className="form-label">
                      Responsibilities
                    </label>
                    <textarea
                      id="x_resp"
                      name="responsibilities"
                      rows={3}
                      className="form-control"
                      maxLength={2000}
                      data-field="responsibilities"
                    ></textarea>
                  </div>
                </div>
              </div>

              <label
                className="d-inline-flex align-items-center gap-2 mt-3"
                style={{ fontSize: "12.5px" }}
              >
                <input
                  type="checkbox"
                  name="is_current"
                  value="1"
                  data-field-check="is_current"
                  data-toggle-current
                  checked={isCurrentRole}
                  onChange={(e) => setIsCurrentRole(e.target.checked)}
                />{" "}
                Current role
              </label>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setOpenModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp">
                <i className="fa-solid fa-floppy-disk me-2"></i>Save
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 7: #dependentModal */}
      <div
        className={`modal fade ${openModal === "dependentModal" ? "show d-block" : ""}`}
        id="dependentModal"
        tabIndex={-1}
        aria-hidden={openModal !== "dependentModal"}
        style={
          openModal === "dependentModal" ? { backgroundColor: "rgba(15,23,42,0.5)" } : undefined
        }
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            className="modal-content erp-form"
            style={{ border: "none", borderRadius: "14px" }}
            data-satellite-form
            data-satellite="dependent"
            onSubmit={(e) => {
              e.preventDefault();
              setOpenModal(null);
            }}
          >
            <input type="hidden" name="_method" value="POST" data-method-field />

            <div className="modal-body p-4">
              <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: 600 }} data-modal-title>
                Add dependent
              </h5>

              <div className="row">
                <div className="col-md-7">
                  <div className="erp-field">
                    <label htmlFor="d_name" className="form-label">
                      Name <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="d_name"
                      name="name"
                      className="form-control"
                      maxLength={150}
                      data-field="name"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="erp-field">
                    <label htmlFor="d_relationship" className="form-label">
                      Relationship
                    </label>
                    <select
                      id="d_relationship"
                      name="relationship"
                      className="form-select"
                      data-field="relationship"
                    >
                      <option value="">—</option>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="spouse">Spouse</option>
                      <option value="son">Son</option>
                      <option value="daughter">Daughter</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="d_dob" className="form-label">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="d_dob"
                      name="date_of_birth"
                      className="form-control"
                      max="2026-11-18"
                      data-field="date_of_birth"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="d_gender" className="form-label">
                      Gender
                    </label>
                    <select id="d_gender" name="gender" className="form-select" data-field="gender">
                      <option value="">—</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="d_phone" className="form-label">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      id="d_phone"
                      name="contact_phone"
                      className="form-control"
                      maxLength={40}
                      data-field="contact_phone"
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="erp-field mb-0">
                    <label htmlFor="d_notes" className="form-label">
                      Notes
                    </label>
                    <input
                      type="text"
                      id="d_notes"
                      name="notes"
                      className="form-control"
                      maxLength={255}
                      data-field="notes"
                    />
                  </div>
                </div>
              </div>

              <div className="erp-nominee-row mt-3">
                <label
                  className="d-inline-flex align-items-center gap-2"
                  style={{ fontSize: "12.5px" }}
                >
                  <input
                    type="checkbox"
                    name="is_nominee"
                    value="1"
                    data-field-check="is_nominee"
                    data-toggle-nominee
                    checked={isNominee}
                    onChange={(e) => setIsNominee(e.target.checked)}
                  />{" "}
                  Benefit nominee
                </label>
                <div className="erp-field mb-0" data-nominee-share hidden={!isNominee}>
                  <label htmlFor="d_share" className="form-label">
                    Share %
                  </label>
                  <input
                    type="number"
                    id="d_share"
                    name="nominee_share"
                    className="form-control"
                    min="0"
                    max="100"
                    step="0.01"
                    data-field="nominee_share"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setOpenModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp">
                <i className="fa-solid fa-floppy-disk me-2"></i>Save
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 8: #documentModal */}
      <div
        className={`modal fade ${openModal === "documentModal" ? "show d-block" : ""}`}
        id="documentModal"
        tabIndex={-1}
        aria-hidden={openModal !== "documentModal"}
        style={
          openModal === "documentModal" ? { backgroundColor: "rgba(15,23,42,0.5)" } : undefined
        }
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <form
            method="POST"
            encType="multipart/form-data"
            action={`/hr/employees/${emp?.id ?? 1}/documents`}
            className="modal-content erp-form"
            style={{ border: "none", borderRadius: "14px" }}
            data-doc-upload-form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setOpenModal(null);
            }}
          >
            <div className="modal-body p-4">
              <h5 className="mb-1" style={{ fontSize: "16px", fontWeight: 600 }}>
                Upload documents
              </h5>
              <p className="text-muted" style={{ fontSize: "12.5px" }}>
                Add as many as you like — each with its own type, title and file. Dates and notes can
                be set afterwards from a document&apos;s Edit.
              </p>

              <div data-doc-rows>
                {docUploadRows.map((r, idx) => (
                  <div key={idx} className="erp-doc-upload-row mb-2" data-doc-row>
                    <div className="row g-2 align-items-start">
                      <div className="col-md-3">
                        <select
                          name={`documents[${idx}][type]`}
                          className="form-select"
                          aria-label="Document type"
                          value={r.type}
                          onChange={(e) =>
                            setDocUploadRows((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, type: e.target.value } : item
                              )
                            )
                          }
                        >
                          <option value="national_id">National ID</option>
                          <option value="passport">Passport</option>
                          <option value="photo">Photograph</option>
                          <option value="cv">CV / Résumé</option>
                          <option value="certificate">Academic Certificate</option>
                          <option value="experience_letter">Experience Letter</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <input
                          type="text"
                          name={`documents[${idx}][title]`}
                          className="form-control"
                          maxLength={190}
                          placeholder="Title (defaults to file name)"
                          aria-label="Document title"
                          value={r.title}
                          onChange={(e) =>
                            setDocUploadRows((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, title: e.target.value } : item
                              )
                            )
                          }
                        />
                      </div>
                      <div className="col-md-5">
                        <div className="d-flex gap-2">
                          <input
                            type="file"
                            name={`documents[${idx}][file]`}
                            className="form-control"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.zip"
                            data-rule-maxsize="8192"
                            required
                            aria-label="Document file"
                          />
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            data-doc-remove
                            title="Remove"
                            onClick={() =>
                              setDocUploadRows((prev) =>
                                prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
                              )
                            }
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-erp-ghost btn-sm mt-1"
                data-doc-add
                onClick={() =>
                  setDocUploadRows((prev) => [...prev, { type: "national_id", title: "" }])
                }
              >
                <i className="fa-solid fa-plus me-1"></i>Add another
              </button>

              <span className="erp-help d-block mt-2">
                PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, WEBP, ZIP up to 8 MB each.
              </span>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setOpenModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" data-loading-text="Uploading…">
                <i className="fa-solid fa-upload me-2"></i>Upload
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 9: #deleteRecordModal */}
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
                    Delete employee?
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
