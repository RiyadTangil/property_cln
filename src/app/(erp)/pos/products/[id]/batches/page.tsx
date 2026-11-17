import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PosService } from "@/server/services/pos.service";
import { ErpEmptyState, ErpPageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProductBatchesPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await PosService.getProductBatchesPageData(Number(params.id));
  if (!product) notFound();

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-layer-group"
        title={`Batches — ${product.name}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Products", href: "/pos/products" },
          { label: "Batches" },
        ]}
        actions={
          <Link href="/pos/products" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to Products
          </Link>
        }
      />

      <div className="erp-card">
        <div className="erp-card-head">
          <div>
            <span className="erp-cell-strong">{product.code}</span>
            <span className="text-muted ms-2" style={{ fontSize: "12.5px" }}>
              On hand across live lots: {product.onHand} {product.uomCode}
            </span>
          </div>
          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            0 batches
          </span>
        </div>

        <ErpEmptyState
          icon="fa-solid fa-layer-group"
          title="No batches recorded"
          description="A batch is created when this product is received on a goods receipt with a batch number, manufacture or expiry date."
        />
      </div>
    </div>
  );
}
