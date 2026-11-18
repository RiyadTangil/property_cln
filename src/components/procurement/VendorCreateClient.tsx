"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function VendorCreateClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    vendor_type: "company",
    category: "",
    status: "active",
    contact_person: "",
    phone: "",
    email: "",
    website: "",
    address_line: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    payable_account_id: "",
    default_currency: "BDT",
    default_payment_method: "",
    opening_balance: "0",
    credit_limit: "0",
    credit_days: "0",
    trade_license: "",
    registration_number: "",
    tax_number: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/procurement/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save vendor");
      router.push("/vendors/vendors");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-truck-field"></i>
          </div>
          <div>
            <h1>New Vendor</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/vendors/vendors">Vendors</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="erp-card">
        <form
          method="POST"
          action="/vendors/vendors"
          className="erp-form erp-wizard"
          data-vendor-form
          noValidate
          onSubmit={handleSubmit}
        >
          <ol className="erp-wizard-steps" data-wizard-tabs>
            <li
              className={step === 1 ? "is-active" : ""}
              data-step-tab="1"
              onClick={() => setStep(1)}
              style={{ cursor: "pointer" }}
            >
              <span>1</span> Basic
            </li>
            <li
              className={step === 2 ? "is-active" : ""}
              data-step-tab="2"
              onClick={() => setStep(2)}
              style={{ cursor: "pointer" }}
            >
              <span>2</span> Address
            </li>
            <li
              className={step === 3 ? "is-active" : ""}
              data-step-tab="3"
              onClick={() => setStep(3)}
              style={{ cursor: "pointer" }}
            >
              <span>3</span> Financial
            </li>
            <li
              className={step === 4 ? "is-active" : ""}
              data-step-tab="4"
              onClick={() => setStep(4)}
              style={{ cursor: "pointer" }}
            >
              <span>4</span> Statutory
            </li>
          </ol>

          <div className="erp-wizard-panels">
            <fieldset data-step="1" hidden={step !== 1}>
              <div className="erp-card-body">
                <h3 className="erp-form-section">Identity</h3>
                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="name" className="form-label">
                        Vendor / Legal Name <span className="erp-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-control "
                        maxLength={190}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="display_name" className="form-label">
                        Display Name
                      </label>
                      <input
                        type="text"
                        id="display_name"
                        name="display_name"
                        className="form-control"
                        maxLength={190}
                        value={form.display_name}
                        onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                        placeholder="Defaults to the legal name"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="vendor_type" className="form-label">
                        Type <span className="erp-required">*</span>
                      </label>
                      <select
                        id="vendor_type"
                        name="vendor_type"
                        className="form-select"
                        data-select2
                        required
                        value={form.vendor_type}
                        onChange={(e) => setForm({ ...form, vendor_type: e.target.value })}
                      >
                        <option value="company">Company</option>
                        <option value="individual">Individual</option>
                        <option value="government">Government</option>
                        <option value="partnership">Partnership</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="category" className="form-label">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        className="form-select"
                        data-select2
                        data-placeholder="— Select —"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="contractor">Main Contractor</option>
                        <option value="subcontractor">Subcontractor</option>
                        <option value="material_supplier">Material Supplier</option>
                        <option value="equipment_supplier">Equipment / Plant Supplier</option>
                        <option value="consultant">Consultant</option>
                        <option value="service_provider">Service Provider</option>
                        <option value="transport">Transport &amp; Logistics</option>
                        <option value="utility">Utility</option>
                        <option value="legal">Legal / Statutory</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="status" className="form-label">
                        Status <span className="erp-required">*</span>
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="form-select"
                        data-select2
                        required
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="active">Active</option>
                        <option value="on_hold">On Hold</option>
                        <option value="inactive">Inactive</option>
                        <option value="blacklisted">Blacklisted</option>
                      </select>
                    </div>
                  </div>
                </div>

                <h3 className="erp-form-section">Contact</h3>
                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="contact_person" className="form-label">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        id="contact_person"
                        name="contact_person"
                        className="form-control"
                        maxLength={150}
                        value={form.contact_person}
                        onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="phone" className="form-label">
                        Phone
                      </label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        className="form-control"
                        maxLength={40}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control "
                        maxLength={190}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field mb-0">
                      <label htmlFor="website" className="form-label">
                        Website
                      </label>
                      <input
                        type="text"
                        id="website"
                        name="website"
                        className="form-control"
                        maxLength={190}
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset data-step="2" hidden={step !== 2}>
              <div className="erp-card-body">
                <h3 className="erp-form-section">Address</h3>
                <div className="row">
                  <div className="col-md-12">
                    <div className="erp-field">
                      <label htmlFor="address_line" className="form-label">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address_line"
                        name="address_line"
                        className="form-control"
                        maxLength={255}
                        value={form.address_line}
                        onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="city" className="form-label">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        className="form-control"
                        maxLength={120}
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="state" className="form-label">
                        State / Division
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        className="form-control"
                        maxLength={120}
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="postal_code" className="form-label">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        id="postal_code"
                        name="postal_code"
                        className="form-control"
                        maxLength={20}
                        value={form.postal_code}
                        onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field mb-0">
                      <label htmlFor="country" className="form-label">
                        Country
                      </label>
                      <select
                        id="country"
                        name="country"
                        className="form-select"
                        data-select2
                        data-placeholder="— Select —"
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="BD">Bangladesh</option>
                        <option value="AF">Afghanistan</option>
                        <option value="AX">Åland Islands</option>
                        <option value="AL">Albania</option>
                        <option value="DZ">Algeria</option>
                        <option value="IN">India</option>
                        <option value="SG">Singapore</option>
                        <option value="AE">United Arab Emirates</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset data-step="3" hidden={step !== 3}>
              <div className="erp-card-body">
                <h3 className="erp-form-section">Financial</h3>
                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="payable_account_id" className="form-label">
                        Accounts Payable Control
                      </label>
                      <select
                        id="payable_account_id"
                        name="payable_account_id"
                        className="form-select"
                        data-select2
                        data-placeholder="Link a liability account"
                        value={form.payable_account_id}
                        onChange={(e) => setForm({ ...form, payable_account_id: e.target.value })}
                      >
                        <option value=""></option>
                        <option value="4">1111 · Petty Cash</option>
                        <option value="5">1112 · Cash in Hand</option>
                        <option value="6">1113 · Cash at Site Office</option>
                        <option value="8">1121 · Operating Bank Account</option>
                        <option value="21">2111 · Trade Payables</option>
                      </select>
                      <span className="erp-help">
                        Bills and payments post against this account. Required before posting.
                      </span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="default_currency" className="form-label">
                        Currency
                      </label>
                      <input
                        type="text"
                        id="default_currency"
                        name="default_currency"
                        className="form-control"
                        maxLength={3}
                        value={form.default_currency}
                        onChange={(e) => setForm({ ...form, default_currency: e.target.value })}
                        style={{ textTransform: "uppercase" }}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="default_payment_method" className="form-label">
                        Payment Method
                      </label>
                      <select
                        id="default_payment_method"
                        name="default_payment_method"
                        className="form-select"
                        data-select2
                        data-placeholder="—"
                        value={form.default_payment_method}
                        onChange={(e) =>
                          setForm({ ...form, default_payment_method: e.target.value })
                        }
                      >
                        <option value=""></option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="mobile_wallet">Mobile Wallet</option>
                        <option value="lc">Letter of Credit</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="opening_balance" className="form-label">
                        Opening Balance
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="opening_balance"
                        name="opening_balance"
                        className="form-control"
                        value={form.opening_balance}
                        onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
                      />
                      <span className="erp-help">
                        What you already owed this vendor when the books started.
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="credit_limit" className="form-label">
                        Credit Limit
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="credit_limit"
                        name="credit_limit"
                        className="form-control"
                        value={form.credit_limit}
                        onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field mb-0">
                      <label htmlFor="credit_days" className="form-label">
                        Credit Days
                      </label>
                      <input
                        type="number"
                        min="0"
                        id="credit_days"
                        name="credit_days"
                        className="form-control"
                        value={form.credit_days}
                        onChange={(e) => setForm({ ...form, credit_days: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset data-step="4" hidden={step !== 4}>
              <div className="erp-card-body">
                <h3 className="erp-form-section">Statutory</h3>
                <div className="row">
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="trade_license" className="form-label">
                        Trade License
                      </label>
                      <input
                        type="text"
                        id="trade_license"
                        name="trade_license"
                        className="form-control"
                        maxLength={120}
                        value={form.trade_license}
                        onChange={(e) => setForm({ ...form, trade_license: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="registration_number" className="form-label">
                        Registration No.
                      </label>
                      <input
                        type="text"
                        id="registration_number"
                        name="registration_number"
                        className="form-control"
                        maxLength={120}
                        value={form.registration_number}
                        onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="tax_number" className="form-label">
                        Tax / VAT No.
                      </label>
                      <input
                        type="text"
                        id="tax_number"
                        name="tax_number"
                        className="form-control"
                        maxLength={120}
                        value={form.tax_number}
                        onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="erp-form-section">Notes</h3>
                <div className="erp-field mb-0">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="form-control"
                    maxLength={2000}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>
            </fieldset>
          </div>

          <div className="erp-wizard-nav erp-card-foot">
            <Link href="/vendors/vendors" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <div className="ms-auto d-flex gap-2">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-step-prev
                hidden={step === 1}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
              >
                <i className="fa-solid fa-arrow-left me-1"></i>Back
              </button>
              <button
                type="button"
                className="btn btn-erp"
                data-step-next
                hidden={step === 4}
                onClick={() => setStep((s) => Math.min(4, s + 1))}
              >
                Next<i className="fa-solid fa-arrow-right ms-1"></i>
              </button>
              <button
                type="submit"
                className="btn btn-erp"
                data-step-save
                disabled={busy}
                hidden={step !== 4}
              >
                <i className="fa-solid fa-floppy-disk me-2"></i>Create Vendor
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
