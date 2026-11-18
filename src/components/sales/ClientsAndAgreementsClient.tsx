"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

export interface ClientItem {
  id: number;
  code: string;
  clientType: string;
  name: string;
  fatherName: string | null;
  motherName: string | null;
  occupation: string | null;
  nid: string | null;
  dateOfBirth: string | null;
  registrationNo: string | null;
  bin: string | null;
  authorizedPerson: string | null;
  authorizedDesignation: string | null;
  officeAddress: string | null;
  mobile: string | null;
  alternateMobile: string | null;
  email: string | null;
  tin: string | null;
  presentAddress: string | null;
  permanentAddress: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface AgreementItem {
  id: number;
  code: string;
  clientId: number | null;
  projectId: number | null;
  agreementType: string;
  contractValue: number;
  signedBy: string | null;
  agreementDate: string;
  effectiveDate: string | null;
  expiryDate: string | null;
  status: string;
  notes: string | null;
}

export interface ProjectRef {
  id: number;
  code: string;
  name: string;
}

interface ClientsAndAgreementsClientProps {
  view: "clients" | "clients_create" | "agreements" | "agreements_create";
  clients?: ClientItem[];
  agreements?: AgreementItem[];
  projects?: ProjectRef[];
}

export default function ClientsAndAgreementsClient({
  view,
  clients = [],
  agreements = [],
  projects = [],
}: ClientsAndAgreementsClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Filters for clients
  const [clientSearch, setClientSearch] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState("");

  // Filters for agreements
  const [agrSearch, setAgrSearch] = useState("");
  const [agrStatusFilter, setAgrStatusFilter] = useState("");
  const [agrTypeFilter, setAgrTypeFilter] = useState("");

  // Client create form state (21 fields)
  const [clientForm, setClientForm] = useState({
    client_type: "individual",
    name: "",
    father_name: "",
    mother_name: "",
    occupation: "",
    nid: "",
    date_of_birth: "",
    registration_no: "",
    bin: "",
    authorized_person: "",
    authorized_designation: "",
    office_address: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    tin: "",
    present_address: "",
    permanent_address: "",
    notes: "",
    is_active: true,
  });

  // Agreement create form state (9 fields)
  const [agreementForm, setAgreementForm] = useState({
    client_id: "",
    project_id: "",
    agreement_type: "development",
    contract_value: "0",
    signed_by: "",
    agreement_date: "",
    effective_date: "",
    expiry_date: "",
    notes: "",
  });

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!clientForm.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientForm),
      });
      if (res.ok) {
        router.push("/clients");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteClient(id: number, name: string) {
    if (!window.confirm(`Delete ${name}?`)) return;
    await fetch(`/api/sales/clients/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleCreateAgreement(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agreementForm),
      });
      if (res.ok) {
        router.push("/agreements");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAgreement(id: number, code: string) {
    if (!window.confirm(`Delete ${code}?`)) return;
    await fetch(`/api/sales/agreements/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (view === "clients") {
    const filtered = clients.filter((c) => {
      if (clientTypeFilter && c.clientType !== clientTypeFilter) return false;
      if (clientStatusFilter === "active" && !c.isActive) return false;
      if (clientStatusFilter === "inactive" && c.isActive) return false;
      if (clientSearch) {
        const q = clientSearch.toLowerCase();
        const match =
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.nid ?? "").toLowerCase().includes(q) ||
          (c.mobile ?? "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-handshake"></i>
            </div>
            <div>
              <h1>Clients</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Clients</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    All Clients
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() => downloadCsv("clients.csv", ["Code", "Name", "Type", "Mobile", "Email", "Active"], filtered.map((r) => [r.code, r.name, r.clientType, r.mobile, r.email, r.isActive]))}
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/clients/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Client
            </Link>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-card-head">
            <form
              method="GET"
              action="/clients"
              className="erp-filterbar"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-search erp-search-sm">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Code, name, NID, mobile…"
                  aria-label="Search"
                />
              </div>
              <select
                name="client_type"
                className="erp-select"
                value={clientTypeFilter}
                onChange={(e) => setClientTypeFilter(e.target.value)}
                aria-label="Client type"
              >
                <option value="">Any type</option>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="joint_owners">Joint Owners</option>
                <option value="organization">Organization</option>
              </select>
              <select
                name="status"
                className="erp-select"
                value={clientStatusFilter}
                onChange={(e) => setClientStatusFilter(e.target.value)}
                aria-label="Status"
              >
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </form>
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} {filtered.length === 1 ? "client" : "clients"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-handshake"></i>
              </div>
              <h3>No clients yet</h3>
              <p>
                A client is the project owner — the party that engaged the
                company to build.
              </p>
              <Link href="/clients/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Client
              </Link>
            </div>
          ) : (
            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Type</th>
                      <th>NID / Reg</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id}>
                        <td className="erp-cell-strong">
                          <span>{c.name}</span>
                          <span className="erp-identity-meta d-block">
                            {c.code}
                          </span>
                        </td>
                        <td className="text-capitalize">
                          {c.clientType.replace("_", " ")}
                        </td>
                        <td>{c.nid || c.registrationNo || "—"}</td>
                        <td>{c.mobile || c.email || "—"}</td>
                        <td>
                          {c.isActive ? (
                            <span className="erp-pill is-available">
                              <i className="fa-solid fa-check me-1"></i>Active
                            </span>
                          ) : (
                            <span className="erp-pill is-muted">Inactive</span>
                          )}
                        </td>
                        <td className="text-end text-nowrap">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            onClick={() => handleDeleteClient(c.id, c.name)}
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
      </div>
    );
  }

  if (view === "clients_create") {
    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-handshake"></i>
            </div>
            <div>
              <h1>New Client</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="/clients">Clients</Link>
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
          action="/clients"
          className="erp-form"
          data-client-form
          noValidate
          onSubmit={handleCreateClient}
        >
          <section className="erp-card">
            <div className="erp-section-head">
              <div className="erp-section-icon">
                <i className="fa-solid fa-id-card"></i>
              </div>
              <div>
                <h2>Client</h2>
                <p>Who engaged the company, and how they are identified.</p>
              </div>
            </div>
            <div className="erp-card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="client_type" className="form-label">
                      Client Type <span className="erp-required">*</span>
                    </label>
                    <select
                      id="client_type"
                      name="client_type"
                      className="form-control "
                      data-select2
                      data-client-type
                      value={clientForm.client_type}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          client_type: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                      <option value="joint_owners">Joint Owners</option>
                      <option value="organization">Organization</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="erp-field">
                    <label htmlFor="name" className="form-label">
                      Name / Group Name <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control "
                      value={clientForm.name}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, name: e.target.value })
                      }
                      maxLength={190}
                      required
                    />
                  </div>
                </div>
              </div>

              <div data-type-group="individual">
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
                        value={clientForm.father_name}
                        onChange={(e) =>
                          setClientForm({
                            ...clientForm,
                            father_name: e.target.value,
                          })
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
                        value={clientForm.mother_name}
                        onChange={(e) =>
                          setClientForm({
                            ...clientForm,
                            mother_name: e.target.value,
                          })
                        }
                        maxLength={190}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="occupation" className="form-label">
                        Occupation
                      </label>
                      <input
                        type="text"
                        id="occupation"
                        name="occupation"
                        className="form-control"
                        value={clientForm.occupation}
                        onChange={(e) =>
                          setClientForm({
                            ...clientForm,
                            occupation: e.target.value,
                          })
                        }
                        maxLength={120}
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="nid" className="form-label">
                        NID
                      </label>
                      <input
                        type="text"
                        id="nid"
                        name="nid"
                        className="form-control"
                        value={clientForm.nid}
                        onChange={(e) =>
                          setClientForm({ ...clientForm, nid: e.target.value })
                        }
                        maxLength={40}
                      />
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
                        value={clientForm.date_of_birth}
                        onChange={(e) =>
                          setClientForm({
                            ...clientForm,
                            date_of_birth: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div data-type-group="entity">
                <div className="row">
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="registration_no" className="form-label">
                        Registration No.
                      </label>
                      <input
                        type="text"
                        id="registration_no"
                        name="registration_no"
                        className="form-control"
                        value={clientForm.registration_no}
                        onChange={(e) =>
                          setClientForm({
                            ...clientForm,
                            registration_no: e.target.value,
                          })
                        }
                        maxLength={80}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="bin" className="form-label">
                        BIN
                      </label>
                      <input
                        type="text"
                        id="bin"
                        name="bin"
                        className="form-control"
                        value={clientForm.bin}
                        onChange={(e) =>
                          setClientForm({ ...clientForm, bin: e.target.value })
                        }
                        maxLength={40}
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="authorized_person" className="form-label">
                        Authorized Person
                      </label>
                      <input
                        type="text"
                        id="authorized_person"
                        name="authorized_person"
                        className="form-control "
                        value={clientForm.authorized_person}
                        onChange={(e) =>
                          setClientForm({
                            ...clientForm,
                            authorized_person: e.target.value,
                          })
                        }
                        maxLength={190}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label
                        htmlFor="authorized_designation"
                        className="form-label"
                      >
                        Designation
                      </label>
                      <input
                        type="text"
                        id="authorized_designation"
                        name="authorized_designation"
                        className="form-control"
                        value={clientForm.authorized_designation}
                        onChange={(e) =>
                          setClientForm({
                            ...clientForm,
                            authorized_designation: e.target.value,
                          })
                        }
                        maxLength={120}
                      />
                    </div>
                  </div>
                </div>
                <div className="erp-field">
                  <label htmlFor="office_address" className="form-label">
                    Office Address
                  </label>
                  <textarea
                    id="office_address"
                    name="office_address"
                    className="form-control"
                    rows={2}
                    maxLength={1000}
                    value={clientForm.office_address}
                    onChange={(e) =>
                      setClientForm({
                        ...clientForm,
                        office_address: e.target.value,
                      })
                    }
                  ></textarea>
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
                <h2>Contact &amp; Tax</h2>
                <p>How to reach the client and their tax identity.</p>
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
                      value={clientForm.mobile}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, mobile: e.target.value })
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
                      value={clientForm.alternate_mobile}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          alternate_mobile: e.target.value,
                        })
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
                      value={clientForm.email}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, email: e.target.value })
                      }
                      maxLength={190}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
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
                      value={clientForm.tin}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, tin: e.target.value })
                      }
                      maxLength={40}
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
                      value={clientForm.present_address}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          present_address: e.target.value,
                        })
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
                      value={clientForm.permanent_address}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          permanent_address: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>
                </div>
              </div>
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
                  value={clientForm.notes}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, notes: e.target.value })
                  }
                ></textarea>
              </div>
              <div className="form-check">
                <input type="hidden" name="is_active" value="0" />
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  value="1"
                  checked={clientForm.is_active}
                  onChange={(e) =>
                    setClientForm({
                      ...clientForm,
                      is_active: e.target.checked,
                    })
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
              <span data-submit-label>Create Client</span>
            </button>
            <Link href="/clients" className="btn btn-erp-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    );
  }

  if (view === "agreements") {
    const filtered = agreements.filter((a) => {
      if (agrStatusFilter && a.status !== agrStatusFilter) return false;
      if (agrTypeFilter && a.agreementType !== agrTypeFilter) return false;
      if (agrSearch) {
        const q = agrSearch.toLowerCase();
        const clientName =
          clients.find((c) => c.id === a.clientId)?.name ?? "";
        const match =
          a.code.toLowerCase().includes(q) ||
          clientName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    return (
      <div className="container ">
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-file-signature"></i>
            </div>
            <div>
              <h1>Development Agreements</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">Clients</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Agreements
                  </li>
                </ol>
              </nav>
            </div>
          </div>
          <div className="erp-pagehead-actions">
            <button
              type="button"
              className="btn btn-erp-ghost"
              onClick={() => downloadCsv("agreements.csv", ["Code", "Type", "Value", "Date", "Status"], filtered.map((r) => [r.code, r.agreementType, r.contractValue, r.agreementDate, r.status]))}
            >
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/agreements/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Agreement
            </Link>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-card-head">
            <form
              method="GET"
              action="/agreements"
              className="erp-filterbar"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="erp-search erp-search-sm">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  name="search"
                  value={agrSearch}
                  onChange={(e) => setAgrSearch(e.target.value)}
                  placeholder="Agreement no or client…"
                  aria-label="Search"
                />
              </div>
              <select
                name="status"
                className="erp-select"
                value={agrStatusFilter}
                onChange={(e) => setAgrStatusFilter(e.target.value)}
                aria-label="Status"
              >
                <option value="">Any status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="terminated">Terminated</option>
              </select>
              <select
                name="agreement_type"
                className="erp-select"
                value={agrTypeFilter}
                onChange={(e) => setAgrTypeFilter(e.target.value)}
                aria-label="Type"
              >
                <option value="">Any type</option>
                <option value="development">Development Agreement</option>
                <option value="joint_venture">Joint Venture</option>
                <option value="sale">Sale Agreement</option>
                <option value="lease">Lease Agreement</option>
                <option value="other">Other</option>
              </select>
            </form>
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {filtered.length} agreements
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-file-signature"></i>
              </div>
              <h3>No agreements yet</h3>
              <p>
                A development agreement formalises a client&apos;s engagement on
                a project, with its own terms and payment schedule.
              </p>
              <Link href="/agreements/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Agreement
              </Link>
            </div>
          ) : (
            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Agreement No</th>
                      <th>Client</th>
                      <th>Project</th>
                      <th>Type</th>
                      <th className="text-end">Contract Value</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => {
                      const client = clients.find((c) => c.id === a.clientId);
                      const proj = projects.find((p) => p.id === a.projectId);
                      return (
                        <tr key={a.id}>
                          <td className="erp-cell-strong">{a.code}</td>
                          <td>{client ? client.name : "—"}</td>
                          <td>{proj ? proj.name : "—"}</td>
                          <td className="text-capitalize">
                            {a.agreementType.replace("_", " ")}
                          </td>
                          <td className="text-end">
                            {a.contractValue.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>{a.agreementDate}</td>
                          <td className="text-capitalize">{a.status}</td>
                          <td className="text-end text-nowrap">
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-danger"
                              title="Delete"
                              onClick={() =>
                                handleDeleteAgreement(a.id, a.code)
                              }
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
          )}
        </div>
      </div>
    );
  }

  // agreements_create
  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-file-signature"></i>
          </div>
          <div>
            <h1>New Agreement</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/agreements">Agreements</Link>
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
        action="/agreements"
        className="erp-form"
        data-agreement-form
        noValidate
        onSubmit={handleCreateAgreement}
      >
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-file-signature"></i>
            </div>
            <div>
              <h2>Agreement</h2>
              <p>Who it is with, and the headline figures.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="client_id" className="form-label">
                    Client <span className="erp-required">*</span>
                  </label>
                  <select
                    id="client_id"
                    name="client_id"
                    className="form-control "
                    data-select2
                    value={agreementForm.client_id}
                    onChange={(e) =>
                      setAgreementForm({
                        ...agreementForm,
                        client_id: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select client…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="project_id" className="form-label">
                    Project
                  </label>
                  <select
                    id="project_id"
                    name="project_id"
                    className="form-control "
                    data-select2
                    value={agreementForm.project_id}
                    onChange={(e) =>
                      setAgreementForm({
                        ...agreementForm,
                        project_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select project…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="agreement_type" className="form-label">
                    Type <span className="erp-required">*</span>
                  </label>
                  <select
                    id="agreement_type"
                    name="agreement_type"
                    className="form-control "
                    data-select2
                    value={agreementForm.agreement_type}
                    onChange={(e) =>
                      setAgreementForm({
                        ...agreementForm,
                        agreement_type: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="development">Development Agreement</option>
                    <option value="joint_venture">Joint Venture</option>
                    <option value="sale">Sale Agreement</option>
                    <option value="lease">Lease Agreement</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="contract_value" className="form-label">
                    Contract Value <span className="erp-required">*</span>
                  </label>
                  <input
                    type="number"
                    id="contract_value"
                    name="contract_value"
                    step="0.01"
                    min="0"
                    className="form-control "
                    value={agreementForm.contract_value}
                    onChange={(e) =>
                      setAgreementForm({
                        ...agreementForm,
                        contract_value: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="signed_by" className="form-label">
                    Signed By
                  </label>
                  <input
                    type="text"
                    id="signed_by"
                    name="signed_by"
                    className="form-control"
                    value={agreementForm.signed_by}
                    onChange={(e) =>
                      setAgreementForm({
                        ...agreementForm,
                        signed_by: e.target.value,
                      })
                    }
                    maxLength={190}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="agreement_date" className="form-label">
                    Agreement Date <span className="erp-required">*</span>
                  </label>
                  <input
                    type="date"
                    id="agreement_date"
                    name="agreement_date"
                    className="form-control "
                    value={agreementForm.agreement_date}
                    onChange={(e) =>
                      setAgreementForm({
                        ...agreementForm,
                        agreement_date: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="effective_date" className="form-label">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    id="effective_date"
                    name="effective_date"
                    className="form-control "
                    value={agreementForm.effective_date}
                    onChange={(e) =>
                      setAgreementForm({
                        ...agreementForm,
                        effective_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="expiry_date" className="form-label">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    id="expiry_date"
                    name="expiry_date"
                    className="form-control "
                    value={agreementForm.expiry_date}
                    onChange={(e) =>
                      setAgreementForm({
                        ...agreementForm,
                        expiry_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
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
                value={agreementForm.notes}
                onChange={(e) =>
                  setAgreementForm({ ...agreementForm, notes: e.target.value })
                }
              ></textarea>
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
            <span data-submit-label>Create Agreement</span>
          </button>
          <Link href="/agreements" className="btn btn-erp-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
