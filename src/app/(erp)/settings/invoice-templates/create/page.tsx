"use client";

import React, { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TEMPLATE_TYPES } from "@/lib/tier0";

interface DesignerBlock {
  type: string;
  text?: string;
  content?: string;
  align?: string;
  size?: number;
  title?: string;
}

const PALETTE: { type: string; label: string; icon: string }[] = [
  { type: "heading", label: "Heading", icon: "fa-solid fa-heading" },
  { type: "company", label: "Company Header", icon: "fa-solid fa-building-columns" },
  { type: "fields", label: "Metadata Grid", icon: "fa-solid fa-table-cells" },
  { type: "items", label: "Line Items", icon: "fa-solid fa-list" },
  { type: "totals", label: "Totals Block", icon: "fa-solid fa-calculator" },
  { type: "text", label: "Text Note", icon: "fa-solid fa-align-left" },
  { type: "divider", label: "Divider", icon: "fa-solid fa-minus" },
  { type: "signature", label: "Signatures", icon: "fa-solid fa-signature" },
  { type: "bank", label: "Bank Info", icon: "fa-solid fa-landmark" },
  { type: "qr", label: "QR Code", icon: "fa-solid fa-qrcode" },
  { type: "spacer", label: "Spacer", icon: "fa-solid fa-arrows-up-down" },
];

const DEFAULT_BLOCKS: DesignerBlock[] = [
  { type: "heading", text: "INVOICE", align: "center", size: 24 },
  { type: "company", align: "center" },
  { type: "divider" },
  { type: "fields", title: "Document Info" },
  { type: "items" },
  { type: "totals" },
  { type: "text", content: "Thank you for your business!", align: "center" },
];

function CreateInvoiceTemplateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialType = params.get("type") || "sale";

  const [name, setName] = useState("");
  const [type, setType] = useState(initialType);
  const [paper, setPaper] = useState("a4");
  const [orientation, setOrientation] = useState("portrait");
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [blocks, setBlocks] = useState<DesignerBlock[]>(DEFAULT_BLOCKS);
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function addBlock(blockType: string) {
    const newBlock: DesignerBlock =
      blockType === "heading"
        ? { type: "heading", text: "DOCUMENT TITLE", align: "center", size: 22 }
        : blockType === "text"
        ? { type: "text", content: "Terms & Conditions apply.", align: "left" }
        : { type: blockType };
    setBlocks((prev) => [...prev, newBlock]);
    setOpenIdx(blocks.length);
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return copy;
    });
    setOpenIdx(target);
  }

  function removeBlock(idx: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
    setOpenIdx(null);
  }

  function updateBlock(idx: number, patch: Partial<DesignerBlock>) {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  }

  const previewHtml = useMemo(() => {
    const rendered = blocks
      .map((b) => {
        if (b.type === "heading") {
          return `<h1 style="text-align:${b.align || "center"};font-size:${b.size || 24}px;margin:0 0 8px;">${b.text || "INVOICE"}</h1>`;
        }
        if (b.type === "company") {
          return `<div style="text-align:${b.align || "center"};margin-bottom:12px;"><strong>E-Hishabi ERP</strong><div style="font-size:11px;color:#64748b;">Dhaka, Bangladesh · info@ehishabi.com</div></div>`;
        }
        if (b.type === "divider") return `<hr style="border:0;border-top:1px solid #cbd5e1;margin:10px 0;" />`;
        if (b.type === "fields") {
          return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;margin:10px 0;"><div><b>Document No:</b> INV-2026-0001</div><div><b>Date:</b> 15 Oct 2026</div><div><b>Party:</b> Sample Client Ltd</div><div><b>Prepared By:</b> System Admin</div></div>`;
        }
        if (b.type === "items") {
          return `<table style="width:100%;border-collapse:collapse;font-size:12px;margin:10px 0;"><thead><tr style="background:#f1f5f9;"><th style="text-align:left;padding:6px;border:1px solid #e2e8f0;">Item</th><th style="text-align:right;padding:6px;border:1px solid #e2e8f0;">Qty</th><th style="text-align:right;padding:6px;border:1px solid #e2e8f0;">Rate</th><th style="text-align:right;padding:6px;border:1px solid #e2e8f0;">Total</th></tr></thead><tbody><tr><td style="padding:6px;border:1px solid #e2e8f0;">Apartment Unit A-101 Booking</td><td style="text-align:right;padding:6px;border:1px solid #e2e8f0;">1</td><td style="text-align:right;padding:6px;border:1px solid #e2e8f0;">500,000</td><td style="text-align:right;padding:6px;border:1px solid #e2e8f0;">500,000</td></tr></tbody></table>`;
        }
        if (b.type === "totals") {
          return `<div style="text-align:right;font-size:12px;margin:10px 0;"><div>Subtotal: <b>500,000 BDT</b></div><div><b>Grand Total: 500,000 BDT</b></div></div>`;
        }
        if (b.type === "text") {
          return `<p style="text-align:${b.align || "left"};font-size:12px;color:#475569;">${b.content || ""}</p>`;
        }
        if (b.type === "signature") {
          return `<div style="display:flex;justify-content:space-between;margin-top:28px;font-size:11px;"><span>Prepared By</span><span>Authorized Signature</span></div>`;
        }
        if (b.type === "bank") {
          return `<div style="font-size:11px;border:1px solid #e2e8f0;padding:8px;border-radius:4px;margin-top:8px;"><b>Bank:</b> Prime Bank PLC · A/C: 0012-3456-7890</div>`;
        }
        if (b.type === "qr") return `<div style="text-align:center;font-size:11px;color:#64748b;margin:8px 0;">[QR Verification]</div>`;
        return `<div style="height:16px;"></div>`;
      })
      .join("");
    return `<!doctype html><html><body style="font-family:Arial,sans-serif;padding:20px;color:#0f172a;">${rendered}</body></html>`;
  }, [blocks]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Template Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/invoice-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          paper,
          orientation,
          is_default: isDefault,
          is_active: isActive,
          blocks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save template.");
        setSubmitting(false);
        return;
      }
      router.push("/settings/invoice-templates");
      router.refresh();
    } catch {
      setError("Network error while saving template.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-file-invoice"></i>
          </div>
          <div>
            <h1>New Invoice Template</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item">
                  <Link href="/settings/invoice-templates">Invoice Templates</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Designer
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/settings/invoice-templates" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <section className="erp-card mb-3">
          <div className="erp-card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label htmlFor="tpl_name" className="form-label">
                  Template Name <span className="erp-required">*</span>
                </label>
                <input
                  type="text"
                  id="tpl_name"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Standard A4 Sales Receipt"
                  required
                />
              </div>

              <div className="col-md-3">
                <label htmlFor="tpl_type" className="form-label">
                  Document Type
                </label>
                <select
                  id="tpl_type"
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {TEMPLATE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label htmlFor="tpl_paper" className="form-label">
                  Paper
                </label>
                <select
                  id="tpl_paper"
                  className="form-select"
                  value={paper}
                  onChange={(e) => setPaper(e.target.value)}
                >
                  <option value="a4">A4</option>
                  <option value="a5">A5</option>
                  <option value="letter">Letter</option>
                  <option value="thermal_80">Thermal 80mm</option>
                </select>
              </div>

              <div className="col-md-3">
                <label htmlFor="tpl_orient" className="form-label">
                  Orientation
                </label>
                <select
                  id="tpl_orient"
                  className="form-select"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div className="col-md-6 d-flex gap-4">
                <label className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                  />
                  <span className="form-check-label">Default for this type</span>
                </label>
                <label className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span className="form-check-label">Active</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <div className="row g-3">
          <div className="col-lg-6">
            <section className="erp-card h-100">
              <div className="erp-section-head">
                <div className="erp-section-icon">
                  <i className="fa-solid fa-puzzle-piece"></i>
                </div>
                <div>
                  <h2>Layout Blocks</h2>
                  <p>Click a palette chip to append a block, then reorder or edit.</p>
                </div>
              </div>
              <div className="erp-card-body">
                <div className="erp-palette">
                  {PALETTE.map((p) => (
                    <button
                      key={p.type}
                      type="button"
                      className="erp-palette-item"
                      onClick={() => addBlock(p.type)}
                    >
                      <i className={p.icon}></i>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>

                <div className="erp-canvas">
                  {blocks.length === 0 ? (
                    <div className="erp-canvas-empty">
                      No blocks yet. Click any component above to start designing.
                    </div>
                  ) : (
                    blocks.map((block, idx) => {
                      const isOpen = openIdx === idx;
                      return (
                        <div
                          key={`${block.type}-${idx}`}
                          className={`erp-block-card${isOpen ? " is-open" : ""}`}
                        >
                          <div
                            className="erp-block-head"
                            onClick={() => setOpenIdx(isOpen ? null : idx)}
                          >
                            <i className="fa-solid fa-grip-vertical erp-block-grip"></i>
                            <span className="erp-block-title text-capitalize">
                              {block.type}
                            </span>
                            <span className="erp-block-summary">
                              {block.text || block.content || block.title || ""}
                            </span>
                            <div
                              className="erp-block-tools"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => moveBlock(idx, -1)}
                                title="Move up"
                              >
                                <i className="fa-solid fa-arrow-up"></i>
                              </button>
                              <button
                                type="button"
                                onClick={() => moveBlock(idx, 1)}
                                title="Move down"
                              >
                                <i className="fa-solid fa-arrow-down"></i>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeBlock(idx)}
                                title="Remove"
                              >
                                <i className="fa-regular fa-trash-can text-danger"></i>
                              </button>
                            </div>
                          </div>

                          {isOpen && (
                            <div className="erp-block-editor">
                              {block.type === "heading" && (
                                <div className="erp-row-edit">
                                  <span className="erp-row-edit-label">Heading</span>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={block.text ?? ""}
                                    onChange={(e) =>
                                      updateBlock(idx, { text: e.target.value })
                                    }
                                  />
                                </div>
                              )}
                              {block.type === "text" && (
                                <div className="erp-row-edit">
                                  <span className="erp-row-edit-label">Content</span>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={block.content ?? ""}
                                    onChange={(e) =>
                                      updateBlock(idx, { content: e.target.value })
                                    }
                                  />
                                </div>
                              )}
                              <div className="erp-row-edit">
                                <span className="erp-row-edit-label">Align</span>
                                <select
                                  className="form-select form-select-sm"
                                  value={block.align ?? "left"}
                                  onChange={(e) =>
                                    updateBlock(idx, { align: e.target.value })
                                  }
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="col-lg-6">
            <section className="erp-card h-100">
              <div className="erp-section-head">
                <div className="erp-section-icon">
                  <i className="fa-regular fa-eye"></i>
                </div>
                <div>
                  <h2>Live Preview</h2>
                  <p>Approximate print layout ({paper.toUpperCase()} {orientation}).</p>
                </div>
              </div>
              <div className="erp-card-body">
                <iframe
                  srcDoc={previewHtml}
                  className="erp-preview-frame"
                  title="Preview"
                />
                <button
                  type="submit"
                  className="btn btn-erp w-100 mt-3"
                  style={{ padding: 11 }}
                  disabled={submitting}
                >
                  <i className="fa-solid fa-floppy-disk me-2"></i>
                  {submitting ? "Saving…" : "Save Template"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CreateInvoiceTemplatePage() {
  return (
    <Suspense fallback={<div className="container py-4">Loading designer…</div>}>
      <CreateInvoiceTemplateInner />
    </Suspense>
  );
}
