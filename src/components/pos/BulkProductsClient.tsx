"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErpPageHeader } from "@/components/ui";

interface BulkProductRow {
  name: string;
  type: string;
  category_id: string;
  base_uom_id: string;
  sku: string;
  barcode: string;
  cost_price: string;
  sale_price: string;
  reorder_level: string;
  tax_group_id: string;
  is_sellable: boolean;
  is_purchasable: boolean;
  is_active: boolean;
  price_inclusive: boolean;
}

const emptyRow = (): BulkProductRow => ({
  name: "",
  type: "stockable",
  category_id: "",
  base_uom_id: "",
  sku: "",
  barcode: "",
  cost_price: "",
  sale_price: "",
  reorder_level: "",
  tax_group_id: "",
  is_sellable: true,
  is_purchasable: true,
  is_active: true,
  price_inclusive: false,
});

export default function BulkProductsClient({
  categories,
  units,
}: {
  categories: { id: number; label: string }[];
  units: { id: number; code: string; name: string }[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<BulkProductRow[]>([
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateRow(idx: number, patch: Partial<BulkProductRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addRows(count: number) {
    setRows((prev) => [...prev, ...Array.from({ length: count }, emptyRow)]);
  }

  function cloneRow(idx: number) {
    setRows((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, { ...prev[idx] });
      return next;
    });
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  const filledCount = rows.filter((r) => r.name.trim().length > 0).length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const items = rows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        type: r.type || "stockable",
        category_id: r.category_id ? Number(r.category_id) : null,
        base_uom_id: r.base_uom_id ? Number(r.base_uom_id) : null,
        sku: r.sku.trim() || null,
        barcode: r.barcode.trim() || null,
        cost_price: Number(r.cost_price) || 0,
        sale_price: Number(r.sale_price) || 0,
        reorder_level: Number(r.reorder_level) || 0,
        is_sellable: r.is_sellable,
        is_purchasable: r.is_purchasable,
        is_active: r.is_active,
        price_inclusive: r.price_inclusive,
      }));

    if (items.length === 0) {
      setError("Enter at least one product name before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/pos/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create products.");
        return;
      }
      router.push("/pos/products");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-layer-group"
        title="Bulk Add Products"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Products", href: "/pos/products" },
          { label: "Bulk Add" },
        ]}
        actions={
          <Link href="/pos/products" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to Products
          </Link>
        }
      />

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          <i className="fa-solid fa-circle-exclamation me-2"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="erp-card">
          <div className="erp-card-head">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <button
                type="button"
                className="btn btn-erp-ghost btn-sm"
                onClick={() => addRows(1)}
              >
                <i className="fa-solid fa-plus me-1"></i>Add row
              </button>
              <button
                type="button"
                className="btn btn-erp-ghost btn-sm"
                onClick={() => addRows(5)}
              >
                <i className="fa-solid fa-plus me-1"></i>Add 5
              </button>
              <span className="erp-help mb-0">
                Leave spare rows blank — they&apos;re ignored. Codes are auto-generated. Stockable
                items need a base unit.
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              <span>{filledCount}</span> rows
            </span>
          </div>

          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table erp-bulk-table mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>#</th>
                    <th style={{ minWidth: 190 }}>
                      Name <span className="erp-required">*</span>
                    </th>
                    <th style={{ minWidth: 140 }}>Type</th>
                    <th style={{ minWidth: 150 }}>Category</th>
                    <th style={{ minWidth: 120 }}>Base Unit</th>
                    <th style={{ minWidth: 110 }}>SKU</th>
                    <th style={{ minWidth: 120 }}>Barcode</th>
                    <th style={{ minWidth: 92 }}>Cost</th>
                    <th style={{ minWidth: 92 }}>Sale</th>
                    <th style={{ minWidth: 92 }}>Reorder</th>
                    <th style={{ minWidth: 140 }}>Tax Group</th>
                    <th
                      style={{ minWidth: 150 }}
                      title="Sellable · Purchasable · Active · Incl. tax"
                    >
                      Flags
                    </th>
                    <th style={{ width: 70 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="bulk-row">
                      <td className="bulk-rownum text-muted">{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          maxLength={190}
                          placeholder="Product name"
                          value={row.name}
                          onChange={(e) => updateRow(idx, { name: e.target.value })}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.type}
                          onChange={(e) => updateRow(idx, { type: e.target.value })}
                        >
                          <option value="stockable">Stockable Good</option>
                          <option value="service">Service</option>
                          <option value="non_stock">Non-Stock Item</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.category_id}
                          onChange={(e) => updateRow(idx, { category_id: e.target.value })}
                        >
                          <option value="">— None —</option>
                          {categories.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.base_uom_id}
                          onChange={(e) => updateRow(idx, { base_uom_id: e.target.value })}
                        >
                          <option value="">—</option>
                          {units.map((u) => (
                            <option key={u.id} value={String(u.id)}>
                              {u.name} — {u.code}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          maxLength={60}
                          placeholder="SKU"
                          value={row.sku}
                          onChange={(e) => updateRow(idx, { sku: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          maxLength={80}
                          placeholder="Barcode"
                          value={row.barcode}
                          onChange={(e) => updateRow(idx, { barcode: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className="form-control form-control-sm text-end"
                          placeholder="0"
                          value={row.cost_price}
                          onChange={(e) => updateRow(idx, { cost_price: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className="form-control form-control-sm text-end"
                          placeholder="0"
                          value={row.sale_price}
                          onChange={(e) => updateRow(idx, { sale_price: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className="form-control form-control-sm text-end"
                          placeholder="0"
                          value={row.reorder_level}
                          onChange={(e) => updateRow(idx, { reorder_level: e.target.value })}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.tax_group_id}
                          onChange={(e) => updateRow(idx, { tax_group_id: e.target.value })}
                        >
                          <option value="">— No tax —</option>
                        </select>
                      </td>
                      <td className="bulk-flags">
                        <label className="erp-check bulk-check" title="Sellable">
                          <input
                            type="checkbox"
                            checked={row.is_sellable}
                            onChange={(e) => updateRow(idx, { is_sellable: e.target.checked })}
                          />
                          <span>S</span>
                        </label>
                        <label className="erp-check bulk-check" title="Purchasable">
                          <input
                            type="checkbox"
                            checked={row.is_purchasable}
                            onChange={(e) => updateRow(idx, { is_purchasable: e.target.checked })}
                          />
                          <span>P</span>
                        </label>
                        <label className="erp-check bulk-check" title="Active">
                          <input
                            type="checkbox"
                            checked={row.is_active}
                            onChange={(e) => updateRow(idx, { is_active: e.target.checked })}
                          />
                          <span>A</span>
                        </label>
                        <label className="erp-check bulk-check" title="Sale price includes tax">
                          <input
                            type="checkbox"
                            checked={row.price_inclusive}
                            onChange={(e) =>
                              updateRow(idx, { price_inclusive: e.target.checked })
                            }
                          />
                          <span>Inc</span>
                        </label>
                      </td>
                      <td className="text-center text-nowrap">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm p-1"
                          title="Duplicate row"
                          onClick={() => cloneRow(idx)}
                        >
                          <i className="fa-solid fa-clone"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm p-1 text-danger"
                          title="Remove row"
                          disabled={rows.length <= 1}
                          onClick={() => removeRow(idx)}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="erp-card-foot d-flex justify-content-between align-items-center">
            <button
              type="button"
              className="btn btn-erp-ghost btn-sm"
              onClick={() => addRows(1)}
            >
              <i className="fa-solid fa-plus me-1"></i>Add row
            </button>
            <button type="submit" className="btn btn-erp" disabled={saving}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {saving ? "Creating…" : "Create Products"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
