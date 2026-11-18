"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal } from "@/components/ui";
import { downloadCsv } from "@/lib/csv-client";
import { ContractorsSubmenu } from "./ContractorsSubmenu";
import { COA_ACCOUNT_OPTIONS } from "./contractor-options";

interface ContractorRow {
  id: number;
  code: string;
  name: string;
  displayName?: string | null;
  contractorType: string;
  trade: string | null;
  status: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  addressLine?: string | null;
  city: string | null;
  tradeLicense?: string | null;
  defaultRetentionPercent?: number;
  defaultSecurityDepositPercent?: number;
  defaultTdsPercent?: number;
  defaultVatPercent?: number;
  taxNumber?: string | null;
  vatNumber?: string | null;
  payableAccountId: number | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountNo?: string | null;
  notes?: string | null;
}

const ENGAGEMENT_LABELS: Record<string, string> = {
  labour: "Labour Only",
  labour_only: "Labour Only",
  material_and_labour: "Material + Labour",
  labour_and_material: "Material + Labour",
  specialist: "Specialist",
  turnkey: "Turnkey",
};

export function ContractorsClient({ contractors: initial }: { contractors: ContractorRow[] }) {
  const router = useRouter();
  const [contractors, setContractors] = useState(initial);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContractorRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [form, setForm] = useState({
    name: "",
    display_name: "",
    contractor_type: "labour",
    trade: "",
    status: "active",
    contact_person: "",
    phone: "",
    email: "",
    address_line: "",
    city: "",
    trade_license: "",
    default_retention_percent: "0",
    default_security_deposit_percent: "0",
    default_tds_percent: "0",
    default_vat_percent: "0",
    tax_number: "",
    vat_number: "",
    payable_account_id: "",
    bank_name: "",
    bank_branch: "",
    bank_account_no: "",
    notes: "",
  });

  const distinctTrades = Array.from(
    new Set(contractors.map((c) => c.trade).filter((t): t is string => Boolean(t && t.trim())))
  );

  const filtered = contractors.filter((c) => {
    if (typeFilter) {
      const normalized =
        c.contractorType === "labour_only"
          ? "labour"
          : c.contractorType === "labour_and_material"
            ? "material_and_labour"
            : c.contractorType;
      if (normalized !== typeFilter && c.contractorType !== typeFilter) return false;
    }
    if (tradeFilter && c.trade !== tradeFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCode = c.code.toLowerCase().includes(q);
      const matchPhone = (c.phone ?? "").toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchPhone) return false;
    }
    return true;
  });

  const activeCount = contractors.filter((c) => c.status === "active").length;
  const inactiveCount = contractors.filter((c) => c.status === "inactive").length;
  const blacklistedCount = contractors.filter((c) => c.status === "blacklisted").length;
  const noPayableCount = contractors.filter((c) => !c.payableAccountId).length;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorText("");
    try {
      const res = await fetch("/api/contractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const d = await res.json();
        setContractors((prev) => [d.contractor, ...prev]);
        setModalOpen(false);
        setForm({
          name: "",
          display_name: "",
          contractor_type: "labour",
          trade: "",
          status: "active",
          contact_person: "",
          phone: "",
          email: "",
          address_line: "",
          city: "",
          trade_license: "",
          default_retention_percent: "0",
          default_security_deposit_percent: "0",
          default_tds_percent: "0",
          default_vat_percent: "0",
          tax_number: "",
          vat_number: "",
          payable_account_id: "",
          bank_name: "",
          bank_branch: "",
          bank_account_no: "",
          notes: "",
        });
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorText(err.error || "Failed to save contractor.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/contractors/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setContractors((prev) => prev.filter((x) => x.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container ">
      <ContractorsSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-helmet-safety" />
          </div>
          <div>
            <h1>Contractors</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Contractors
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
                "contractors.csv",
                ["Code", "Name", "Type", "Trade", "Phone", "Status"],
                filtered.map((c) => [c.code, c.name, c.contractorType, c.trade ?? "", c.phone ?? "", c.status])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2" />
            Export
          </button>
          <button
            type="button"
            className="btn btn-erp"
            data-contractor-add
            onClick={() => {
              setErrorText("");
              setModalOpen(true);
            }}
          >
            <i className="fa-solid fa-plus me-2" />
            Add Contractor
          </button>
        </div>
      </div>

      <div className="erp-sale-strip is-separated">
        <div className="erp-sale-stat is-tone-green">
          <span className="erp-sale-stat-label">Contractors</span>
          <strong>{contractors.length}</strong>
          <span className="erp-sale-stat-foot">{activeCount} active</span>
        </div>
        <div className="erp-sale-stat is-tone-slate">
          <span className="erp-sale-stat-label">Inactive</span>
          <strong>{inactiveCount}</strong>
          <span className="erp-sale-stat-foot">Not being given new work</span>
        </div>
        <div className="erp-sale-stat is-tone-slate">
          <span className="erp-sale-stat-label">Blacklisted</span>
          <strong>{blacklistedCount}</strong>
          <span className="erp-sale-stat-foot">Barred from new work</span>
        </div>
        <div className="erp-sale-stat is-tone-slate">
          <span className="erp-sale-stat-label">No payable account</span>
          <strong>{noPayableCount}</strong>
          <span className="erp-sale-stat-foot">Their bills cannot be posted yet</span>
        </div>
      </div>

      <div className="erp-card mt-3" data-contractor-root data-store="/contractors">
        <div className="erp-card-head">
          <div>
            <h2>Register</h2>
            <p>
              The firms that execute work on your sites. Each carries the contract terms
              its work orders start from, and the account its bills post to.
            </p>
          </div>
        </div>

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
                placeholder="Name, code or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="erp-field mb-0">
              <select
                name="contractor_type"
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Any engagement</option>
                <option value="labour">Labour Only</option>
                <option value="material_and_labour">Material + Labour</option>
                <option value="specialist">Specialist</option>
                <option value="turnkey">Turnkey</option>
              </select>
            </div>
            <div className="erp-field mb-0">
              <select
                name="trade"
                className="form-select"
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
              >
                <option value="">Any trade</option>
                {distinctTrades.map((t) => (
                  <option key={t} value={t}>
                    {t}
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>
            <button type="submit" className="btn btn-erp-ghost">
              <i className="fa-solid fa-filter me-1" />
              Filter
            </button>
          </form>

          <div data-contractor-list>
            {filtered.length === 0 ? (
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-helmet-safety" />
                </div>
                <h3>No contractors yet</h3>
                <p>
                  Add the firms that execute work on your sites. Each one can then be given
                  work orders, billed on a running account, and paid.
                </p>
              </div>
            ) : (
              <div className="erp-table-wrap">
                <table className="table erp-table mb-0">
                  <thead>
                    <tr>
                      <th>Contractor</th>
                      <th>Engagement</th>
                      <th>Trade</th>
                      <th>Contact</th>
                      <th>City</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="erp-cell-strong">{c.name}</div>
                          <div className="erp-identity-meta">{c.code}</div>
                        </td>
                        <td>{ENGAGEMENT_LABELS[c.contractorType] ?? c.contractorType.replace(/_/g, " ")}</td>
                        <td>{c.trade || "—"}</td>
                        <td className="small">
                          {c.contactPerson || "—"} {c.phone ? `· ${c.phone}` : ""}
                        </td>
                        <td>{c.city || "—"}</td>
                        <td>
                          <span
                            className={`erp-pill ${
                              c.status === "active" ? "is-available" : "is-overdue"
                            } text-capitalize`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            onClick={() => setDeleteTarget(c)}
                          >
                            <i className="fa-solid fa-trash-can" />
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
      </div>

      <datalist id="contractorTrades">
        {distinctTrades.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <div
        className={`modal fade ${modalOpen ? "show d-block" : ""}`}
        id="contractorModal"
        tabIndex={-1}
        aria-hidden={!modalOpen}
        style={modalOpen ? { background: "rgba(0,0,0,0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <form
            className="modal-content erp-form"
            data-contractor-form
            data-submit-lock="off"
            style={{ border: "none", borderRadius: "14px" }}
            onSubmit={handleCreate}
          >
            <div className="modal-body p-4">
              <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: 600 }} data-contractor-title>
                New contractor
              </h5>

              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-contractor-error
                hidden={!errorText}
              >
                <span data-contractor-error-text>{errorText}</span>
              </div>

              <div className="row">
                <div className="col-md-7">
                  <div className="erp-field">
                    <label htmlFor="con_name" className="form-label">
                      Legal name <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="con_name"
                      name="name"
                      className="form-control"
                      maxLength={190}
                      required
                      data-field="name"
                      placeholder="Rahman Construction Ltd"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="erp-field">
                    <label htmlFor="con_display" className="form-label">
                      Short name
                    </label>
                    <input
                      type="text"
                      id="con_display"
                      name="display_name"
                      className="form-control"
                      maxLength={190}
                      data-field="display_name"
                      placeholder="Rahman Const."
                      value={form.display_name}
                      onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    />
                    <span className="erp-help">Falls back to the legal name.</span>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="con_type" className="form-label">
                      Default engagement type <span className="erp-required">*</span>
                    </label>
                    <select
                      id="con_type"
                      name="contractor_type"
                      className="form-select"
                      data-select2
                      data-field="contractor_type"
                      value={form.contractor_type}
                      onChange={(e) => setForm({ ...form, contractor_type: e.target.value })}
                    >
                      <option value="labour">Labour Only</option>
                      <option value="material_and_labour">Material + Labour</option>
                      <option value="specialist">Specialist</option>
                      <option value="turnkey">Turnkey</option>
                    </select>
                    <span className="erp-help">
                      Only a default — each project engagement sets its own type. Labour-only has issued material recovered on its bills.
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="con_trade" className="form-label">
                      Trade
                    </label>
                    <input
                      type="text"
                      id="con_trade"
                      name="trade"
                      className="form-control"
                      maxLength={80}
                      data-field="trade"
                      placeholder="Civil"
                      list="contractorTrades"
                      value={form.trade}
                      onChange={(e) => setForm({ ...form, trade: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="con_status" className="form-label">
                      Status
                    </label>
                    <select
                      id="con_status"
                      name="status"
                      className="form-select"
                      data-select2
                      data-field="status"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blacklisted">Blacklisted</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="my-3" />
              <h6 className="erp-formsec">Contact</h6>

              <div className="row">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">Contact person</label>
                    <input
                      type="text"
                      name="contact_person"
                      className="form-control"
                      maxLength={150}
                      data-field="contact_person"
                      value={form.contact_person}
                      onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      maxLength={40}
                      data-field="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      maxLength={190}
                      data-field="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Address</label>
                    <input
                      type="text"
                      name="address_line"
                      className="form-control"
                      maxLength={255}
                      data-field="address_line"
                      value={form.address_line}
                      onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      maxLength={120}
                      data-field="city"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">Trade licence</label>
                    <input
                      type="text"
                      name="trade_license"
                      className="form-control"
                      maxLength={120}
                      data-field="trade_license"
                      value={form.trade_license}
                      onChange={(e) => setForm({ ...form, trade_license: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <hr className="my-3" />
              <h6 className="erp-formsec">
                Contract defaults{" "}
                <small className="text-muted">
                  Copied onto new work orders — changing them never re-prices an existing one.
                </small>
              </h6>

              <div className="row">
                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">Retention %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      name="default_retention_percent"
                      className="form-control"
                      data-field="default_retention_percent"
                      value={form.default_retention_percent}
                      onChange={(e) =>
                        setForm({ ...form, default_retention_percent: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">Security deposit %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      name="default_security_deposit_percent"
                      className="form-control"
                      data-field="default_security_deposit_percent"
                      value={form.default_security_deposit_percent}
                      onChange={(e) =>
                        setForm({ ...form, default_security_deposit_percent: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">TDS %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      name="default_tds_percent"
                      className="form-control"
                      data-field="default_tds_percent"
                      value={form.default_tds_percent}
                      onChange={(e) => setForm({ ...form, default_tds_percent: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">VAT %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      name="default_vat_percent"
                      className="form-control"
                      data-field="default_vat_percent"
                      value={form.default_vat_percent}
                      onChange={(e) => setForm({ ...form, default_vat_percent: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">Tax / TIN no.</label>
                    <input
                      type="text"
                      name="tax_number"
                      className="form-control"
                      maxLength={120}
                      data-field="tax_number"
                      value={form.tax_number}
                      onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">VAT / BIN no.</label>
                    <input
                      type="text"
                      name="vat_number"
                      className="form-control"
                      maxLength={120}
                      data-field="vat_number"
                      value={form.vat_number}
                      onChange={(e) => setForm({ ...form, vat_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="con_payable" className="form-label">
                      Payable account
                    </label>
                    <select
                      id="con_payable"
                      name="payable_account_id"
                      className="form-select"
                      data-select2
                      data-placeholder="Not mapped yet"
                      data-field="payable_account_id"
                      value={form.payable_account_id}
                      onChange={(e) => setForm({ ...form, payable_account_id: e.target.value })}
                    >
                      <option value="">— Not mapped —</option>
                      {COA_ACCOUNT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} data-meta={opt.meta}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="erp-help">Bills cannot be posted without it.</span>
                  </div>
                </div>
              </div>

              <hr className="my-3" />
              <h6 className="erp-formsec">Bank</h6>

              <div className="row">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">Bank</label>
                    <input
                      type="text"
                      name="bank_name"
                      className="form-control"
                      maxLength={150}
                      data-field="bank_name"
                      value={form.bank_name}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">Branch</label>
                    <input
                      type="text"
                      name="bank_branch"
                      className="form-control"
                      maxLength={150}
                      data-field="bank_branch"
                      value={form.bank_branch}
                      onChange={(e) => setForm({ ...form, bank_branch: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">Account no.</label>
                    <input
                      type="text"
                      name="bank_account_no"
                      className="form-control"
                      maxLength={60}
                      data-field="bank_account_no"
                      value={form.bank_account_no}
                      onChange={(e) => setForm({ ...form, bank_account_no: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="erp-field mb-0">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  className="form-control"
                  rows={2}
                  maxLength={2000}
                  data-field="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" data-contractor-submit disabled={busy}>
                <i className="fa-solid fa-floppy-disk me-1" />
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete contractor?"
        description={
          <>
            <strong>{deleteTarget?.name ?? ""}</strong> will be removed.
          </>
        }
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
