"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeliveryOrderCreateClient({
  suppliers,
  projects,
  warehouses,
  products,
}: {
  suppliers: { id: number; companyName: string }[];
  projects: { id: number; name: string }[];
  warehouses: { id: number; name: string }[];
  products: { id: number; code: string; name: string; costPrice: number }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    supplier_id: suppliers[0]?.id ? String(suppliers[0].id) : "",
    do_number: "",
    brand: "",
    lifting_point: "",
    issue_date: new Date().toISOString().slice(0, 10),
    valid_until: "",
    project_id: "",
    warehouse_id: "",
    note: "",
  });
  const [items, setItems] = useState([
    {
      product_id: products[0]?.id ? String(products[0].id) : "",
      quantity: "",
      rate: "",
    },
  ]);

  const totalValue = items.reduce(
    (s, it) => s + Number(it.quantity || 0) * Number(it.rate || 0),
    0
  );
  const activeLines = items.filter((it) => it.product_id).length;

  function addValidityDays(days: number) {
    const base = form.issue_date ? new Date(form.issue_date) : new Date();
    base.setDate(base.getDate() + days);
    setForm({ ...form, valid_until: base.toISOString().slice(0, 10) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/procurement/delivery-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((it) => ({
            product_id: it.product_id,
            quantity: Number(it.quantity || 0),
            rate: Number(it.rate || 0),
          })),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to save DO");
      }
      router.push("/procurement/delivery-orders");
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
            <i className="fa-solid fa-truck-ramp-box"></i>
          </div>
          <div>
            <h1>
              New Delivery Order{" "}
              <span className="tw:text-base tw:font-medium tw:text-muted">· নতুন ডিও</span>
            </h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/procurement/delivery-orders">Delivery Orders</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/procurement/delivery-orders" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back
          </Link>
        </div>
      </div>

      <form
        action="/procurement/delivery-orders"
        method="POST"
        noValidate
        data-do-form
        className="tw:mx-auto tw:max-w-5xl"
        onSubmit={handleSubmit}
      >
        <ol className="tw:mb-4 tw:flex tw:items-center tw:gap-3 tw:list-none tw:p-0" data-do-steps>
          <li
            className="tw:flex tw:flex-1 tw:items-center tw:gap-3 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:px-4 tw:py-3"
            data-step-tab="1"
            onClick={() => setStep(1)}
            style={{ cursor: "pointer" }}
          >
            <span
              className="tw:grid tw:h-8 tw:w-8 tw:flex-none tw:place-items-center tw:rounded-full tw:text-sm tw:font-bold"
              data-step-dot
            >
              1
            </span>
            <span>
              <span className="tw:block tw:text-sm tw:font-semibold tw:text-ink">
                Dealer &amp; DO
              </span>
              <span className="tw:block tw:text-xs tw:text-muted">ডিলার ও ডিও</span>
            </span>
          </li>
          <li
            className="tw:flex tw:flex-1 tw:items-center tw:gap-3 tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:px-4 tw:py-3"
            data-step-tab="2"
            onClick={() => setStep(2)}
            style={{ cursor: "pointer" }}
          >
            <span
              className="tw:grid tw:h-8 tw:w-8 tw:flex-none tw:place-items-center tw:rounded-full tw:text-sm tw:font-bold"
              data-step-dot
            >
              2
            </span>
            <span>
              <span className="tw:block tw:text-sm tw:font-semibold tw:text-ink">
                Products &amp; Review
              </span>
              <span className="tw:block tw:text-xs tw:text-muted">পণ্য ও যাচাই</span>
            </span>
          </li>
        </ol>

        <section
          className="tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:p-5 tw:shadow-erp"
          data-step="1"
          hidden={step !== 1}
        >
          <h2 className="tw:mb-1 tw:text-lg tw:font-semibold tw:text-ink">
            <i className="fa-solid fa-store tw:mr-2 tw:text-brand"></i>Dealer &amp; DO details
          </h2>
          <p className="tw:mb-4 tw:text-sm tw:text-muted">
            Copy these from the DO slip the dealer gave you.
          </p>

          <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
            <div>
              <label
                htmlFor="do_supplier"
                className="form-label tw:mb-1 tw:text-sm tw:font-semibold tw:text-ink"
              >
                Dealer / Supplier <span className="erp-required">*</span>
                <span className="tw:ml-1 tw:text-xs tw:font-normal tw:text-muted">ডিলার</span>
              </label>
              <select
                id="do_supplier"
                name="supplier_id"
                className="form-select"
                required
                data-select2
                data-placeholder="Choose the dealer"
                value={form.supplier_id}
                onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
              >
                <option value=""></option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
              <div className="invalid-feedback">Choose the dealer who issued this DO.</div>
            </div>

            <div>
              <label
                htmlFor="do_number"
                className="form-label tw:mb-1 tw:text-sm tw:font-semibold tw:text-ink"
              >
                Dealer&apos;s DO No.
                <span className="tw:ml-1 tw:text-xs tw:font-normal tw:text-muted">ডিও নং</span>
              </label>
              <input
                type="text"
                id="do_number"
                name="do_number"
                maxLength={60}
                className="form-control"
                value={form.do_number}
                onChange={(e) => setForm({ ...form, do_number: e.target.value })}
                placeholder="As printed on the DO slip, e.g. BSRM/DO/24-1187"
              />
              <span className="erp-help">Keeps the same DO from being entered twice.</span>
            </div>

            <div>
              <label
                htmlFor="do_brand"
                className="form-label tw:mb-1 tw:text-sm tw:font-semibold tw:text-ink"
              >
                Brand / Mill
                <span className="tw:ml-1 tw:text-xs tw:font-normal tw:text-muted">ব্র্যান্ড</span>
              </label>
              <input
                type="text"
                id="do_brand"
                name="brand"
                maxLength={100}
                className="form-control"
                list="doBrandList"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="BSRM, Shah Cement…"
              />
              <datalist id="doBrandList">
                <option value="BSRM"></option>
                <option value="KSRM"></option>
                <option value="AKS"></option>
                <option value="GPH Ispat"></option>
                <option value="Rahim Steel"></option>
                <option value="Anwar Ispat"></option>
                <option value="Shah Cement"></option>
                <option value="Premier Cement"></option>
                <option value="Seven Rings"></option>
                <option value="Crown Cement"></option>
                <option value="Bashundhara Cement"></option>
                <option value="Fresh Cement"></option>
                <option value="Holcim (LafargeHolcim)"></option>
                <option value="Akij Cement"></option>
                <option value="Meghna Cement"></option>
              </datalist>
            </div>

            <div>
              <label
                htmlFor="do_lifting_point"
                className="form-label tw:mb-1 tw:text-sm tw:font-semibold tw:text-ink"
              >
                Lifting point
                <span className="tw:ml-1 tw:text-xs tw:font-normal tw:text-muted">
                  লোডিং পয়েন্ট
                </span>
              </label>
              <input
                type="text"
                id="do_lifting_point"
                name="lifting_point"
                maxLength={150}
                className="form-control"
                list="doPointList"
                value={form.lifting_point}
                onChange={(e) => setForm({ ...form, lifting_point: e.target.value })}
                placeholder="Factory, depot or ghat"
              />
              <datalist id="doPointList">
                <option value="Factory (ex-mill)"></option>
                <option value="Dealer depot"></option>
                <option value="Ghat"></option>
                <option value="Delivered to site"></option>
              </datalist>
            </div>

            <div>
              <label
                htmlFor="do_issue_date"
                className="form-label tw:mb-1 tw:text-sm tw:font-semibold tw:text-ink"
              >
                DO date <span className="erp-required">*</span>
                <span className="tw:ml-1 tw:text-xs tw:font-normal tw:text-muted">
                  ডিও তারিখ
                </span>
              </label>
              <input
                type="date"
                id="do_issue_date"
                name="issue_date"
                className="form-control"
                required
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              />
              <div className="invalid-feedback">Enter the DO date.</div>
            </div>

            <div>
              <label
                htmlFor="do_valid_until"
                className="form-label tw:mb-1 tw:text-sm tw:font-semibold tw:text-ink"
              >
                Valid until
                <span className="tw:ml-1 tw:text-xs tw:font-normal tw:text-muted">মেয়াদ</span>
              </label>
              <input
                type="date"
                id="do_valid_until"
                name="valid_until"
                className="form-control"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              />
              <div className="invalid-feedback">Validity cannot be before the DO date.</div>
              <div className="tw:mt-2 tw:flex tw:flex-wrap tw:gap-2">
                {[15, 30, 45, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="tw:rounded-full tw:border tw:border-line tw:bg-surface-2 tw:px-3 tw:py-1 tw:text-xs tw:font-semibold tw:text-ink tw:transition tw:hover:border-brand tw:hover:text-brand"
                    data-validity-days={d}
                    onClick={() => addValidityDays(d)}
                  >
                    +{d} days
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="do_project"
                className="form-label tw:mb-1 tw:text-sm tw:font-semibold tw:text-ink"
              >
                Project
                <span className="tw:ml-1 tw:text-xs tw:font-normal tw:text-muted">প্রকল্প</span>
              </label>
              <select
                id="do_project"
                name="project_id"
                className="form-select"
                data-select2
                data-placeholder="Optional"
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              >
                <option value=""></option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="do_warehouse"
                className="form-label tw:mb-1 tw:text-sm tw:font-semibold tw:text-ink"
              >
                Usual unloading site / store
                <span className="tw:ml-1 tw:text-xs tw:font-normal tw:text-muted">
                  আনলোড স্থান
                </span>
              </label>
              <select
                id="do_warehouse"
                name="warehouse_id"
                className="form-select"
                data-select2
                data-placeholder="Optional — preselected on each truck"
                value={form.warehouse_id}
                onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
              >
                <option value=""></option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <span className="erp-help">Each truck can still go somewhere else.</span>
            </div>
          </div>

          <div className="tw:mt-5 tw:flex tw:justify-end">
            <button
              type="button"
              className="btn btn-erp"
              data-step-next
              onClick={() => setStep(2)}
            >
              Next: Products <i className="fa-solid fa-arrow-right ms-2"></i>
            </button>
          </div>
        </section>

        <section
          className="tw:rounded-erp tw:border tw:border-line tw:bg-surface tw:p-5 tw:shadow-erp"
          data-step="2"
          hidden={step !== 2}
        >
          <h2 className="tw:mb-1 tw:text-lg tw:font-semibold tw:text-ink">
            <i className="fa-solid fa-cubes tw:mr-2 tw:text-brand"></i>Products on this DO
          </h2>
          <p className="tw:mb-4 tw:text-sm tw:text-muted">
            Quantity is in each product&apos;s own unit — MT for rod, bags for cement. The rate is
            locked for every truck lifted.
          </p>

          <div className="tw:overflow-x-auto">
            <table className="tw:w-full tw:text-sm" data-do-items>
              <thead>
                <tr className="tw:border-b tw:border-line tw:text-left tw:text-xs tw:uppercase tw:tracking-wide tw:text-muted">
                  <th className="tw:py-2 tw:pr-2" style={{ minWidth: "260px" }}>
                    Product <span className="tw:normal-case">· পণ্য</span>
                  </th>
                  <th className="tw:py-2 tw:pr-2" style={{ width: "160px" }}>
                    Quantity <span className="tw:normal-case">· পরিমাণ</span>
                  </th>
                  <th className="tw:py-2 tw:pr-2" style={{ width: "170px" }}>
                    Rate (৳) <span className="tw:normal-case">· দর</span>
                  </th>
                  <th className="tw:py-2 tw:pr-2 tw:text-right" style={{ width: "160px" }}>
                    Amount
                  </th>
                  <th className="tw:py-2" style={{ width: "44px" }}></th>
                </tr>
              </thead>
              <tbody data-do-rows>
                {items.map((it, idx) => {
                  const rowAmt = Number(it.quantity || 0) * Number(it.rate || 0);
                  return (
                    <tr key={idx} className="tw:border-b tw:border-line" data-do-row>
                      <td className="tw:py-2 tw:pr-2">
                        <select
                          name={`items[${idx}][product_id]`}
                          className="form-select"
                          data-do-product
                          data-placeholder="Choose product"
                          value={it.product_id}
                          onChange={(e) => {
                            const p = products.find((x) => String(x.id) === e.target.value);
                            setItems((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? {
                                      ...r,
                                      product_id: e.target.value,
                                      rate: p?.costPrice ? String(p.costPrice) : r.rate,
                                    }
                                  : r
                              )
                            );
                          }}
                        >
                          <option value=""></option>
                          {products.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                              data-unit="NOS"
                              data-rate={p.costPrice ?? 0}
                            >
                              {p.name} ({p.code})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="tw:py-2 tw:pr-2">
                        <div className="input-group">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            name={`items[${idx}][quantity]`}
                            className="form-control"
                            value={it.quantity}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, quantity: e.target.value } : r
                                )
                              )
                            }
                            data-do-qty
                            placeholder="0"
                          />
                          <span className="input-group-text tw:text-xs" data-do-unit>
                            —
                          </span>
                        </div>
                      </td>
                      <td className="tw:py-2 tw:pr-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name={`items[${idx}][rate]`}
                          className="form-control"
                          value={it.rate}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, rate: e.target.value } : r
                              )
                            )
                          }
                          data-do-rate
                          placeholder="0.00"
                        />
                      </td>
                      <td
                        className="tw:py-2 tw:pr-2 tw:text-right tw:font-semibold tw:text-ink"
                        data-do-amount
                      >
                        ৳ {rowAmt.toLocaleString()}
                      </td>
                      <td className="tw:py-2 tw:text-right">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm text-danger"
                          title="Remove line"
                          data-do-remove
                          onClick={() =>
                            setItems((prev) =>
                              prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
                            )
                          }
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="tw:mt-3 tw:inline-flex tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:border-dashed tw:border-brand tw:bg-brand-soft tw:px-3 tw:py-2 tw:text-sm tw:font-semibold tw:text-brand"
            data-do-add
            onClick={() =>
              setItems((prev) => [...prev, { product_id: "", quantity: "", rate: "" }])
            }
          >
            <i className="fa-solid fa-plus"></i> Add another product
          </button>

          <div className="tw:mt-5 tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-5">
            <div className="tw:md:col-span-3">
              <label
                htmlFor="do_note"
                className="form-label tw:text-sm tw:font-semibold tw:text-ink"
              >
                Note
                <span className="tw:ml-1 tw:text-xs tw:font-normal tw:text-muted">মন্তব্য</span>
              </label>
              <textarea
                id="do_note"
                name="note"
                rows={3}
                maxLength={2000}
                className="form-control"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Payment by pay order no., bank, terms agreed with the dealer…"
              ></textarea>
            </div>
            <div className="tw:md:col-span-2 tw:rounded-erp tw:bg-brand-soft tw:p-4">
              <span className="tw:block tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-muted">
                DO Value · ডিও মূল্য
              </span>
              <span className="tw:block tw:text-3xl tw:font-bold tw:text-ink" data-do-total>
                ৳ {totalValue.toFixed(2)}
              </span>
              <span className="tw:block tw:text-xs tw:text-muted tw:mt-1" data-do-lines>
                {activeLines} {activeLines === 1 ? "product" : "products"}
              </span>
            </div>
          </div>

          <div className="tw:mt-5 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2">
            <button
              type="button"
              className="btn btn-erp-ghost"
              data-step-prev
              onClick={() => setStep(1)}
            >
              <i className="fa-solid fa-arrow-left me-2"></i>Back
            </button>
            <div className="tw:flex tw:flex-wrap tw:gap-2">
              <button
                type="submit"
                className="btn btn-erp-ghost"
                data-submit-button
                value="0"
                disabled={busy}
              >
                <i className="fa-regular fa-floppy-disk me-2"></i>Save as draft
              </button>
              <button
                type="submit"
                className="btn btn-erp"
                data-submit-button
                data-issue
                value="1"
                disabled={busy}
              >
                <i className="fa-solid fa-paper-plane me-2"></i>Save &amp; issue DO
              </button>
            </div>
          </div>
          <p className="tw:mt-2 tw:text-right tw:text-xs tw:text-muted">
            Issuing places a purchase order for the full DO, ready for liftings.
          </p>
        </section>

        <div className="alert alert-danger tw:mt-3" data-do-error hidden={!error}>
          {error}
        </div>
      </form>
    </div>
  );
}
