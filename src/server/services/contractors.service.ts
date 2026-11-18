import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";
import type { CreateContractorDto, CreateContractorPaymentDto, CreateContractorWorkOrderDto } from "@/server/dto";

const COMPANY_ID = 1;

export const ContractorsService = {
  async getContractorsPageData() {
    const contractors = await prisma.contractor.findMany({
      where: { companyId: COMPANY_ID },
      orderBy: { id: "desc" },
    });
    return { contractors };
  },

  async createContractor(user: SessionUser, dto: CreateContractorDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Contractor name is required");
    const count = await prisma.contractor.count();
    const row = await prisma.contractor.create({
      data: {
        companyId: COMPANY_ID,
        code: `CTR-${String(count + 1).padStart(4, "0")}`,
        name: dto.name.trim(),
        displayName: dto.displayName ?? null,
        contractorType: dto.contractorType || "labour_and_material",
        trade: dto.trade ?? null,
        status: dto.status || "active",
        contactPerson: dto.contactPerson ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        addressLine: dto.addressLine ?? null,
        city: dto.city ?? null,
        tradeLicense: dto.tradeLicense ?? null,
        defaultRetentionPercent: dto.defaultRetentionPercent ?? 5,
        defaultSecurityDepositPercent: dto.defaultSecurityDepositPercent ?? 0,
        defaultTdsPercent: dto.defaultTdsPercent ?? 3,
        defaultVatPercent: dto.defaultVatPercent ?? 0,
        taxNumber: dto.taxNumber ?? null,
        vatNumber: dto.vatNumber ?? null,
        bankName: dto.bankName ?? null,
        bankBranch: dto.bankBranch ?? null,
        bankAccountNo: dto.bankAccountNo ?? null,
        notes: dto.notes ?? null,
      },
    });
    await recordAudit(user.name, "created", row.name, "Contractor", [], user.id);
    return row;
  },

  async deleteContractor(user: SessionUser, id: number) {
    const existing = await prisma.contractor.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Contractor not found");
    await prisma.contractor.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "Contractor", [], user.id);
    return { ok: true };
  },

  async getWorkOrdersPageData() {
    const [workOrders, contractors, projects] = await Promise.all([
      prisma.contractorWorkOrder.findMany({
        where: { companyId: COMPANY_ID },
        include: { contractor: { select: { id: true, code: true, name: true } } },
        orderBy: { id: "desc" },
      }),
      prisma.contractor.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true } }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
    ]);
    return { workOrders, contractors, projects };
  },

  async createWorkOrder(user: SessionUser, dto: CreateContractorWorkOrderDto) {
    if (!dto.title.trim()) throw new ServiceError(400, "Work order title is required");
    const count = await prisma.contractorWorkOrder.count();
    const row = await prisma.contractorWorkOrder.create({
      data: {
        companyId: COMPANY_ID,
        code: `WO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
        contractorId: dto.contractorId,
        projectId: dto.projectId ?? null,
        orderDate: dto.orderDate,
        engagementType: dto.engagementType || "subcontract",
        pricingMethod: dto.pricingMethod || "item_rate",
        title: dto.title.trim(),
        scope: dto.scope ?? null,
        startDate: dto.startDate ?? null,
        completionDate: dto.completionDate ?? null,
        defectLiabilityDays: dto.defectLiabilityDays ?? 180,
        retentionPercent: dto.retentionPercent ?? 5,
        tdsPercent: dto.tdsPercent ?? 3,
        vatPercent: dto.vatPercent ?? 0,
        advanceRecoveryPercent: dto.advanceRecoveryPercent ?? 0,
        contractValue: dto.contractValue ?? 0,
      },
    });
    await recordAudit(user.name, "created", `${row.code} ${row.title}`, "ContractorWorkOrder", [], user.id);
    return row;
  },

  async getBillsPageData() {
    const [bills, contractors, workOrders, projects] = await Promise.all([
      prisma.contractorBill.findMany({
        where: { companyId: COMPANY_ID },
        include: { contractor: { select: { id: true, name: true } }, workOrder: { select: { id: true, code: true, title: true } } },
        orderBy: { id: "desc" },
      }),
      prisma.contractor.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true } }),
      prisma.contractorWorkOrder.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, title: true } }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true } }),
    ]);
    return { bills, contractors, workOrders, projects };
  },

  async getPaymentsPageData() {
    const [payments, contractors, projects] = await Promise.all([
      prisma.contractorPayment.findMany({
        where: { companyId: COMPANY_ID },
        include: { contractor: { select: { id: true, name: true } } },
        orderBy: { id: "desc" },
      }),
      prisma.contractor.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true } }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true } }),
    ]);
    return { payments, contractors, projects };
  },

  async createPayment(user: SessionUser, dto: CreateContractorPaymentDto) {
    const count = await prisma.contractorPayment.count();
    const row = await prisma.contractorPayment.create({
      data: {
        companyId: COMPANY_ID,
        code: `CPAY-${String(count + 1).padStart(4, "0")}`,
        contractorId: dto.contractorId,
        projectId: dto.projectId ?? null,
        kind: dto.kind || "payment",
        paymentDate: dto.paymentDate,
        amount: dto.amount || 0,
        method: dto.method || "bank",
        reference: dto.reference ?? null,
        notes: dto.notes ?? null,
      },
      include: { contractor: { select: { id: true, name: true } } },
    });
    await recordAudit(user.name, "created", `${row.code} (${row.amount})`, "ContractorPayment", [], user.id);
    return row;
  },
};
