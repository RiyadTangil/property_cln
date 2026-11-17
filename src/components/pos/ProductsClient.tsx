"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpPageHeader,
  ErpPill,
} from "@/components/ui";

export interface ProductRow {
  id: number;
  code: string;
  name: string;
  type: string;
  categoryId: number | null;
  categoryName: string | null;
  baseUomId: number | null;
  uomCode: string;
  sku: string | null;
  barcode: string | null;
  costPrice: number;
  salePrice: number;
  reorderLevel: number;
  onHand: number;
  priceInclusive: boolean;
  description: string | null;
  isSellable: boolean;
  isPurchasable: boolean;
  isPinnedPos: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
}

const TYPE_META: Record<string, { label: string; icon: string }> = {
  stockable: { label: "Stockable Good", icon: "fa-solid fa-box" },
  service: { label: "Service", icon: "fa-solid fa-wrench" },
  non_stock: { label: "Non-Stock Item", icon: "fa-solid fa-file-lines" },
};

export default function ProductsClient({
  products,
  totalCount,
  noBarcodeCount,
  pinnedCount,
  categories,
  units,
  warehouses,
  filters,
}: {
  products: ProductRow[];
  totalCount: number;
  noBarcodeCount: number;
  pinnedCount: number;
  categories: { id: number; label: string }[];
  units: { id: number; code: string; name: string }[];
  warehouses: { id: number; name: string }[];
  filters: { search: string; category_id: string; type: string; status: string };
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [stockTarget, setStockTarget] = useState<ProductRow | null>(null);
  const [barcodeTarget, setBarcodeTarget] = useState<ProductRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("stockable");
  const [categoryId, setCategoryId] = useState("");
  const [baseUomId, setBaseUomId] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [salePrice, setSalePrice] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("0");
  const [priceInclusive, setPriceInclusive] = useState(false);
  const [description, setDescription] = useState("");
  const [isSellable, setIsSellable] = useState(true);
  const [isPurchasable, setIsPurchasable] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Stock modal state
  const [stockWarehouseId, setStockWarehouseId] = useState("");
  const [stockMode, setStockMode] = useState<"receive" | "issue" | "set">("receive");
  const [stockQty, setStockQty] = useState("0");
  const [stockUnitCost, setStockUnitCost] = useState("0");
  const [stockNote, setStockNote] = useState("");

  // Barcode modal state
  const [barcodeVal, setBarcodeVal] = useState("");
  const [barcodeQty, setBarcodeQty] = useState(1);
  const [barcodeSize, setBarcodeSize] = useState("38x25");
  const [barcodeShowName, setBarcodeShowName] = useState(true);
  const [barcodeShowPrice, setBarcodeShowPrice] = useState(false);
  const [barcodeGenerated, setBarcodeGenerated] = useState(false);

  function openCreate() {
    setEditing(null);
    setName("");
    setType("stockable");
    setCategoryId("");
    setBaseUomId(units[0] ? String(units[0].id) : "");
    setSku("");
    setBarcode("");
    setCostPrice("0");
    setSalePrice("0");
    setReorderLevel("0");
    setPriceInclusive(false);
    setDescription("");
    setIsSellable(true);
    setIsPurchasable(true);
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(p: ProductRow) {
    setEditing(p);
    setName(p.name);
    setType(p.type);
    setCategoryId(p.categoryId ? String(p.categoryId) : "");
    setBaseUomId(p.baseUomId ? String(p.baseUomId) : "");
    setSku(p.sku ?? "");
    setBarcode(p.barcode ?? "");
    setCostPrice(String(p.costPrice));
    setSalePrice(String(p.salePrice));
    setReorderLevel(String(p.reorderLevel));
    setPriceInclusive(p.priceInclusive);
    setDescription(p.description ?? "");
    setIsSellable(p.isSellable);
    setIsPurchasable(p.isPurchasable);
    setIsActive(p.isActive);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError("Product Name is required.");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/pos/products/${editing.id}`
        : "/api/pos/products";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          category_id: categoryId ? Number(categoryId) : null,
          base_uom_id: baseUomId ? Number(baseUomId) : null,
          sku: sku.trim() || null,
          barcode: barcode.trim() || null,
          cost_price: Number(costPrice) || 0,
          sale_price: Number(salePrice) || 0,
          reorder_level: Number(reorderLevel) || 0,
          price_inclusive: priceInclusive,
          description: description.trim() || null,
          is_sellable: isSellable,
          is_purchasable: isPurchasable,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save product.");
        return;
      }
      setModalOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function togglePinPos(p: ProductRow) {
    await fetch(`/api/pos/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pinned_pos: !p.isPinnedPos }),
    });
    router.refresh();
  }

  async function applyStockAdjust(e: FormEvent) {
    e.preventDefault();
    if (!stockTarget) return;
    const qty = Number(stockQty) || 0;
    const nextOnHand =
      stockMode === "receive"
        ? stockTarget.onHand + qty
        : stockMode === "issue"
        ? Math.max(0, stockTarget.onHand - qty)
        : qty;
    setSaving(true);
    try {
      await fetch(`/api/pos/products/${stockTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on_hand: nextOnHand }),
      });
      setStockTarget(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveBarcode(e: FormEvent) {
    e.preventDefault();
    if (!barcodeTarget) return;
    setSaving(true);
    try {
      await fetch(`/api/pos/products/${barcodeTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: barcodeVal.trim() || null }),
      });
      setBarcodeTarget(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pos/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const header = ["Code", "Name", "Category", "Type", "Sale Price", "On Hand", "UOM", "Status"];
    const rows = products.map((p) => [
      p.code,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.categoryName || "").replace(/"/g, '""')}"`,
      p.type,
      String(p.salePrice),
      String(p.onHand),
      p.uomCode,
      p.isActive ? "Active" : "Inactive",
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-box"
        title="Products"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Point of Sale" },
          { label: "Products" },
        ]}
        actions={
          <>
            <span
              className="erp-pos-pin-count is-warn"
              title="Active products that cannot be scanned yet"
            >
              <i className="fa-solid fa-barcode me-1"></i>
              <strong>{noBarcodeCount}</strong> without a barcode
            </span>
            <span
              className="erp-pos-pin-count"
              title="Products shown on the till's quick-access grid"
            >
              <i className="fa-solid fa-bolt me-1"></i>
              <strong>{pinnedCount}</strong> / 24 on POS
            </span>
            <button type="button" className="btn btn-erp-ghost" onClick={exportCsv}>
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <Link href="/pos/products/bulk" className="btn btn-erp-ghost">
              <i className="fa-solid fa-layer-group me-2"></i>Bulk Add
            </Link>
            <button type="button" className="btn btn-erp" onClick={openCreate}>
              <i className="fa-solid fa-plus me-2"></i>New Product
            </button>
          </>
        }
      />

      <div className="erp-card">
        <div className="erp-card-head">
          <form method="GET" action="/pos/products" className="erp-filterbar">
            <div className="erp-search erp-search-sm">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Name, code, SKU or barcode…"
                aria-label="Search"
              />
            </div>
            <select
              name="category_id"
              className="erp-select"
              defaultValue={filters.category_id}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Category"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              name="type"
              className="erp-select"
              defaultValue={filters.type}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Type"
            >
              <option value="">All types</option>
              <option value="stockable">Stockable Good</option>
              <option value="service">Service</option>
              <option value="non_stock">Non-Stock Item</option>
            </select>
            <select
              name="status"
              className="erp-select"
              defaultValue={filters.status}
              onChange={(e) => e.currentTarget.form?.submit()}
              aria-label="Status"
            >
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </form>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {totalCount} products
          </span>
        </div>

        <div className="erp-card-body is-flush">
          {products.length === 0 ? (
            <ErpEmptyState
              icon="fa-solid fa-box"
              title="No products match your filters"
              description="Try another search term or add a new product."
            />
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th className="text-end">Sale Price</th>
                    <th className="text-end">On Hand</th>
                    <th>Status</th>
                    <th
                      className="text-center"
                      title="Show this product on the till's quick-access grid"
                    >
                      POS
                    </th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const tm = TYPE_META[p.type] ?? TYPE_META.stockable;
                    return (
                      <tr key={p.id}>
                        <td className="erp-cell-strong">
                          {p.name}
                          <span className="erp-identity-meta d-block">{p.code}</span>
                        </td>
                        <td>{p.categoryName || "—"}</td>
                        <td>
                          <ErpPill tone="available">
                            <i className={`${tm.icon} me-1`}></i>
                            {tm.label}
                          </ErpPill>
                        </td>
                        <td className="text-end">{p.salePrice.toFixed(2)}</td>
                        <td className="text-end">
                          {p.onHand.toFixed(2)} {p.uomCode}
                        </td>
                        <td>
                          <ErpPill tone={p.isActive ? "available" : "neutral"}>
                            {p.isActive ? "Active" : "Inactive"}
                          </ErpPill>
                        </td>
                        <td className="text-center">
                          {!p.isSellable ? (
                            <span
                              className="text-muted"
                              title="Not sellable, so it cannot go on the till"
                            >
                              —
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={`btn btn-erp-ghost btn-sm${
                                p.isPinnedPos ? " text-primary" : " text-muted"
                              }`}
                              title="Pin / unpin on POS quick grid"
                              onClick={() => togglePinPos(p)}
                            >
                              <i className="fa-solid fa-bolt"></i>
                            </button>
                          )}
                        </td>
                        <td>
                          <span className="erp-created-by">
                            <span className="erp-cell-strong">{p.createdBy || "—"}</span>
                            <span className="erp-identity-meta d-block">{p.createdAt}</span>
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <button
                            type="button"
                            className={`btn btn-erp-ghost btn-sm${
                              p.barcode ? "" : " text-warning"
                            }`}
                            title={
                              p.barcode
                                ? `Barcode: ${p.barcode}`
                                : "No barcode yet — add one and print labels"
                            }
                            onClick={() => {
                              setBarcodeTarget(p);
                              setBarcodeVal(p.barcode ?? "");
                              setBarcodeQty(1);
                              setBarcodeGenerated(false);
                            }}
                          >
                            <i className="fa-solid fa-barcode"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm"
                            title="Stock"
                            onClick={() => {
                              setStockTarget(p);
                              setStockWarehouseId(
                                warehouses[0] ? String(warehouses[0].id) : ""
                              );
                              setStockMode("receive");
                              setStockQty("0");
                              setStockUnitCost(String(p.costPrice || 0));
                              setStockNote("");
                            }}
                          >
                            <i className="fa-solid fa-boxes-stacked"></i>
                          </button>
                          <Link
                            href={`/pos/products/${p.id}/batches`}
                            className="btn btn-erp-ghost btn-sm"
                            title="Batches"
                          >
                            <i className="fa-solid fa-layer-group"></i>
                          </Link>
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm"
                            title="Edit"
                            onClick={() => openEdit(p)}
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(p)}
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
          )}
        </div>
      </div>

      {modalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <form
                className="modal-content erp-form"
                style={{ border: "none", borderRadius: 14 }}
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="modal-body p-4">
                  <h5 className="mb-3" style={{ fontSize: 16, fontWeight: 600 }}>
                    {editing ? "Edit product" : "New product"}
                  </h5>
                  {formError && (
                    <div
                      className="alert alert-danger py-2 px-3 mb-3"
                      role="alert"
                      style={{ borderRadius: 9, fontSize: "12.5px" }}
                    >
                      {formError}
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-8">
                      <div className="erp-field">
                        <label className="form-label">
                          Name <span className="erp-required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={190}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label className="form-label">
                          Type <span className="erp-required">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          required
                        >
                          <option value="stockable">Stockable Good</option>
                          <option value="service">Service</option>
                          <option value="non_stock">Non-Stock Item</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Category</label>
                        <select
                          className="form-select"
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                        >
                          <option value="">— None —</option>
                          {categories.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">
                          Base Unit <span className="erp-required">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={baseUomId}
                          onChange={(e) => setBaseUomId(e.target.value)}
                        >
                          <option value="">—</option>
                          {units.map((u) => (
                            <option key={u.id} value={String(u.id)}>
                              {u.name} — {u.code}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">SKU</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={60}
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Barcode</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={80}
                          placeholder="Scan or type"
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="erp-field">
                        <label className="form-label">Cost Price</label>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className="form-control"
                          value={costPrice}
                          onChange={(e) => setCostPrice(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label className="form-label">Sale Price</label>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className="form-control"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="erp-field">
                        <label className="form-label">Reorder Level</label>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className="form-control"
                          value={reorderLevel}
                          onChange={(e) => setReorderLevel(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="erp-field">
                        <label className="form-label">Tax Group</label>
                        <select className="form-select" defaultValue="">
                          <option value="">— No tax —</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6 d-flex align-items-center">
                      <label className="erp-check mb-0 mt-2">
                        <input
                          type="checkbox"
                          checked={priceInclusive}
                          onChange={(e) => setPriceInclusive(e.target.checked)}
                        />
                        <span>Sale price includes tax</span>
                      </label>
                    </div>

                    <div className="col-md-12">
                      <div className="erp-field">
                        <label className="form-label">Description</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={2000}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="erp-field">
                        <label className="form-label">Image</label>
                        <input
                          type="file"
                          className="form-control"
                          accept=".png,.jpg,.jpeg,.webp"
                        />
                        <span className="erp-help">Optional. Max 2 MB.</span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-3 mt-1">
                    <label className="erp-check mb-0">
                      <input
                        type="checkbox"
                        checked={isSellable}
                        onChange={(e) => setIsSellable(e.target.checked)}
                      />
                      <span>Sellable</span>
                    </label>
                    <label className="erp-check mb-0">
                      <input
                        type="checkbox"
                        checked={isPurchasable}
                        onChange={(e) => setIsPurchasable(e.target.checked)}
                      />
                      <span>Purchasable</span>
                    </label>
                    <label className="erp-check mb-0">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" disabled={saving}>
                    <i className="fa-solid fa-floppy-disk me-2"></i>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {stockTarget && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <div className="modal-header border-0 px-4 pt-4 pb-0">
                  <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>
                    <i className="fa-solid fa-boxes-stacked me-2 text-muted"></i>
                    Stock — {stockTarget.name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setStockTarget(null)}
                  />
                </div>
                <div className="modal-body p-4">
                  <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                    Current On Hand: <strong>{stockTarget.onHand.toFixed(2)} {stockTarget.uomCode}</strong>
                  </p>
                  <form className="erp-form" onSubmit={applyStockAdjust}>
                    <h6 className="mb-2" style={{ fontSize: 13, fontWeight: 600 }}>
                      Adjust stock
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">Warehouse</label>
                          <select
                            className="form-select"
                            value={stockWarehouseId}
                            onChange={(e) => setStockWarehouseId(e.target.value)}
                          >
                            <option value="">Default</option>
                            {warehouses.map((w) => (
                              <option key={w.id} value={String(w.id)}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">
                            Action <span className="erp-required">*</span>
                          </label>
                          <select
                            className="form-select"
                            value={stockMode}
                            onChange={(e) =>
                              setStockMode(e.target.value as "receive" | "issue" | "set")
                            }
                          >
                            <option value="receive">Receive (add)</option>
                            <option value="issue">Issue (remove)</option>
                            <option value="set">Set counted quantity</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">
                            Quantity <span className="erp-required">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            className="form-control"
                            value={stockQty}
                            onChange={(e) => setStockQty(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="erp-field">
                          <label className="form-label">Unit Cost</label>
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            className="form-control"
                            value={stockUnitCost}
                            onChange={(e) => setStockUnitCost(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="erp-field mb-0">
                          <label className="form-label">Note</label>
                          <input
                            type="text"
                            className="form-control"
                            maxLength={255}
                            value={stockNote}
                            onChange={(e) => setStockNote(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-end mt-3 d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-erp-ghost"
                        onClick={() => setStockTarget(null)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-erp" disabled={saving}>
                        <i className="fa-solid fa-check me-2"></i>Apply
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {barcodeTarget && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <form className="erp-form" onSubmit={saveBarcode}>
                  <div className="modal-header">
                    <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>
                      <i className="fa-solid fa-barcode me-2 text-muted"></i>Barcode &amp; Labels
                      <span className="erp-identity-meta d-block">{barcodeTarget.name}</span>
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setBarcodeTarget(null)}
                    />
                  </div>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-7">
                        <div className="erp-field">
                          <label className="form-label">
                            Barcode <span className="erp-required">*</span>
                          </label>
                          <div className="erp-barcode-input">
                            <input
                              type="text"
                              className="form-control"
                              maxLength={80}
                              placeholder="Scan, type, or suggest"
                              value={barcodeVal}
                              onChange={(e) => setBarcodeVal(e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn btn-erp-ghost"
                              title="Fill in an unused code"
                              onClick={() =>
                                setBarcodeVal(String(890000000000 + barcodeTarget.id * 137))
                              }
                            >
                              <i className="fa-solid fa-wand-magic-sparkles me-1"></i>Suggest
                            </button>
                          </div>
                          <span className="erp-help">
                            Plain keyboard characters only. An all-digit code of even length prints
                            narrowest, so it fits a small sticker.
                          </span>
                        </div>
                      </div>
                      <div className="col-md-5">
                        <div className="erp-field">
                          <label className="form-label">
                            Labels <span className="erp-required">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            min={1}
                            max={200}
                            value={barcodeQty}
                            onChange={(e) =>
                              setBarcodeQty(Math.max(1, Math.min(200, Number(e.target.value) || 1)))
                            }
                          />
                          <span className="erp-help">Up to 200 in one run.</span>
                        </div>
                      </div>
                      <div className="col-md-7">
                        <div className="erp-field">
                          <label className="form-label">Sticker Size</label>
                          <select
                            className="form-select"
                            value={barcodeSize}
                            onChange={(e) => setBarcodeSize(e.target.value)}
                          >
                            <option value="38x25">38 × 25 mm</option>
                            <option value="50x25">50 × 25 mm</option>
                            <option value="40x30">40 × 30 mm</option>
                            <option value="58x40">58 × 40 mm</option>
                          </select>
                          <span className="erp-help">
                            The page is set to the sticker, so the roll feeds one per label.
                          </span>
                        </div>
                      </div>
                      <div className="col-md-5">
                        <div className="erp-field">
                          <label className="form-label">Show on the label</label>
                          <label className="erp-check">
                            <input
                              type="checkbox"
                              checked={barcodeShowName}
                              onChange={(e) => setBarcodeShowName(e.target.checked)}
                            />
                            <span>Product name</span>
                          </label>
                          <label className="erp-check">
                            <input
                              type="checkbox"
                              checked={barcodeShowPrice}
                              onChange={(e) => setBarcodeShowPrice(e.target.checked)}
                            />
                            <span>Price</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {barcodeGenerated && barcodeVal.trim() && (
                      <div className="erp-barcode-preview">
                        <div className="erp-barcode-preview-head">
                          <span className="erp-taskdetail-label">Preview</span>
                          <span className="erp-help">
                            {barcodeQty} × {barcodeSize} mm
                          </span>
                        </div>
                        <div className="erp-barcode-preview-body d-flex flex-wrap gap-2">
                          {Array.from({ length: Math.min(barcodeQty, 12) }).map((_, idx) => (
                            <div
                              key={idx}
                              className="p-2 text-center"
                              style={{
                                border: "1px dashed #cbd5e1",
                                borderRadius: 6,
                                minWidth: 120,
                                background: "#fff",
                                fontSize: 11,
                              }}
                            >
                              {barcodeShowName && (
                                <div className="fw-semibold text-truncate" style={{ maxWidth: 110 }}>
                                  {barcodeTarget.name}
                                </div>
                              )}
                              <div
                                style={{
                                  fontFamily: "monospace",
                                  letterSpacing: 1.5,
                                  fontSize: 13,
                                  margin: "4px 0",
                                }}
                              >
                                ||| {barcodeVal.trim()} |||
                              </div>
                              {barcodeShowPrice && (
                                <div className="text-muted">
                                  {barcodeTarget.salePrice.toFixed(2)} BDT
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      onClick={() => setBarcodeTarget(null)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      onClick={() => setBarcodeGenerated(true)}
                      disabled={!barcodeVal.trim()}
                    >
                      <i className="fa-solid fa-eye me-1"></i>Generate
                    </button>
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      disabled={!barcodeGenerated}
                      onClick={() => window.print()}
                    >
                      <i className="fa-solid fa-print me-2"></i>Print
                    </button>
                    <button type="submit" className="btn btn-erp" disabled={saving}>
                      <i className="fa-solid fa-floppy-disk me-2"></i>Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete product?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> will be deleted permanently.
            </>
          )
        }
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
