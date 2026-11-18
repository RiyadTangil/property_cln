"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SupplierCreateClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    supplier_type: "company",
    company_name: "",
    display_name: "",
    status: "active",
    opening_balance: "0",
    credit_limit: "0",
    credit_days: "0",
    payable_account_id: "",
    business_category: "",
    industry: "",
    trade_license: "",
    registration_number: "",
    website: "",
    default_currency: "BDT",
    default_payment_method: "",
    lead_time_days: "",
    default_purchase_tax: "",
    default_discount: "",
    default_warehouse: "",
    price_list: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/procurement/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save supplier");
      router.push("/suppliers/suppliers");
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
            <h1>New Supplier</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/suppliers/suppliers">Suppliers</Link>
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
          action="/suppliers/suppliers"
          className="erp-form erp-wizard"
          data-supplier-form
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
              <span>2</span> Financial
            </li>
            <li
              className={step === 3 ? "is-active" : ""}
              data-step-tab="3"
              onClick={() => setStep(3)}
              style={{ cursor: "pointer" }}
            >
              <span>3</span> Business
            </li>
            <li
              className={step === 4 ? "is-active" : ""}
              data-step-tab="4"
              onClick={() => setStep(4)}
              style={{ cursor: "pointer" }}
            >
              <span>4</span> Purchasing
            </li>
          </ol>

          <div className="erp-wizard-panels">
            <fieldset data-step="1" hidden={step !== 1}>
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label className="form-label">Supplier Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value="Auto-generated"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="supplier_type" className="form-label">
                        Supplier Type <span className="erp-required">*</span>
                      </label>
                      <select
                        id="supplier_type"
                        name="supplier_type"
                        className="form-select"
                        data-select2
                        required
                        value={form.supplier_type}
                        onChange={(e) => setForm({ ...form, supplier_type: e.target.value })}
                      >
                        <option value="individual">Individual</option>
                        <option value="company">Company</option>
                        <option value="government">Government</option>
                        <option value="ngo">NGO</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="company_name" className="form-label">
                        Company Name <span className="erp-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="company_name"
                        name="company_name"
                        className="form-control "
                        maxLength={190}
                        value={form.company_name}
                        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
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
                        placeholder="Defaults to company name"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field mb-0">
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
                        <option value="inactive">Inactive</option>
                        <option value="blacklisted">Blacklisted</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset data-step="2" hidden={step !== 2}>
              <div className="erp-card-body">
                <div className="row">
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
                    <div className="erp-field">
                      <label htmlFor="credit_days" className="form-label">
                        Credit Days
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3650"
                        id="credit_days"
                        name="credit_days"
                        className="form-control"
                        value={form.credit_days}
                        onChange={(e) => setForm({ ...form, credit_days: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field mb-0">
                      <label htmlFor="payable_account_id" className="form-label">
                        Payable Account (AP control)
                      </label>
                      <select
                        id="payable_account_id"
                        name="payable_account_id"
                        className="form-select"
                        data-select2
                        data-placeholder="— None —"
                        value={form.payable_account_id}
                        onChange={(e) => setForm({ ...form, payable_account_id: e.target.value })}
                      >
                        <option value="">— None —</option>
                        <option value="4">1111 · Petty Cash</option>
                        <option value="5">1112 · Cash in Hand</option>
                        <option value="6">1113 · Cash at Site Office</option>
                        <option value="8">1121 · Operating Bank Account</option>
                        <option value="21">2111 · Trade Payables</option>
                      </select>
                      <span className="erp-help">
                        Links this supplier to a Chart-of-Accounts liability line.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset data-step="3" hidden={step !== 3}>
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="business_category" className="form-label">
                        Business Category
                      </label>
                      <input
                        type="text"
                        id="business_category"
                        name="business_category"
                        className="form-control"
                        maxLength={120}
                        value={form.business_category}
                        onChange={(e) => setForm({ ...form, business_category: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="industry" className="form-label">
                        Industry
                      </label>
                      <input
                        type="text"
                        id="industry"
                        name="industry"
                        className="form-control"
                        maxLength={120}
                        value={form.industry}
                        onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
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
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="registration_number" className="form-label">
                        Registration Number
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
                  <div className="col-md-12">
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
                        placeholder="https://"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset data-step="4" hidden={step !== 4}>
              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="default_currency" className="form-label">
                        Default Currency
                      </label>
                      <input
                        type="text"
                        id="default_currency"
                        name="default_currency"
                        className="form-control"
                        maxLength={3}
                        value={form.default_currency}
                        onChange={(e) => setForm({ ...form, default_currency: e.target.value })}
                        placeholder="BDT"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="default_payment_method" className="form-label">
                        Default Payment Method
                      </label>
                      <select
                        id="default_payment_method"
                        name="default_payment_method"
                        className="form-select"
                        data-select2
                        data-placeholder="— None —"
                        value={form.default_payment_method}
                        onChange={(e) =>
                          setForm({ ...form, default_payment_method: e.target.value })
                        }
                      >
                        <option value="">— None —</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="mobile_wallet">Mobile Wallet</option>
                        <option value="lc">Letter of Credit</option>
                        <option value="credit">On Credit</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="lead_time_days" className="form-label">
                        Lead Time (days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3650"
                        id="lead_time_days"
                        name="lead_time_days"
                        className="form-control"
                        value={form.lead_time_days}
                        onChange={(e) => setForm({ ...form, lead_time_days: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="default_purchase_tax" className="form-label">
                        Default Tax %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        id="default_purchase_tax"
                        name="default_purchase_tax"
                        className="form-control"
                        value={form.default_purchase_tax}
                        onChange={(e) =>
                          setForm({ ...form, default_purchase_tax: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="default_discount" className="form-label">
                        Default Discount %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        id="default_discount"
                        name="default_discount"
                        className="form-control"
                        value={form.default_discount}
                        onChange={(e) => setForm({ ...form, default_discount: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="default_warehouse" className="form-label">
                        Default Warehouse
                      </label>
                      <input
                        type="text"
                        id="default_warehouse"
                        name="default_warehouse"
                        className="form-control"
                        maxLength={120}
                        value={form.default_warehouse}
                        onChange={(e) => setForm({ ...form, default_warehouse: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label htmlFor="price_list" className="form-label">
                        Price List
                      </label>
                      <input
                        type="text"
                        id="price_list"
                        name="price_list"
                        className="form-control"
                        maxLength={120}
                        value={form.price_list}
                        onChange={(e) => setForm({ ...form, price_list: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="erp-field mb-0">
                      <label htmlFor="notes" className="form-label">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={2}
                        className="form-control"
                        maxLength={2000}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          <div className="erp-wizard-nav erp-card-foot">
            <Link href="/suppliers/suppliers" className="btn btn-erp-ghost">
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
                <i className="fa-solid fa-floppy-disk me-2"></i>Create Supplier
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
