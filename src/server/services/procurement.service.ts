import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";
import type { CreateSupplierDto, CreateVendorDto } from "@/server/dto";

const COMPANY_ID = 1;

export const ProcurementService = {
  async getSuppliersPageData() {
    const suppliers = await prisma.supplier.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } });
    return { suppliers };
  },

  async createSupplier(user: SessionUser, dto: CreateSupplierDto) {
    if (!dto.companyName.trim()) throw new ServiceError(400, "Company name is required");
    const count = await prisma.supplier.count();
    const row = await prisma.supplier.create({
      data: {
        companyId: COMPANY_ID,
        code: `SUP-${String(count + 1).padStart(4, "0")}`,
        supplierType: dto.supplierType || "material",
        companyName: dto.companyName.trim(),
        displayName: dto.displayName ?? null,
        status: dto.status || "active",
        openingBalance: dto.openingBalance ?? 0,
        creditLimit: dto.creditLimit ?? 0,
        creditDays: dto.creditDays ?? 30,
        businessCategory: dto.businessCategory ?? null,
        industry: dto.industry ?? null,
        tradeLicense: dto.tradeLicense ?? null,
        website: dto.website ?? null,
        defaultCurrency: dto.defaultCurrency || "BDT",
        defaultPaymentMethod: dto.defaultPaymentMethod || "bank",
        leadTimeDays: dto.leadTimeDays ?? 7,
        notes: dto.notes ?? null,
      },
    });
    await recordAudit(user.name, "created", row.companyName, "Supplier", [], user.id);
    return row;
  },

  async deleteSupplier(user: SessionUser, id: number) {
    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Supplier not found");
    await prisma.supplier.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.companyName, "Supplier", [], user.id);
    return { ok: true };
  },

  async getVendorsPageData() {
    const vendors = await prisma.vendor.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } });
    return { vendors };
  },

  async createVendor(user: SessionUser, dto: CreateVendorDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Vendor name is required");
    const count = await prisma.vendor.count();
    const row = await prisma.vendor.create({
      data: {
        companyId: COMPANY_ID,
        code: `VND-${String(count + 1).padStart(4, "0")}`,
        name: dto.name.trim(),
        displayName: dto.displayName ?? null,
        vendorType: dto.vendorType || "service",
        category: dto.category ?? null,
        status: dto.status || "active",
        contactPerson: dto.contactPerson ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        city: dto.city ?? null,
        country: dto.country || "BD",
        defaultCurrency: dto.defaultCurrency || "BDT",
        openingBalance: dto.openingBalance ?? 0,
        creditLimit: dto.creditLimit ?? 0,
        creditDays: dto.creditDays ?? 30,
        tradeLicense: dto.tradeLicense ?? null,
        taxNumber: dto.taxNumber ?? null,
        notes: dto.notes ?? null,
      },
    });
    await recordAudit(user.name, "created", row.name, "Vendor", [], user.id);
    return row;
  },

  async deleteVendor(user: SessionUser, id: number) {
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Vendor not found");
    await prisma.vendor.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "Vendor", [], user.id);
    return { ok: true };
  },

  async getCommonRefs() {
    const [projects, warehouses, suppliers, products, boqs] = await Promise.all([
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
      prisma.warehouse.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
      prisma.supplier.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, companyName: true } }),
      prisma.product.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true, costPrice: true } }),
      prisma.boq.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, title: true } }),
    ]);
    return { projects, warehouses, suppliers, products, boqs };
  },

  async getPurchaseDetailData(id: number) {
    const [purchase, refs] = await Promise.all([
      prisma.purchaseOrder.findUnique({
        where: { id },
        include: { supplier: true },
      }),
      this.getCommonRefs(),
    ]);
    if (!purchase) throw new ServiceError(404, "Purchase order not found");
    return { purchase, ...refs };
  },

  async updatePurchaseOrder(user: SessionUser, id: number, b: Record<string, unknown>) {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Purchase order not found");
    const row = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: b.supplier_id !== undefined ? (b.supplier_id ? Number(b.supplier_id) : null) : existing.supplierId,
        projectId: b.project_id !== undefined ? (b.project_id ? Number(b.project_id) : null) : existing.projectId,
        warehouseId: b.warehouse_id !== undefined ? (b.warehouse_id ? Number(b.warehouse_id) : null) : existing.warehouseId,
        orderDate: b.order_date ? String(b.order_date) : existing.orderDate,
        totalAmount: b.total_amount !== undefined ? Number(b.total_amount) || 0 : existing.totalAmount,
        status: b.status ? String(b.status) : existing.status,
        notes: b.notes !== undefined ? (b.notes ? String(b.notes) : null) : existing.notes,
        linesJson: b.lines !== undefined ? JSON.stringify(b.lines) : existing.linesJson,
      },
    });
    await recordAudit(user.name, "updated", row.code, "PurchaseOrder", [], user.id);
    return row;
  },

  async deletePurchaseOrder(user: SessionUser, id: number) {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Purchase order not found");
    await prisma.purchaseOrder.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.code, "PurchaseOrder", [], user.id);
    return { ok: true };
  },

  async getPurchasesPageData() {
    const [purchases, refs] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { companyId: COMPANY_ID },
        include: { supplier: { select: { id: true, companyName: true } } },
        orderBy: { id: "desc" },
      }),
      this.getCommonRefs(),
    ]);
    return { purchases, ...refs };
  },

  async getRequisitionsPageData(reqType?: "material" | "purchase") {
    const [requisitions, refs] = await Promise.all([
      prisma.purchaseRequisition.findMany({
        where: { companyId: COMPANY_ID, ...(reqType ? { reqType } : {}) },
        orderBy: { id: "desc" },
      }),
      this.getCommonRefs(),
    ]);
    return { requisitions, ...refs };
  },

  async getRequirementsPageData() {
    const [requirements, refs] = await Promise.all([
      prisma.materialRequirement.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { requirements, ...refs };
  },

  async getRfqsPageData() {
    const [rfqs, refs] = await Promise.all([
      prisma.rfq.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { rfqs, ...refs };
  },

  async getDeliveryOrdersPageData() {
    const [orders, refs] = await Promise.all([
      prisma.deliveryOrder.findMany({
        where: { companyId: COMPANY_ID },
        include: { supplier: { select: { companyName: true } } },
        orderBy: { id: "desc" },
      }),
      this.getCommonRefs(),
    ]);
    return { orders, ...refs };
  },

  async getReceiptsPageData() {
    const [receipts, refs] = await Promise.all([
      prisma.goodsReceipt.findMany({
        where: { companyId: COMPANY_ID },
        include: { purchaseOrder: { select: { code: true } } },
        orderBy: { id: "desc" },
      }),
      this.getCommonRefs(),
    ]);
    return { receipts, ...refs };
  },

  async getInspectionsPageData() {
    const [inspections, refs] = await Promise.all([
      prisma.qualityInspection.findMany({
        where: { companyId: COMPANY_ID },
        include: { goodsReceipt: { select: { code: true } } },
        orderBy: { id: "desc" },
      }),
      this.getCommonRefs(),
    ]);
    return { inspections, ...refs };
  },

  async getSupplierPaymentsPageData() {
    const [payments, refs, accounts] = await Promise.all([
      prisma.supplierPayment.findMany({
        where: { companyId: COMPANY_ID },
        include: { supplier: { select: { companyName: true } } },
        orderBy: { id: "desc" },
      }),
      this.getCommonRefs(),
      prisma.chartAccount.findMany({ where: { companyId: COMPANY_ID, isGroup: false }, select: { id: true, code: true, name: true } }),
    ]);
    return { payments, ...refs, accounts };
  },

  async getMaterialIssuesPageData() {
    const [issues, refs] = await Promise.all([
      prisma.materialIssue.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { issues, ...refs };
  },

  async getStockTransfersPageData() {
    const [transfers, refs] = await Promise.all([
      prisma.stockTransfer.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { transfers, ...refs };
  },

  async getMaterialConsumptionsPageData() {
    const [consumptions, refs] = await Promise.all([
      prisma.materialConsumption.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { consumptions, ...refs };
  },

  async createRecord(user: SessionUser, kind: string, b: Record<string, unknown>) {
    const today = new Date().toISOString().slice(0, 10);
    if (kind === "requisitions") {
      const count = await prisma.purchaseRequisition.count();
      const row = await prisma.purchaseRequisition.create({
        data: {
          companyId: COMPANY_ID,
          code: `REQ-2026-${String(count + 1).padStart(4, "0")}`,
          reqType: String(b.req_type ?? b.reqType ?? "purchase"),
          projectId: b.project_id ? Number(b.project_id) : null,
          warehouseId: b.warehouse_id ? Number(b.warehouse_id) : null,
          reqDate: String(b.req_date ?? today),
          requiredBy: b.required_by ? String(b.required_by) : null,
          priority: String(b.priority ?? "medium"),
          status: String(b.status ?? "draft"),
          totalEst: Number(b.total_est ?? 0) || 0,
          notes: b.notes ? String(b.notes) : null,
          linesJson: JSON.stringify(b.lines ?? []),
        },
      });
      await recordAudit(user.name, "created", row.code, "PurchaseRequisition", [], user.id);
      return row;
    }
    if (kind === "requirements") {
      const count = await prisma.materialRequirement.count();
      const row = await prisma.materialRequirement.create({
        data: {
          companyId: COMPANY_ID,
          code: `MRQ-${String(count + 1).padStart(4, "0")}`,
          boqId: b.boq_id ? Number(b.boq_id) : null,
          projectId: b.project_id ? Number(b.project_id) : null,
          warehouseId: b.warehouse_id ? Number(b.warehouse_id) : null,
          title: String(b.title || "Planned Material Requirement"),
          factor: Number(b.factor ?? 1) || 1,
          requiredBy: String(b.required_by ?? today),
          notes: b.notes ? String(b.notes) : null,
        },
      });
      await recordAudit(user.name, "created", row.title, "MaterialRequirement", [], user.id);
      return row;
    }
    if (kind === "purchases") {
      const count = await prisma.purchaseOrder.count();
      const row = await prisma.purchaseOrder.create({
        data: {
          companyId: COMPANY_ID,
          code: `PO-2026-${String(count + 1).padStart(5, "0")}`,
          supplierId: b.supplier_id ? Number(b.supplier_id) : null,
          projectId: b.project_id ? Number(b.project_id) : null,
          warehouseId: b.warehouse_id ? Number(b.warehouse_id) : null,
          orderDate: String(b.order_date ?? today),
          totalAmount: Number(b.total_amount ?? 0) || 0,
          status: String(b.status ?? "draft"),
          notes: b.notes ? String(b.notes) : null,
          linesJson: JSON.stringify(b.lines ?? []),
          createdBy: user.name,
        },
      });
      await recordAudit(user.name, "created", row.code, "PurchaseOrder", [], user.id);
      return row;
    }
    if (kind === "delivery-orders") {
      const count = await prisma.deliveryOrder.count();
      const row = await prisma.deliveryOrder.create({
        data: {
          companyId: COMPANY_ID,
          code: `DO-${String(count + 1).padStart(4, "0")}`,
          supplierId: b.supplier_id ? Number(b.supplier_id) : null,
          doNumber: b.do_number ? String(b.do_number) : null,
          brand: b.brand ? String(b.brand) : null,
          liftingPoint: b.lifting_point ? String(b.lifting_point) : null,
          issueDate: String(b.issue_date ?? today),
          validUntil: b.valid_until ? String(b.valid_until) : null,
          projectId: b.project_id ? Number(b.project_id) : null,
          warehouseId: b.warehouse_id ? Number(b.warehouse_id) : null,
          note: b.note ? String(b.note) : null,
          linesJson: JSON.stringify(b.items ?? []),
        },
      });
      await recordAudit(user.name, "created", row.code, "DeliveryOrder", [], user.id);
      return row;
    }
    if (kind === "supplier-payments") {
      const count = await prisma.supplierPayment.count();
      const row = await prisma.supplierPayment.create({
        data: {
          companyId: COMPANY_ID,
          code: `SPAY-${String(count + 1).padStart(4, "0")}`,
          supplierId: b.supplier_id ? Number(b.supplier_id) : null,
          paymentDate: String(b.payment_date ?? today),
          amount: Number(b.amount ?? 0) || 0,
          method: String(b.method ?? "bank"),
          reference: b.reference ? String(b.reference) : null,
          accountId: b.account_id ? Number(b.account_id) : null,
          narration: b.narration ? String(b.narration) : null,
        },
      });
      await recordAudit(user.name, "created", row.code, "SupplierPayment", [], user.id);
      return row;
    }
    if (kind === "material-issues") {
      const count = await prisma.materialIssue.count();
      const row = await prisma.materialIssue.create({
        data: {
          companyId: COMPANY_ID,
          code: `ISS-${String(count + 1).padStart(4, "0")}`,
          warehouseId: b.warehouse_id ? Number(b.warehouse_id) : null,
          projectId: b.project_id ? Number(b.project_id) : null,
          issueDate: String(b.issue_date ?? today),
          purpose: b.purpose ? String(b.purpose) : null,
          responsibleName: b.responsible_name ? String(b.responsible_name) : null,
          totalAmount: Number(b.total_amount ?? 0) || 0,
          notes: b.notes ? String(b.notes) : null,
          linesJson: JSON.stringify(b.lines ?? []),
        },
      });
      await recordAudit(user.name, "created", row.code, "MaterialIssue", [], user.id);
      return row;
    }
    if (kind === "stock-transfers") {
      const count = await prisma.stockTransfer.count();
      const row = await prisma.stockTransfer.create({
        data: {
          companyId: COMPANY_ID,
          code: `STR-${String(count + 1).padStart(4, "0")}`,
          fromWarehouseId: b.from_warehouse_id ? Number(b.from_warehouse_id) : null,
          toWarehouseId: b.to_warehouse_id ? Number(b.to_warehouse_id) : null,
          transferDate: String(b.transfer_date ?? today),
          reference: b.reference ? String(b.reference) : null,
          notes: b.notes ? String(b.notes) : null,
          linesJson: JSON.stringify(b.lines ?? []),
        },
      });
      await recordAudit(user.name, "created", row.code, "StockTransfer", [], user.id);
      return row;
    }
    if (kind === "material-consumptions") {
      const count = await prisma.materialConsumption.count();
      const row = await prisma.materialConsumption.create({
        data: {
          companyId: COMPANY_ID,
          code: `CON-${String(count + 1).padStart(4, "0")}`,
          projectId: b.project_id ? Number(b.project_id) : null,
          buildingId: b.building_id ? Number(b.building_id) : null,
          warehouseId: b.warehouse_id ? Number(b.warehouse_id) : null,
          consumptionDate: String(b.consumption_date ?? today),
          totalCost: Number(b.total_cost ?? 0) || 0,
          notes: b.notes ? String(b.notes) : null,
          linesJson: JSON.stringify(b.lines ?? []),
        },
      });
      await recordAudit(user.name, "created", row.code, "MaterialConsumption", [], user.id);
      return row;
    }
    if (kind === "rfqs") {
      const count = await prisma.rfq.count();
      const row = await prisma.rfq.create({
        data: {
          companyId: COMPANY_ID,
          code: `RFQ-2026-${String(count + 1).padStart(4, "0")}`,
          rfqDate: String(b.rfq_date ?? b.due_date ?? today),
          supplierName: b.supplier_name ? String(b.supplier_name) : (b.title ? String(b.title) : null),
          status: String(b.status ?? "open"),
          totalAmount: Number(b.total_amount ?? 0) || 0,
          notes: b.notes ? String(b.notes) : null,
        },
      });
      await recordAudit(user.name, "created", row.code, "Rfq", [], user.id);
      return row;
    }
    if (kind === "receipts") {
      const count = await prisma.goodsReceipt.count();
      const row = await prisma.goodsReceipt.create({
        data: {
          companyId: COMPANY_ID,
          code: `GRN-2026-${String(count + 1).padStart(4, "0")}`,
          purchaseOrderId: b.purchase_order_id ? Number(b.purchase_order_id) : null,
          warehouseId: b.warehouse_id ? Number(b.warehouse_id) : null,
          receiptDate: String(b.receipt_date ?? today),
          status: String(b.status ?? "received"),
          notes: b.notes ? String(b.notes) : null,
        },
      });
      await recordAudit(user.name, "created", row.code, "GoodsReceipt", [], user.id);
      return row;
    }
    if (kind === "inspections") {
      const count = await prisma.qualityInspection.count();
      const row = await prisma.qualityInspection.create({
        data: {
          companyId: COMPANY_ID,
          code: `QIN-2026-${String(count + 1).padStart(4, "0")}`,
          goodsReceiptId: b.goods_receipt_id ? Number(b.goods_receipt_id) : null,
          inspectionDate: String(b.inspection_date ?? today),
          result: String(b.result ?? "passed"),
          inspectorName: b.inspector_name ? String(b.inspector_name) : user.name,
          notes: b.notes ? String(b.notes) : (b.remarks ? String(b.remarks) : null),
        },
      });
      await recordAudit(user.name, "created", row.code, "QualityInspection", [], user.id);
      return row;
    }
    throw new ServiceError(400, `Unsupported procurement kind: ${kind}`);
  },
};
