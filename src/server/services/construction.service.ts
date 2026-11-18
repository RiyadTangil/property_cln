import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";
import type { CreateBoqDto, CreateBoqScopeDto, CreateResourceAnalysisDto, CreateResourceItemDto } from "@/server/dto";

const COMPANY_ID = 1;

export const ConstructionService = {
  async getBoqScopesPageData() {
    const [scopes, resources] = await Promise.all([
      prisma.boqScope.findMany({ where: { companyId: COMPANY_ID }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      prisma.resourceItem.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true, uom: true, standardRate: true } }),
    ]);
    return {
      scopes,
      resources,
      stats: {
        packages: scopes.length,
        active: scopes.filter((s) => s.isActive).length,
        retired: scopes.filter((s) => !s.isActive).length,
      },
    };
  },

  async createBoqScope(user: SessionUser, dto: CreateBoqScopeDto) {
    if (!dto.code.trim() || !dto.name.trim()) throw new ServiceError(400, "Code and name are required");
    const row = await prisma.boqScope.create({
      data: {
        companyId: COMPANY_ID,
        code: dto.code.trim(),
        name: dto.name.trim(),
        discipline: dto.discipline || "civil",
        coverage: dto.coverage ?? null,
        sortOrder: dto.sortOrder ?? 10,
        isActive: dto.isActive ?? true,
      },
    });
    await recordAudit(user.name, "created", `${row.code} ${row.name}`, "BoqScope", [], user.id);
    return row;
  },

  async deleteBoqScope(user: SessionUser, id: number) {
    const existing = await prisma.boqScope.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Scope not found");
    await prisma.boqScope.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "BoqScope", [], user.id);
    return { ok: true };
  },

  async getBoqsPageData() {
    const [boqs, projects, scopes] = await Promise.all([
      prisma.boq.findMany({
        where: { companyId: COMPANY_ID },
        include: { scope: { select: { id: true, code: true, name: true } } },
        orderBy: { id: "desc" },
      }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true }, orderBy: { id: "desc" } }),
      prisma.boqScope.findMany({ where: { companyId: COMPANY_ID, isActive: true }, select: { id: true, code: true, name: true }, take: 50, orderBy: { sortOrder: "asc" } }),
    ]);
    return { boqs, projects, scopes };
  },

  async createBoq(user: SessionUser, dto: CreateBoqDto) {
    if (!dto.title.trim()) throw new ServiceError(400, "BOQ title is required");
    const row = await prisma.boq.create({
      data: {
        companyId: COMPANY_ID,
        projectId: dto.projectId ?? null,
        scopeId: dto.scopeId ?? null,
        version: dto.version || "v1.0",
        title: dto.title.trim(),
        effectiveDate: dto.effectiveDate ?? null,
        measurementStandard: dto.measurementStandard || "BNBC",
        currency: dto.currency || "BDT",
        taxPercent: dto.taxPercent ?? 0,
        contingencyPercent: dto.contingencyPercent ?? 0,
        areaBasis: dto.areaBasis ?? null,
        areaValue: dto.areaValue ?? null,
        areaUom: dto.areaUom ?? null,
        notes: dto.notes ?? null,
        createdBy: user.name,
      },
    });
    await recordAudit(user.name, "created", row.title, "Boq", [], user.id);
    return row;
  },

  async deleteBoq(user: SessionUser, id: number) {
    const existing = await prisma.boq.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "BOQ not found");
    await prisma.boq.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.title, "Boq", [], user.id);
    return { ok: true };
  },

  async getResourcesPageData() {
    const resources = await prisma.resourceItem.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "asc" } });
    return { resources };
  },

  async createResource(user: SessionUser, dto: CreateResourceItemDto) {
    if (!dto.code.trim() || !dto.name.trim()) throw new ServiceError(400, "Code and name are required");
    const row = await prisma.resourceItem.create({
      data: {
        companyId: COMPANY_ID,
        code: dto.code.trim(),
        name: dto.name.trim(),
        kind: dto.kind || "labour",
        trade: dto.trade ?? null,
        uom: dto.uom || "Day",
        standardRate: dto.standardRate ?? 0,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
      },
    });
    await recordAudit(user.name, "created", row.name, "ResourceItem", [], user.id);
    return row;
  },

  async deleteResource(user: SessionUser, id: number) {
    const existing = await prisma.resourceItem.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Resource not found");
    await prisma.resourceItem.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "ResourceItem", [], user.id);
    return { ok: true };
  },

  async getRateAnalysisPageData() {
    const [analyses, resources, cbsItems] = await Promise.all([
      prisma.resourceAnalysis.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      prisma.resourceItem.findMany({ where: { companyId: COMPANY_ID, isActive: true }, orderBy: { name: "asc" } }),
      prisma.costBreakdownItem.findMany({ where: { companyId: COMPANY_ID, isGroup: false }, select: { id: true, code: true, name: true }, take: 80 }),
    ]);
    return { analyses, resources, cbsItems };
  },

  async createRateAnalysis(user: SessionUser, dto: CreateResourceAnalysisDto) {
    if (!dto.code.trim() || !dto.name.trim()) throw new ServiceError(400, "Code and name are required");
    const row = await prisma.resourceAnalysis.create({
      data: {
        companyId: COMPANY_ID,
        code: dto.code.trim(),
        name: dto.name.trim(),
        outputQty: dto.outputQty ?? 1,
        outputUom: dto.outputUom || "CFT",
        overheadPercent: dto.overheadPercent ?? 10,
        profitPercent: dto.profitPercent ?? 10,
        costCode: dto.costCode ?? null,
        linesJson: dto.linesJson || "[]",
        unitRate: dto.unitRate ?? 0,
      },
    });
    await recordAudit(user.name, "created", `${row.code} ${row.name}`, "ResourceAnalysis", [], user.id);
    return row;
  },
};
