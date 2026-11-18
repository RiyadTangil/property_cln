"use client";

import Link from "next/link";

export function PurchaseDetailClient({
  purchase,
}: {
  purchase: {
    id: number;
    code: string;
    orderDate: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    notes: string | null;
    linesJson: string;
    supplier: { companyName: string } | null;
  };
}) {
  const lines = (() => {
    try {
      const parsed = JSON.parse(purchase.linesJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })() as Array<{ item?: string; qty?: number; unitCost?: number; discount?: number }>;

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-pen-ruler"></i>
          </div>
          <div>
            <h1>{purchase.code}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/purchases">Purchases</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {purchase.code}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <span className="erp-pill is-neutral align-self-center">
            <i className="fa-solid fa-pen-ruler me-1"></i>
            {purchase.status === "draft" ? "Draft" : purchase.status}
          </span>
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() => window.print()}
          >
            <i className="fa-solid fa-print me-2"></i>Print
          </button>
          <Link href={`/purchases/${purchase.id}/edit`} className="btn btn-erp">
            <i className="fa-solid fa-pen me-2"></i>Continue Editing
          </Link>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="erp-card p-3" id="purchasePrintArea">
            <div className="row g-0 mb-2">
              <div className="col-md-6">
                <div className="erp-cv-block">
                  <div className="erp-cv-block-head">
                    <i className="fa-solid fa-file-invoice"></i>
                    <h3>Order</h3>
                  </div>
                  <div className="erp-deflist">
                    <div className="erp-def">
                      <span className="erp-def-label">PO Number</span>
                      <span className="erp-def-value">{purchase.code}</span>
                    </div>
                    <div className="erp-def">
                      <span className="erp-def-label">PO Type</span>
                      <span className="erp-def-value">Standard</span>
                    </div>
                    <div className="erp-def">
                      <span className="erp-def-label">Supplier</span>
                      <span
                        className={`erp-def-value ${
                          purchase.supplier?.companyName ? "" : "is-empty"
                        }`}
                      >
                        {purchase.supplier?.companyName ?? "—"}
                      </span>
                    </div>
                    <div className="erp-def">
                      <span className="erp-def-label">Supplier Ref</span>
                      <span className="erp-def-value is-empty">—</span>
                    </div>
                    <div className="erp-def">
                      <span className="erp-def-label">Date</span>
                      <span className="erp-def-value">{purchase.orderDate}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="erp-cv-block">
                  <div className="erp-cv-block-head">
                    <i className="fa-solid fa-truck"></i>
                    <h3>Delivery &amp; Status</h3>
                  </div>
                  <div className="erp-deflist">
                    <div className="erp-def">
                      <span className="erp-def-label">Default Warehouse</span>
                      <span className="erp-def-value is-empty">—</span>
                    </div>
                    <div className="erp-def">
                      <span className="erp-def-label">Ship To</span>
                      <span className="erp-def-value is-empty">—</span>
                    </div>
                    <div className="erp-def">
                      <span className="erp-def-label">Bill To</span>
                      <span className="erp-def-value is-empty">—</span>
                    </div>
                    <div className="erp-def">
                      <span className="erp-def-label">Requisition</span>
                      <span className="erp-def-value">No</span>
                    </div>
                    <div className="erp-def">
                      <span className="erp-def-label">Status</span>
                      <span className="erp-def-value">
                        {purchase.status === "draft" ? "Draft" : purchase.status}
                      </span>
                    </div>
                    <div className="erp-def">
                      <span className="erp-def-label">Placed</span>
                      <span className="erp-def-value is-empty">—</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="erp-table-wrap">
              <table className="table erp-table mb-0">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="text-end">Ordered</th>
                    <th className="text-end">Received</th>
                    <th className="text-end">Remaining</th>
                    <th className="text-end">Unit Cost</th>
                    <th className="text-end">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="erp-cv-empty">
                        No items.
                      </td>
                    </tr>
                  ) : (
                    lines.map((l, i) => {
                      const qty = Number(l.qty ?? 1);
                      const cost = Number(l.unitCost ?? 0);
                      const total = Math.max(0, qty * cost - Number(l.discount ?? 0));
                      return (
                        <tr key={i}>
                          <td className="erp-cell-strong">{l.item ?? `Line #${i + 1}`}</td>
                          <td className="text-end">{qty}</td>
                          <td className="text-end">0</td>
                          <td className="text-end">{qty}</td>
                          <td className="text-end">{cost.toFixed(2)}</td>
                          <td className="text-end">{total.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="erp-card p-3">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Subtotal</span>
              <span>{purchase.totalAmount.toFixed(2)} BDT</span>
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
              <span>{purchase.totalAmount.toFixed(2)} BDT</span>
            </div>
            <p className="erp-help mb-0 mt-2">
              <i className="fa-solid fa-circle-info me-1"></i>The payable is booked on each
              goods receipt, not the order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
