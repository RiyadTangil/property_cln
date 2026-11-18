"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

export interface PropertyOwnerItem {
  id: number;
  code: string;
  name: string;
  nid: string | null;
  tin: string | null;
  fatherName: string | null;
  motherName: string | null;
  dateOfBirth: string | null;
  occupation: string | null;
  mobile: string | null;
  alternateMobile: string | null;
  email: string | null;
  presentAddress: string | null;
  permanentAddress: string | null;
  notes: string | null;
  isActive: boolean;
}

interface OwnersClientProps {
  view: "owners" | "owners_create" | "owners_edit" | "owners_detail";
  owners?: PropertyOwnerItem[];
  owner?: PropertyOwnerItem;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function OwnersClient({
  view,
  owners = [],
  owner,
}: OwnersClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // List filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Detail tab state
  const [activeTab, setActiveTab] = useState<"groups" | "portal" | "docs">(
    "groups"
  );
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [showDocmModal, setShowDocmModal] = useState(false);
  const [showDocViewerModal, setShowDocViewerModal] = useState(false);

  // Create / Edit form state (17 fields)
  const [form, setForm] = useState({
    name: owner?.name ?? "",
    nid: owner?.nid ?? "",
    tin: owner?.tin ?? "",
    father_name: owner?.fatherName ?? "",
    mother_name: owner?.motherName ?? "",
    date_of_birth: owner?.dateOfBirth ?? "",
    occupation: owner?.occupation ?? "",
    mobile: owner?.mobile ?? "",
    alternate_mobile: owner?.alternateMobile ?? "",
    email: owner?.email ?? "",
    present_address: owner?.presentAddress ?? "",
    permanent_address: owner?.permanentAddress ?? "",
    notes: owner?.notes ?? "",
    is_active: owner ? owner.isActive : true,
  });

  async function handleSubmitOwner(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      if (view === "owners_edit" && owner) {
        const res = await fetch(`/api/sales/owners/${owner.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          router.push(`/owners/${owner.id}`);
          router.refresh();
        }
      } else {
        const res = await fetch("/api/sales/owners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          router.push("/owners");
          router.refresh();
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteOwner(
    e: React.FormEvent,
    id: number,
    name: string
  ) {
    e.preventDefault();
    if (!window.confirm(`Delete ${name}?`)) return;
    await fetch(`/api/sales/owners/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (view === "owners") {
    const filtered = owners.filter((o) => {
      if (statusFilter === "active" && !o.isActive) return false;
      if (statusFilter === "inactive" && o.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          o.name.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q) ||
          (o.nid ?? "").toLowerCase().includes(q) ||
          (o.mobile ?? "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-users"></i>
            </div>
            <div>
              <h1>Owners</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Clients</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Owners
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() => downloadCsv("owners.csv", ["Code", "Name", "NID", "Mobile", "Active"], filtered.map((r) => [r.code, r.name, r.nid, r.mobile, r.isActive]))}
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/owners/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Owner
            </Link>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-card-head">
            <form
              method="GET"
              action="/owners"
              className="erp-filterbar"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-search erp-search-sm">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, code, NID, mobile…"
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </form>
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} {filtered.length === 1 ? "owner" : "owners"}
            </span>
          </div>

          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>NID</th>
                    <th>Contact</th>
                    <th className="text-center">Groups</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id}>
                      <td className="erp-cell-strong">
                        <Link href={`/owners/${o.id}`} className="erp-link">
                          {o.name}
                        </Link>
                        <span className="erp-identity-meta d-block">
                          {o.code}
                          {o.fatherName ? ` · S/D of ${o.fatherName}` : ""}
                        </span>
                      </td>
                      <td>{o.nid || "—"}</td>
                      <td>{o.mobile || "—"}</td>
                      <td className="text-center">0</td>
                      <td>
                        {o.isActive ? (
                          <span className="erp-pill is-available">
                            <i className="fa-solid fa-check me-1"></i>Active
                          </span>
                        ) : (
                          <span className="erp-pill is-muted">Inactive</span>
                        )}
                      </td>
                      <td>
                        <span className="erp-created-by">
                          <span className="erp-cell-strong">
                            System Administrator
                          </span>
                          <span className="erp-identity-meta d-block">
                            30 Oct 2026
                          </span>
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <Link
                          href={`/owners/${o.id}`}
                          className="btn btn-erp-ghost btn-sm"
                          title="View"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </Link>
                        <Link
                          href={`/owners/${o.id}/edit`}
                          className="btn btn-erp-ghost btn-sm"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </Link>
                        <form
                          method="POST"
                          action={`/owners/${o.id}`}
                          className="d-inline"
                          onSubmit={(e) => handleDeleteOwner(e, o.id, o.name)}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "owners_detail" && owner) {
    const fatherMother = [owner.fatherName, owner.motherName]
      .filter(Boolean)
      .join(" / ");
    const defaultUsername = owner.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "");

    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-user"></i>
            </div>
            <div>
              <h1>{owner.name}</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/owners">Owners</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {owner.code}
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <Link
              href={`/owners/${owner.id}/edit`}
              className="btn btn-erp-ghost"
            >
              <i className="fa-solid fa-pen me-2"></i>Edit
            </Link>
          </div>
        </div>

        <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:lg:grid-cols-12 tw:lg:h-[calc(100vh-215px)] tw:lg:min-h-[460px]">
          <aside className="tw:flex tw:min-h-0 tw:flex-col tw:gap-3 tw:lg:col-span-3">
            <div className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm tw:dark:border-slate-700 tw:dark:bg-slate-900">
              <div className="tw:h-14 tw:bg-linear-to-r tw:from-indigo-600 tw:via-violet-600 tw:to-fuchsia-600"></div>
              <div className="tw:-mt-9 tw:px-4 tw:pb-4 tw:text-center">
                <div className="tw:mx-auto tw:flex tw:h-16 tw:w-16 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-linear-to-br tw:from-indigo-500 tw:to-violet-600 tw:text-xl tw:font-bold tw:text-white tw:shadow-lg tw:ring-4 tw:ring-white tw:dark:ring-slate-900">
                  {getInitials(owner.name)}
                </div>

                <h2 className="tw:mt-2 tw:mb-0 tw:text-base tw:font-bold tw:text-slate-900 tw:dark:text-slate-100">
                  {owner.name}
                </h2>
                <div className="tw:mt-0.5 tw:font-mono tw:text-xs tw:text-slate-500">
                  {owner.code}
                </div>

                <div className="tw:mt-2">
                  <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-emerald-100 tw:px-3 tw:py-1 tw:text-xs tw:font-semibold tw:text-emerald-700 tw:dark:bg-emerald-500/15 tw:dark:text-emerald-300">
                    <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-emerald-500"></span>{" "}
                    {owner.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="tw:mt-3 tw:grid tw:grid-cols-2 tw:gap-2">
                  <div className="tw:rounded-xl tw:bg-indigo-50 tw:p-2 tw:dark:bg-indigo-500/10">
                    <div className="tw:text-lg tw:font-bold tw:leading-tight tw:text-indigo-700 tw:dark:text-indigo-300">
                      0
                    </div>
                    <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-slate-500">
                      Client groups
                    </div>
                  </div>
                  <div className="tw:rounded-xl tw:bg-fuchsia-50 tw:p-2 tw:dark:bg-fuchsia-500/10">
                    <div className="tw:text-lg tw:font-bold tw:leading-tight tw:text-fuchsia-700 tw:dark:text-fuchsia-300">
                      0
                    </div>
                    <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-slate-500">
                      Documents
                    </div>
                  </div>
                </div>

                <div className="tw:mt-3 tw:flex tw:gap-2">
                  {owner.mobile && (
                    <a
                      href={`tel:${owner.mobile}`}
                      className="tw:inline-flex tw:flex-1 tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-lg tw:bg-emerald-500 tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-white tw:no-underline tw:shadow-sm tw:hover:bg-emerald-600"
                      title={`Call ${owner.mobile}`}
                    >
                      <i className="fa-solid fa-phone"></i> Call
                    </a>
                  )}
                  {owner.email && (
                    <a
                      href={`mailto:${owner.email}`}
                      className="tw:inline-flex tw:flex-1 tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-slate-200 tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:text-slate-700 tw:no-underline tw:hover:bg-slate-50 tw:dark:border-slate-700 tw:dark:text-slate-200 tw:dark:hover:bg-slate-800"
                      title={owner.email}
                    >
                      <i className="fa-solid fa-envelope"></i> Email
                    </a>
                  )}
                </div>
              </div>
            </div>
          </aside>

          <div className="tw:flex tw:min-h-0 tw:flex-col tw:gap-3 tw:lg:col-span-9">
            <section className="tw:shrink-0 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm tw:dark:border-slate-700 tw:dark:bg-slate-900">
              <header className="tw:flex tw:items-center tw:gap-2 tw:border-b tw:border-slate-100 tw:px-4 tw:py-2.5 tw:dark:border-slate-800">
                <span className="tw:flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-lg tw:bg-indigo-100 tw:text-xs tw:text-indigo-600 tw:dark:bg-indigo-500/15 tw:dark:text-indigo-300">
                  <i className="fa-solid fa-address-card"></i>
                </span>
                <h3 className="tw:m-0 tw:text-sm tw:font-semibold">Details</h3>
              </header>
              <dl className="tw:m-0 tw:grid tw:grid-cols-2 tw:gap-2 tw:p-3 tw:md:grid-cols-4">
                <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:bg-slate-50 tw:px-2.5 tw:py-2 tw:dark:bg-slate-800/60">
                  <i className="fa-solid fa-user-group tw:mt-0.5 tw:w-3.5 tw:text-center tw:text-xs tw:text-violet-400"></i>
                  <div className="tw:min-w-0">
                    <dt className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                      Father / Mother
                    </dt>
                    <dd
                      className="tw:m-0 tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800 tw:dark:text-slate-100"
                      title={fatherMother}
                    >
                      {fatherMother || "—"}
                    </dd>
                  </div>
                </div>
                <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:bg-slate-50 tw:px-2.5 tw:py-2 tw:dark:bg-slate-800/60">
                  <i className="fa-solid fa-id-card tw:mt-0.5 tw:w-3.5 tw:text-center tw:text-xs tw:text-violet-400"></i>
                  <div className="tw:min-w-0">
                    <dt className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                      NID
                    </dt>
                    <dd
                      className="tw:m-0 tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800 tw:dark:text-slate-100"
                      title={owner.nid ?? ""}
                    >
                      {owner.nid || "—"}
                    </dd>
                  </div>
                </div>
                <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:bg-slate-50 tw:px-2.5 tw:py-2 tw:dark:bg-slate-800/60">
                  <i className="fa-solid fa-file-invoice tw:mt-0.5 tw:w-3.5 tw:text-center tw:text-xs tw:text-violet-400"></i>
                  <div className="tw:min-w-0">
                    <dt className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                      TIN
                    </dt>
                    <dd
                      className="tw:m-0 tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800 tw:dark:text-slate-100"
                      title={owner.tin ?? ""}
                    >
                      {owner.tin || "—"}
                    </dd>
                  </div>
                </div>
                <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:bg-slate-50 tw:px-2.5 tw:py-2 tw:dark:bg-slate-800/60">
                  <i className="fa-solid fa-cake-candles tw:mt-0.5 tw:w-3.5 tw:text-center tw:text-xs tw:text-violet-400"></i>
                  <div className="tw:min-w-0">
                    <dt className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                      Date of birth
                    </dt>
                    <dd
                      className="tw:m-0 tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800 tw:dark:text-slate-100"
                      title={owner.dateOfBirth ?? ""}
                    >
                      {owner.dateOfBirth || "—"}
                    </dd>
                  </div>
                </div>
                <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:bg-slate-50 tw:px-2.5 tw:py-2 tw:dark:bg-slate-800/60">
                  <i className="fa-solid fa-briefcase tw:mt-0.5 tw:w-3.5 tw:text-center tw:text-xs tw:text-violet-400"></i>
                  <div className="tw:min-w-0">
                    <dt className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                      Occupation
                    </dt>
                    <dd
                      className="tw:m-0 tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800 tw:dark:text-slate-100"
                      title={owner.occupation ?? ""}
                    >
                      {owner.occupation || "—"}
                    </dd>
                  </div>
                </div>
                <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:bg-slate-50 tw:px-2.5 tw:py-2 tw:dark:bg-slate-800/60">
                  <i className="fa-solid fa-mobile-screen tw:mt-0.5 tw:w-3.5 tw:text-center tw:text-xs tw:text-violet-400"></i>
                  <div className="tw:min-w-0">
                    <dt className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                      Mobile
                    </dt>
                    <dd
                      className="tw:m-0 tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800 tw:dark:text-slate-100"
                      title={owner.mobile ?? ""}
                    >
                      {owner.mobile || "—"}
                    </dd>
                  </div>
                </div>
                <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:bg-slate-50 tw:px-2.5 tw:py-2 tw:dark:bg-slate-800/60">
                  <i className="fa-solid fa-phone tw:mt-0.5 tw:w-3.5 tw:text-center tw:text-xs tw:text-violet-400"></i>
                  <div className="tw:min-w-0">
                    <dt className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                      Alternate
                    </dt>
                    <dd
                      className="tw:m-0 tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800 tw:dark:text-slate-100"
                      title={owner.alternateMobile ?? ""}
                    >
                      {owner.alternateMobile || "—"}
                    </dd>
                  </div>
                </div>
                <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:bg-slate-50 tw:px-2.5 tw:py-2 tw:dark:bg-slate-800/60">
                  <i className="fa-solid fa-envelope tw:mt-0.5 tw:w-3.5 tw:text-center tw:text-xs tw:text-violet-400"></i>
                  <div className="tw:min-w-0">
                    <dt className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                      Email
                    </dt>
                    <dd
                      className="tw:m-0 tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800 tw:dark:text-slate-100"
                      title={owner.email ?? ""}
                    >
                      {owner.email || "—"}
                    </dd>
                  </div>
                </div>
                <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:bg-slate-50 tw:px-2.5 tw:py-2 tw:dark:bg-slate-800/60 tw:col-span-2">
                  <i className="fa-solid fa-location-dot tw:mt-0.5 tw:w-3.5 tw:text-center tw:text-xs tw:text-violet-400"></i>
                  <div className="tw:min-w-0">
                    <dt className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                      Present address
                    </dt>
                    <dd
                      className="tw:m-0 tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800 tw:dark:text-slate-100"
                      title={owner.presentAddress ?? ""}
                    >
                      {owner.presentAddress || "—"}
                    </dd>
                  </div>
                </div>
                <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:bg-slate-50 tw:px-2.5 tw:py-2 tw:dark:bg-slate-800/60 tw:col-span-2">
                  <i className="fa-solid fa-house tw:mt-0.5 tw:w-3.5 tw:text-center tw:text-xs tw:text-violet-400"></i>
                  <div className="tw:min-w-0">
                    <dt className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-slate-500">
                      Permanent address
                    </dt>
                    <dd
                      className="tw:m-0 tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800 tw:dark:text-slate-100"
                      title={owner.permanentAddress ?? ""}
                    >
                      {owner.permanentAddress || "—"}
                    </dd>
                  </div>
                </div>
              </dl>
            </section>

            <section
              className="tw:flex tw:min-h-[320px] tw:flex-1 tw:flex-col tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm tw:lg:min-h-0 tw:dark:border-slate-700 tw:dark:bg-slate-900"
              data-owner-tabs
            >
              <nav
                className="tw:flex tw:shrink-0 tw:gap-1 tw:border-b tw:border-slate-100 tw:px-3 tw:pt-2 tw:dark:border-slate-800"
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  data-owner-tab="groups"
                  aria-selected={activeTab === "groups"}
                  onClick={() => setActiveTab("groups")}
                  className="owner-tab tw:inline-flex tw:items-center tw:gap-2 tw:border-0 tw:border-b-2 tw:border-transparent tw:bg-transparent tw:px-3 tw:py-2 tw:text-sm tw:font-medium tw:text-slate-500 tw:hover:text-slate-800 tw:dark:hover:text-slate-200"
                >
                  <i className="fa-solid fa-handshake"></i>Client groups
                  <span className="tw:rounded-full tw:bg-slate-100 tw:px-1.5 tw:text-[10px] tw:font-semibold tw:dark:bg-slate-800">
                    0
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  data-owner-tab="portal"
                  aria-selected={activeTab === "portal"}
                  onClick={() => setActiveTab("portal")}
                  className="owner-tab tw:inline-flex tw:items-center tw:gap-2 tw:border-0 tw:border-b-2 tw:border-transparent tw:bg-transparent tw:px-3 tw:py-2 tw:text-sm tw:font-medium tw:text-slate-500 tw:hover:text-slate-800 tw:dark:hover:text-slate-200"
                >
                  <i className="fa-solid fa-key"></i>Portal access
                </button>
                <button
                  type="button"
                  role="tab"
                  data-owner-tab="docs"
                  aria-selected={activeTab === "docs"}
                  onClick={() => setActiveTab("docs")}
                  className="owner-tab tw:inline-flex tw:items-center tw:gap-2 tw:border-0 tw:border-b-2 tw:border-transparent tw:bg-transparent tw:px-3 tw:py-2 tw:text-sm tw:font-medium tw:text-slate-500 tw:hover:text-slate-800 tw:dark:hover:text-slate-200"
                >
                  <i className="fa-solid fa-folder-open"></i>Documents
                  <span className="tw:rounded-full tw:bg-slate-100 tw:px-1.5 tw:text-[10px] tw:font-semibold tw:dark:bg-slate-800">
                    0
                  </span>
                </button>
              </nav>

              <div
                className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto"
                data-owner-pane="groups"
                hidden={activeTab !== "groups"}
              >
                <div className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:px-5 tw:py-8 tw:text-slate-400">
                  <i className="fa-solid fa-users-slash tw:text-2xl"></i>
                  <span className="tw:text-sm">
                    Not part of any client group yet.
                  </span>
                </div>
              </div>

              <div
                className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto tw:p-3"
                data-owner-pane="portal"
                hidden={activeTab !== "portal"}
              >
                <div
                  className="erp-card"
                  data-portal-access
                  data-store-url={`/owners/${owner.id}/portal-access`}
                  data-reset-url={`/owners/${owner.id}/portal-access`}
                  data-destroy-url={`/owners/${owner.id}/portal-access`}
                >
                  <div className="erp-section-head">
                    <div className="erp-section-icon">
                      <i className="fa-solid fa-right-to-bracket"></i>
                    </div>
                    <div>
                      <h2>Portal Access</h2>
                      <p>
                        Lets {owner.name} sign in and follow their own project,
                        payments and balance.
                      </p>
                    </div>
                    <div className="ms-auto d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-erp btn-sm"
                        data-portal-create
                        onClick={() => setShowPortalModal(true)}
                      >
                        <i className="fa-solid fa-user-plus me-1"></i>Create
                        login
                      </button>
                    </div>
                  </div>

                  <div className="erp-card-body">
                    <div className="erp-portal-status">
                      <i className="fa-solid fa-circle-minus"></i>
                      <div>
                        <strong>No login</strong>
                        <span>
                          {owner.name} cannot sign in. Create a login to give
                          them one.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`modal fade ${showPortalModal ? "show d-block" : ""}`}
                  id="portalAccessModal"
                  tabIndex={-1}
                  aria-hidden={!showPortalModal}
                >
                  <div className="modal-dialog modal-dialog-centered">
                    <form
                      className="modal-content erp-form"
                      data-portal-form
                      style={{ border: "none", borderRadius: "14px" }}
                      onSubmit={(e) => {
                        e.preventDefault();
                        setShowPortalModal(false);
                      }}
                    >
                      <div className="modal-body p-4">
                        <h5
                          className="mb-1"
                          style={{ fontSize: "16px", fontWeight: 600 }}
                          data-portal-title
                        >
                          Create login
                        </h5>
                        <p
                          className="text-muted mb-3"
                          style={{ fontSize: "12.5px" }}
                          data-portal-lead
                        >
                          {owner.name} will sign in on the normal sign-in page.
                        </p>

                        <div
                          className="alert alert-danger py-2"
                          role="alert"
                          data-portal-error
                          hidden
                          style={{ borderRadius: "10px", fontSize: "12.5px" }}
                        >
                          <i className="fa-solid fa-circle-exclamation me-1"></i>
                          <span data-portal-error-text></span>
                        </div>

                        <div className="erp-field" data-portal-identity>
                          <label className="form-label">
                            Username <span className="erp-required">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            maxLength={60}
                            data-portal-username
                            defaultValue={defaultUsername}
                            autoComplete="off"
                            spellCheck={false}
                          />
                          <span className="erp-help">
                            What they type to sign in. Letters, numbers, dots,
                            dashes and underscores.
                          </span>
                        </div>

                        <div className="erp-field" data-portal-identity>
                          <label className="form-label">
                            Email <span className="text-muted">(optional)</span>
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            maxLength={190}
                            data-portal-email
                            defaultValue={owner.email ?? ""}
                          />
                          <span className="erp-help">
                            Only for your records &mdash; they sign in with the
                            username above. Leave it blank if they have none.
                          </span>
                        </div>

                        <div className="erp-field">
                          <label className="form-label">
                            Password <span className="erp-required">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            data-portal-password
                            autoComplete="new-password"
                            minLength={8}
                          />
                          <span className="erp-help">
                            Shown as plain text on purpose &mdash; this is
                            usually read out to the customer, who can change it
                            themselves once they are in.
                          </span>
                        </div>

                        <div className="erp-field mb-0">
                          <label className="form-label">
                            Confirm password{" "}
                            <span className="erp-required">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            data-portal-password-confirm
                            autoComplete="new-password"
                          />
                        </div>
                      </div>

                      <div
                        className="modal-footer"
                        style={{ borderTop: "1px solid var(--erp-line)" }}
                      >
                        <button
                          type="button"
                          className="btn btn-erp-ghost"
                          data-bs-dismiss="modal"
                          onClick={() => setShowPortalModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-erp"
                          data-portal-submit
                        >
                          <i className="fa-solid fa-floppy-disk me-2"></i>Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div
                className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto tw:p-3"
                data-owner-pane="docs"
                hidden={activeTab !== "docs"}
              >
                <div
                  className="erp-docm"
                  data-doc-manager
                  data-type="owner"
                  data-id={String(owner.id)}
                  data-collection=""
                >
                  <div className="d-flex justify-content-end mb-2">
                    <button
                      type="button"
                      className="btn btn-erp btn-sm"
                      data-docm-add
                      onClick={() => setShowDocmModal(true)}
                    >
                      <i className="fa-solid fa-upload me-1"></i>Add Document
                    </button>
                  </div>

                  <div data-docm-list>
                    <p className="erp-cv-empty mb-0">No documents yet.</p>
                  </div>
                </div>

                <div
                  className={`modal fade ${showDocmModal ? "show d-block" : ""}`}
                  id="docmModal"
                  tabIndex={-1}
                  aria-hidden={!showDocmModal}
                >
                  <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div
                      className="modal-content"
                      style={{ border: "none", borderRadius: "14px" }}
                    >
                      <form
                        data-docm-form
                        encType="multipart/form-data"
                        onSubmit={(e) => {
                          e.preventDefault();
                          setShowDocmModal(false);
                        }}
                      >
                        <div className="modal-header border-0 px-4 pt-4 pb-0">
                          <h5
                            className="mb-0"
                            style={{ fontSize: "16px", fontWeight: 600 }}
                          >
                            <i className="fa-solid fa-paperclip me-2 text-muted"></i>
                            <span data-docm-modal-title>Add Document</span>
                          </h5>
                          <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            onClick={() => setShowDocmModal(false)}
                          ></button>
                        </div>
                        <div className="modal-body p-4">
                          <div data-docm-file-field className="erp-field mb-3">
                            <label className="form-label">
                              File <span className="erp-required">*</span>
                            </label>
                            <input
                              type="file"
                              name="documents[]"
                              className="form-control"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.zip,.txt,.csv,.dwg"
                              data-docm-file
                            />
                          </div>
                          <div className="row">
                            <div className="col-md-8">
                              <div className="erp-field">
                                <label className="form-label">Title</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  data-docm-field="title"
                                  maxLength={190}
                                  placeholder="e.g. Development Agreement Deed"
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="erp-field">
                                <label className="form-label">
                                  Document No
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  data-docm-field="document_no"
                                  maxLength={100}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-md-4">
                              <div className="erp-field">
                                <label className="form-label">Issued By</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  data-docm-field="issued_by"
                                  maxLength={190}
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="erp-field">
                                <label className="form-label">Issue Date</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  data-docm-field="issue_date"
                                />
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="erp-field">
                                <label className="form-label">
                                  Expiry Date
                                </label>
                                <input
                                  type="date"
                                  className="form-control"
                                  data-docm-field="expiry_date"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="erp-field">
                            <label className="form-label d-block">
                              Visibility{" "}
                              <span
                                className="text-muted"
                                style={{ fontWeight: 400 }}
                              >
                                — leave all unticked for every staff member
                              </span>
                            </label>
                            <div className="d-flex flex-wrap gap-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  value="management"
                                  id="docm-vis-management"
                                  data-docm-visibility
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="docm-vis-management"
                                >
                                  Management
                                </label>
                              </div>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  value="accounts"
                                  id="docm-vis-accounts"
                                  data-docm-visibility
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="docm-vis-accounts"
                                >
                                  Accounts
                                </label>
                              </div>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  value="legal"
                                  id="docm-vis-legal"
                                  data-docm-visibility
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="docm-vis-legal"
                                >
                                  Legal
                                </label>
                              </div>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  value="general"
                                  id="docm-vis-general"
                                  data-docm-visibility
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="docm-vis-general"
                                >
                                  General Staff
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer border-0 px-4 pb-4 pt-0">
                          <button
                            type="button"
                            className="btn btn-erp-ghost"
                            data-bs-dismiss="modal"
                            onClick={() => setShowDocmModal(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-erp"
                            data-docm-submit
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                <div
                  className={`modal fade ${showDocViewerModal ? "show d-block" : ""}`}
                  id="docViewerModal"
                  tabIndex={-1}
                  aria-hidden={!showDocViewerModal}
                  aria-labelledby="docViewerTitle"
                >
                  <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content erp-docview">
                      <div className="modal-header">
                        <div className="erp-docview-head">
                          <i
                            className="fa-solid fa-file-lines"
                            data-docview-icon
                          ></i>
                          <div>
                            <h5 id="docViewerTitle" data-docview-title>
                              Document
                            </h5>
                            <span
                              className="erp-docview-sub"
                              data-docview-meta
                            ></span>
                          </div>
                        </div>

                        <div className="erp-docview-tools">
                          <a
                            href="#"
                            className="btn btn-erp-ghost btn-sm"
                            target="_blank"
                            rel="noopener"
                            data-docview-open
                          >
                            <i className="fa-solid fa-up-right-from-square me-1"></i>
                            New tab
                          </a>
                          <a
                            href="#"
                            className="btn btn-erp-ghost btn-sm"
                            download
                            data-docview-download
                          >
                            <i className="fa-solid fa-download me-1"></i>
                            Download
                          </a>
                          <button
                            type="button"
                            className="btn-close ms-1"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            onClick={() => setShowDocViewerModal(false)}
                          ></button>
                        </div>
                      </div>

                      <div className="modal-body p-0">
                        <div
                          className="erp-docview-stage"
                          data-docview-stage
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // owners_create or owners_edit
  const isEdit = view === "owners_edit" && owner;
  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i
              className={
                isEdit ? "fa-solid fa-user-pen" : "fa-solid fa-user-plus"
              }
            ></i>
          </div>
          <div>
            <h1>{isEdit ? "Edit Owner" : "New Owner"}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/owners">Owners</Link>
                </li>
                {isEdit && owner && (
                  <li className="breadcrumb-item">
                    <Link href={`/owners/${owner.id}`}>{owner.code}</Link>
                  </li>
                )}
                <li className="breadcrumb-item active" aria-current="page">
                  {isEdit ? "Edit" : "New"}
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <form
        method="POST"
        action={isEdit && owner ? `/owners/${owner.id}` : "/owners"}
        className="erp-form"
        data-owner-form
        encType="multipart/form-data"
        noValidate
        onSubmit={handleSubmitOwner}
      >
        {isEdit && <input type="hidden" name="_method" value="PUT" />}

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-user"></i>
            </div>
            <div>
              <h2>Identity</h2>
              <p>How this person is named on a deed.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="name" className="form-label">
                    Name <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control "
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={190}
                    required
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="nid" className="form-label">
                    NID
                  </label>
                  <input
                    type="text"
                    id="nid"
                    name="nid"
                    className="form-control"
                    value={form.nid}
                    onChange={(e) => setForm({ ...form, nid: e.target.value })}
                    maxLength={40}
                  />
                </div>
              </div>
              <div className="col-md-3">
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
                    onChange={(e) => setForm({ ...form, tin: e.target.value })}
                    maxLength={40}
                  />
                </div>
              </div>
            </div>
            <div className="row">
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
                    onChange={(e) =>
                      setForm({ ...form, father_name: e.target.value })
                    }
                    maxLength={190}
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
                    onChange={(e) =>
                      setForm({ ...form, mother_name: e.target.value })
                    }
                    maxLength={190}
                  />
                </div>
              </div>
              <div className="col-md-2">
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
                    onChange={(e) =>
                      setForm({ ...form, date_of_birth: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="col-md-2">
                <div className="erp-field">
                  <label htmlFor="occupation" className="form-label">
                    Occupation
                  </label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    className="form-control"
                    value={form.occupation}
                    onChange={(e) =>
                      setForm({ ...form, occupation: e.target.value })
                    }
                    maxLength={120}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-address-book"></i>
            </div>
            <div>
              <h2>Contact &amp; Address</h2>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="mobile" className="form-label">
                    Mobile
                  </label>
                  <input
                    type="text"
                    id="mobile"
                    name="mobile"
                    className="form-control"
                    value={form.mobile}
                    onChange={(e) =>
                      setForm({ ...form, mobile: e.target.value })
                    }
                    maxLength={30}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="alternate_mobile" className="form-label">
                    Alternate Mobile
                  </label>
                  <input
                    type="text"
                    id="alternate_mobile"
                    name="alternate_mobile"
                    className="form-control"
                    value={form.alternate_mobile}
                    onChange={(e) =>
                      setForm({ ...form, alternate_mobile: e.target.value })
                    }
                    maxLength={30}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control "
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    maxLength={190}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="present_address" className="form-label">
                    Present Address
                  </label>
                  <textarea
                    id="present_address"
                    name="present_address"
                    className="form-control"
                    rows={2}
                    maxLength={1000}
                    value={form.present_address}
                    onChange={(e) =>
                      setForm({ ...form, present_address: e.target.value })
                    }
                  ></textarea>
                </div>
              </div>
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="permanent_address" className="form-label">
                    Permanent Address
                  </label>
                  <textarea
                    id="permanent_address"
                    name="permanent_address"
                    className="form-control"
                    rows={2}
                    maxLength={1000}
                    value={form.permanent_address}
                    onChange={(e) =>
                      setForm({ ...form, permanent_address: e.target.value })
                    }
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="photo" className="form-label">
                    Photo
                  </label>
                  <input
                    type="file"
                    id="photo"
                    name="photo"
                    className="form-control "
                    accept="image/*"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="notes" className="form-label">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="form-control"
                    rows={2}
                    maxLength={5000}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="form-check">
              <input type="hidden" name="is_active" value="0" />
              <input
                className="form-check-input"
                type="checkbox"
                id="is_active"
                name="is_active"
                value="1"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              <label className="form-check-label" htmlFor="is_active">
                Active
              </label>
            </div>
          </div>
        </section>

        <div>
          <button
            type="submit"
            className="btn btn-erp"
            data-submit
            disabled={submitting}
          >
            <span data-submit-label>
              {isEdit ? "Update Owner" : "Create Owner"}
            </span>
          </button>
          <Link
            href={isEdit && owner ? `/owners/${owner.id}` : "/owners"}
            className="btn btn-erp-ghost"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
