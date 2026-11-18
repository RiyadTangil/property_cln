"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface LineItem {
  productId: string;
  code?: string;
  item: string;
  qty: number;
  unitCost: number;
  discount: number;
}

export function PurchaseFormClient({
  suppliers,
  warehouses,
  products,
  initial,
}: {
  suppliers: { id: number; companyName: string }[];
  projects?: { id: number; name: string }[];
  warehouses: { id: number; name: string }[];
  products: { id: number; code: string; name: string; costPrice: number }[];
  initial?: {
    id: number;
    code: string;
    supplierId: number | null;
    projectId: number | null;
    warehouseId: number | null;
    orderDate: string;
    status: string;
    notes: string | null;
    linesJson: string;
  };
}) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const parsedLines: LineItem[] = (() => {
    try {
      const raw = JSON.parse(initial?.linesJson ?? "[]");
      if (Array.isArray(raw)) return raw;
    } catch {
      /* fallback */
    }
    return [];
  })();

  const [poNumber, setPoNumber] = useState(initial?.code ?? "PO-2026-00001");
  const [poType, setPoType] = useState("standard");
  const [supplierId, setSupplierId] = useState(
    initial?.supplierId ? String(initial.supplierId) : ""
  );
  const [warehouseId, setWarehouseId] = useState(
    initial?.warehouseId ? String(initial.warehouseId) : ""
  );
  const [orderDate, setOrderDate] = useState(
    initial?.orderDate ?? new Date().toISOString().slice(0, 10)
  );
  const [reference, setReference] = useState("");
  const [shipToLocation, setShipToLocation] = useState("");
  const [billToLocation, setBillToLocation] = useState("");
  const [isFromRequisition, setIsFromRequisition] = useState(false);
  const [refRequisitionNumber, setRefRequisitionNumber] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [taxTotal, setTaxTotal] = useState("");
  const [shippingTotal, setShippingTotal] = useState("");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lines, setLines] = useState<LineItem[]>(parsedLines);
  const [productSearch, setProductSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const subtotal = lines.reduce(
    (s, l) => s + Math.max(0, l.qty * l.unitCost - l.discount),
    0
  );
  const discAmt =
    discountType === "percent"
      ? (subtotal * Number(discountValue || 0)) / 100
      : Number(discountValue || 0);
  const totalAmount = Math.max(
    0,
    subtotal - discAmt + Number(taxTotal || 0) + Number(shippingTotal || 0)
  );

  const matchingProducts = productSearch.trim()
    ? products
        .filter((p) =>
          `${p.code} ${p.name}`.toLowerCase().includes(productSearch.trim().toLowerCase())
        )
        .slice(0, 10)
    : [];

  function addProduct(p: { id: number; code: string; name: string; costPrice: number }) {
    setLines((prev) => [
      ...prev,
      {
        productId: String(p.id),
        code: p.code,
        item: p.name,
        qty: 1,
        unitCost: p.costPrice ?? 0,
        discount: 0,
      },
    ]);
    setProductSearch("");
  }

  function updateLine(idx: number, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  async function savePurchase(nextStatus: string) {
    setBusy(true);
    try {
      const url = isEdit
        ? `/api/procurement/purchases/${initial!.id}`
        : "/api/procurement/purchases";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: poNumber,
          po_number: poNumber,
          po_type: poType,
          supplier_id: supplierId || null,
          warehouse_id: warehouseId || null,
          order_date: orderDate,
          purchase_date: orderDate,
          reference,
          ship_to_location: shipToLocation,
          bill_to_location: billToLocation,
          is_from_requisition: isFromRequisition,
          ref_requisition_number: refRequisitionNumber,
          status: nextStatus,
          notes,
          total_amount: totalAmount,
          lines,
        }),
      });
      if (res.ok) {
        router.push("/purchases");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-cart-flatbed"></i>
          </div>
          <div>
            <h1>
              Purchase Order{" "}
              <span className="text-muted" style={{ fontSize: "15px", fontWeight: 500 }}>
                {poNumber}
              </span>
            </h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/purchases">Purchases</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Draft
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <span className="erp-pill is-neutral align-self-center">
            <i className="fa-solid fa-pen-ruler me-1"></i>Draft
          </span>
          <span
            className="erp-save-state text-muted me-2"
            data-save-state
            style={{ fontSize: "12.5px" }}
          ></span>
          <Link href="/purchases" className="btn btn-erp-ghost">
            Close
          </Link>
        </div>
      </div>

      <form
        className="erp-form"
        data-purchase-builder
        data-save="/purchases/1"
        data-place-order="/purchases/1/place-order"
        data-products="/purchases/products"
        data-summary="/purchases/supplier-summary"
        data-index="/purchases"
        data-currency="BDT"
        onSubmit={(e) => {
          e.preventDefault();
          savePurchase("ordered");
        }}
      >
        <div className="erp-builder" data-fill-viewport="26">
          <div className="erp-builder-main">
            <div className="erp-card p-2 erp-builder-head">
              <div className="erp-cv-block-head erp-block-head-sm mb-2">
                <i className="fa-solid fa-file-invoice"></i>
                <h3>Order Details</h3>
              </div>
              <div className="row g-2">
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <div className="erp-field mb-0">
                    <label className="form-label">PO Number</label>
                    <input
                      type="text"
                      name="po_number"
                      className="form-control form-control-sm"
                      data-field="po_number"
                      maxLength={60}
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="PO-2026-0042"
                    />
                  </div>
                </div>
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <div className="erp-field mb-0">
                    <label className="form-label">
                      PO Type <span className="erp-required">*</span>
                    </label>
                    <select
                      name="po_type"
                      className="form-select form-select-sm"
                      data-field="po_type"
                      data-select2
                      data-minimum-results-for-search="-1"
                      value={poType}
                      onChange={(e) => setPoType(e.target.value)}
                    >
                      <option value="standard">Standard</option>
                      <option value="blanket">Blanket</option>
                      <option value="contract">Contract</option>
                      <option value="service">Service</option>
                      <option value="capital">Capital</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <div className="erp-field mb-0">
                    <label className="form-label">
                      Supplier <span className="erp-required">*</span>
                    </label>
                    <select
                      name="supplier_id"
                      className="form-select form-select-sm"
                      data-field="supplier_id"
                      data-select2
                      data-placeholder="Select supplier"
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                    >
                      <option value="">—</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <div className="erp-field mb-0">
                    <label className="form-label">
                      Receive Into (Warehouse) <span className="erp-required">*</span>
                    </label>
                    <select
                      name="warehouse_id"
                      className="form-select form-select-sm"
                      data-field="warehouse_id"
                      data-select2
                      data-placeholder="Select warehouse"
                      value={warehouseId}
                      onChange={(e) => setWarehouseId(e.target.value)}
                    >
                      <option value="">—</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <div className="erp-field mb-0">
                    <label className="form-label">
                      Purchase Date <span className="erp-required">*</span>
                    </label>
                    <input
                      type="date"
                      name="order_date"
                      className="form-control form-control-sm"
                      data-field="purchase_date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <div className="erp-field mb-0">
                    <label className="form-label">Supplier Invoice / Ref</label>
                    <input
                      type="text"
                      name="reference"
                      className="form-control form-control-sm"
                      data-field="reference"
                      maxLength={100}
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="INV-0001"
                    />
                  </div>
                </div>
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <div className="erp-field mb-0">
                    <label className="form-label">Ship To Location</label>
                    <input
                      type="text"
                      name="ship_to_location"
                      className="form-control form-control-sm"
                      data-field="ship_to_location"
                      maxLength={180}
                      value={shipToLocation}
                      onChange={(e) => setShipToLocation(e.target.value)}
                      placeholder="Site / delivery address"
                    />
                  </div>
                </div>
                <div className="col-lg-3 col-md-4 col-sm-6">
                  <div className="erp-field mb-0">
                    <label className="form-label">Bill To Location</label>
                    <input
                      type="text"
                      name="bill_to_location"
                      className="form-control form-control-sm"
                      data-field="bill_to_location"
                      maxLength={180}
                      value={billToLocation}
                      onChange={(e) => setBillToLocation(e.target.value)}
                      placeholder="Billing / head-office"
                    />
                  </div>
                </div>

                <div className="col-12">
                  <div className="erp-req-toggle">
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="isFromRequisition"
                        data-field="is_from_requisition"
                        checked={isFromRequisition}
                        onChange={(e) => setIsFromRequisition(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="isFromRequisition">
                        <i className="fa-solid fa-clipboard-list me-1"></i>Raised from a
                        requisition
                      </label>
                    </div>
                    <div
                      className="erp-field mb-0 ms-auto"
                      data-requisition-ref
                      hidden={!isFromRequisition}
                    >
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        data-field="ref_requisition_number"
                        maxLength={60}
                        value={refRequisitionNumber}
                        onChange={(e) => setRefRequisitionNumber(e.target.value)}
                        placeholder="Requisition No. e.g. REQ-2026-0187"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div
                    className="erp-req-status"
                    data-requisition-status
                    hidden
                    data-lookup-url="/purchases/1/requisition-lookup"
                    data-load-url="/purchases/1/load-requisition"
                  >
                    <span data-requisition-note></span>
                    <button
                      type="button"
                      className="btn btn-erp btn-sm"
                      data-requisition-load
                      hidden
                    ></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="erp-card p-3 erp-builder-items">
              <div className="erp-search mb-2" style={{ position: "relative" }}>
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  data-product-search
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search product by name, code or barcode to add…"
                  autoComplete="off"
                  aria-label="Add product"
                />
                <div
                  data-product-results
                  className="erp-pos-results"
                  style={{
                    position: "absolute",
                    zIndex: 20,
                    left: 0,
                    right: 0,
                    top: "100%",
                    background: "var(--erp-surface,#fff)",
                    border: "1px solid var(--erp-line)",
                    borderRadius: "10px",
                    marginTop: "4px",
                    maxHeight: "320px",
                    display: matchingProducts.length > 0 ? "block" : "none",
                    padding: "6px",
                    overflowY: "auto",
                  }}
                >
                  {matchingProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="dropdown-item d-flex justify-content-between align-items-center py-1 px-2 rounded"
                      onClick={() => addProduct(p)}
                    >
                      <span>
                        <strong>{p.name}</strong>{" "}
                        <small className="text-muted">({p.code})</small>
                      </span>
                      <span className="text-muted small">{p.costPrice} BDT</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="erp-table-wrap">
                <table className="table erp-table erp-purchase-items mb-0">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-end" style={{ width: "110px" }}>
                        Qty
                      </th>
                      <th className="text-end" style={{ width: "130px" }}>
                        Unit Cost
                      </th>
                      <th className="text-end" style={{ width: "120px" }}>
                        Discount
                      </th>
                      <th className="text-end" style={{ width: "130px" }}>
                        Line Total
                      </th>
                      <th style={{ width: "44px" }}></th>
                    </tr>
                  </thead>
                  <tbody data-items>
                    {lines.length === 0 ? (
                      <tr data-empty>
                        <td colSpan={6} className="erp-cv-empty">
                          No items yet — search above to add.
                        </td>
                      </tr>
                    ) : (
                      lines.map((line, i) => {
                        const rowTotal = Math.max(0, line.qty * line.unitCost - line.discount);
                        return (
                          <tr key={i} data-item>
                            <td>
                              <strong data-cell-name>{line.item}</strong>
                              <span className="erp-identity-meta d-block" data-cell-code>
                                {line.code ?? ""}
                              </span>
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                className="form-control form-control-sm text-end"
                                data-cell="quantity"
                                value={line.qty}
                                onChange={(e) =>
                                  updateLine(i, { qty: Number(e.target.value) })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                className="form-control form-control-sm text-end"
                                data-cell="unit_cost"
                                value={line.unitCost}
                                onChange={(e) =>
                                  updateLine(i, { unitCost: Number(e.target.value) })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control form-control-sm text-end"
                                data-cell="discount"
                                value={line.discount}
                                onChange={(e) =>
                                  updateLine(i, { discount: Number(e.target.value) })
                                }
                              />
                            </td>
                            <td className="text-end" data-cell-total>
                              {rowTotal.toFixed(2)}
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-erp-ghost btn-sm text-danger"
                                data-remove
                                onClick={() => removeLine(i)}
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="erp-builder-side">
            <div className="erp-builder-side-scroll">
              <div className="erp-card p-3">
                <div data-supplier-summary hidden>
                  <div className="erp-cv-block-head">
                    <i className="fa-solid fa-building"></i>
                    <h3>Supplier</h3>
                  </div>
                  <div data-summary-body></div>
                  <hr className="erp-divider my-3" />
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal</span>
                  <span>
                    <span data-t-subtotal>{subtotal.toFixed(2)}</span> BDT
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted">Discount</span>
                  <div className="erp-discount-input">
                    <select
                      className="form-select form-select-sm"
                      data-field="discount_type"
                      aria-label="Discount type"
                      value={discountType}
                      onChange={(e) =>
                        setDiscountType(e.target.value as "fixed" | "percent")
                      }
                    >
                      <option value="fixed">BDT</option>
                      <option value="percent">%</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control form-control-sm erp-amt"
                      data-field="discount_value"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div
                  className="d-flex justify-content-between mb-2 erp-help"
                  data-discount-applied
                  hidden={discAmt <= 0}
                >
                  <span>Discount applied</span>
                  <span>
                    -<span data-t-discount>{discAmt.toFixed(2)}</span> BDT
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Tax</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control form-control-sm erp-amt"
                    data-field="tax_total"
                    value={taxTotal}
                    onChange={(e) => setTaxTotal(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Shipping / Other</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control form-control-sm erp-amt"
                    data-field="shipping_total"
                    value={shippingTotal}
                    onChange={(e) => setShippingTotal(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div
                  className="d-flex justify-content-between py-2 my-1"
                  style={{
                    borderTop: "1px solid var(--erp-line)",
                    borderBottom: "1px solid var(--erp-line)",
                    fontSize: "18px",
                    fontWeight: 700,
                  }}
                >
                  <span>Order Total</span>
                  <span>
                    <span data-t-total>{totalAmount.toFixed(2)}</span> BDT
                  </span>
                </div>
                <p className="erp-help mb-0 mt-2">
                  <i className="fa-solid fa-circle-info me-1"></i>Payment is recorded when the
                  goods are received.
                </p>

                <div hidden data-po-payment>
                  <input type="number" data-field="paid_amount" defaultValue="" />
                  <div data-payment-account-row>
                    <select data-field="payment_account_id">
                      <option value=""></option>
                    </select>
                  </div>
                  <span data-t-due>0.00</span>
                </div>

                <hr className="erp-divider my-3" />

                <div className="erp-field mb-0">
                  <label className="form-label">Note</label>
                  <textarea
                    name="notes"
                    className="form-control"
                    data-field="note"
                    rows={2}
                    maxLength={2000}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="erp-builder-side-actions">
              <button
                type="button"
                className="btn btn-erp-ghost w-100 mb-2"
                data-draft-btn
                disabled={busy}
                onClick={() => savePurchase("draft")}
              >
                <i className="fa-solid fa-floppy-disk me-2"></i>Save Draft
              </button>
              <button
                type="submit"
                className="btn btn-erp w-100"
                style={{ padding: "11px", fontSize: "15px" }}
                data-receive-btn
                disabled={busy}
              >
                <i className="fa-solid fa-file-circle-check me-2"></i>Place Order
              </button>
              <p className="erp-help text-center mt-2 mb-0">
                Places the order with the supplier. No stock moves yet — receive the goods when
                they arrive.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
