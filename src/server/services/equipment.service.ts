import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";
import type { CreateEquipmentCategoryDto, CreateEquipmentDto } from "@/server/dto";

const COMPANY_ID = 1;

export const EquipmentService = {
  async getDashboardData() {
    const [equipments, usageLogs, workOrders, fuelLogs] = await Promise.all([
      prisma.equipment.findMany({ where: { companyId: COMPANY_ID }, include: { category: { select: { name: true } } }, orderBy: { id: "asc" } }),
      prisma.equipmentUsageLog.findMany({ take: 50, orderBy: { id: "desc" } }),
      prisma.equipmentWorkOrder.findMany({ take: 50, orderBy: { id: "desc" } }),
      prisma.equipmentFuelLog.findMany({ take: 50, orderBy: { id: "desc" } }),
    ]);
    return { equipments, usageLogs, workOrders, fuelLogs };
  },

  async getCategoriesPageData() {
    const categories = await prisma.equipmentCategory.findMany({
      where: { companyId: COMPANY_ID },
      include: { _count: { select: { equipments: true } } },
      orderBy: { id: "asc" },
    });
    return { categories };
  },

  async createCategory(user: SessionUser, dto: CreateEquipmentCategoryDto) {
    if (!dto.code.trim() || !dto.name.trim()) throw new ServiceError(400, "Code and name are required");
    const row = await prisma.equipmentCategory.create({
      data: {
        companyId: COMPANY_ID,
        code: dto.code.trim(),
        name: dto.name.trim(),
        equipmentClass: dto.equipmentClass || "heavy_plant",
        requiresOperatorCertification: dto.requiresOperatorCertification ?? false,
        defaultHourlyRate: dto.defaultHourlyRate ?? 0,
        defaultDailyRate: dto.defaultDailyRate ?? 0,
        defaultRateBasis: dto.defaultRateBasis || "hourly",
        usefulLifeYears: dto.usefulLifeYears ?? 10,
        serviceIntervalHours: dto.serviceIntervalHours ?? 250,
        salvagePercent: dto.salvagePercent ?? 10,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
      },
    });
    await recordAudit(user.name, "created", row.name, "EquipmentCategory", [], user.id);
    return row;
  },

  async deleteCategory(user: SessionUser, id: number) {
    const existing = await prisma.equipmentCategory.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Equipment category not found");
    await prisma.equipmentCategory.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.name, "EquipmentCategory", [], user.id);
    return { ok: true };
  },

  async getRegisterPageData() {
    const [equipments, categories, projects] = await Promise.all([
      prisma.equipment.findMany({
        where: { companyId: COMPANY_ID },
        include: { category: { select: { id: true, name: true } } },
        orderBy: { id: "asc" },
      }),
      prisma.equipmentCategory.findMany({ where: { companyId: COMPANY_ID, isActive: true }, orderBy: { name: "asc" } }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
    ]);
    return { equipments, categories, projects };
  },

  async getEquipmentDetailData(id: number) {
    const [equipment, categories, projects] = await Promise.all([
      prisma.equipment.findUnique({
        where: { id },
        include: {
          category: true,
          assignments: { orderBy: { id: "desc" } },
          usageLogs: { orderBy: { id: "desc" } },
          fuelLogs: { orderBy: { id: "desc" } },
          workOrders: { orderBy: { id: "desc" } },
          inspections: { orderBy: { id: "desc" } },
          certifications: { orderBy: { id: "desc" } },
        },
      }),
      prisma.equipmentCategory.findMany({ where: { companyId: COMPANY_ID, isActive: true }, orderBy: { name: "asc" } }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
    ]);
    if (!equipment) throw new ServiceError(404, "Equipment not found");
    return { equipment, categories, projects };
  },

  async createEquipment(user: SessionUser, dto: CreateEquipmentDto) {
    if (!dto.name.trim()) throw new ServiceError(400, "Equipment name is required");
    const count = await prisma.equipment.count();
    const row = await prisma.equipment.create({
      data: {
        companyId: COMPANY_ID,
        code: dto.code?.trim() || `EQP-${String(count + 1).padStart(4, "0")}`,
        name: dto.name.trim(),
        equipmentClass: dto.equipmentClass || "heavy_plant",
        categoryId: dto.categoryId ?? null,
        make: dto.make ?? null,
        model: dto.model ?? null,
        yearOfManufacture: dto.yearOfManufacture ?? null,
        serialNo: dto.serialNo ?? null,
        fuelType: dto.fuelType || "diesel",
        registrationNo: dto.registrationNo ?? null,
        ownershipType: dto.ownershipType || "owned",
        acquiredOn: dto.acquiredOn ?? null,
        acquisitionCost: dto.acquisitionCost ?? 0,
        rateBasis: dto.rateBasis || "hourly",
        internalHourlyRate: dto.internalHourlyRate ?? 0,
        internalDailyRate: dto.internalDailyRate ?? 0,
        meterType: dto.meterType || "hours",
        currentHourMeter: dto.currentHourMeter ?? 0,
        currentOdometer: dto.currentOdometer ?? 0,
        custodianName: dto.custodianName ?? null,
        operatorName: dto.operatorName ?? null,
        currentLocation: dto.currentLocation ?? null,
        projectId: dto.projectId ?? null,
        status: dto.status || "available",
        remarks: dto.remarks ?? null,
      },
    });
    await recordAudit(user.name, "created", `${row.code} ${row.name}`, "Equipment", [], user.id);
    return row;
  },

  async updateEquipment(user: SessionUser, id: number, dto: Partial<CreateEquipmentDto>) {
    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Equipment not found");
    const row = await prisma.equipment.update({ where: { id }, data: dto });
    await recordAudit(user.name, "updated", `${row.code} ${row.name}`, "Equipment", [], user.id);
    return row;
  },

  async deleteEquipment(user: SessionUser, id: number) {
    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Equipment not found");
    await prisma.equipment.delete({ where: { id } });
    await recordAudit(user.name, "deleted", `${existing.code} ${existing.name}`, "Equipment", [], user.id);
    return { ok: true };
  },

  async getSubModulePageData(kind: "assignments" | "usage" | "fuel" | "work-orders" | "inspections" | "operators" | "rentals") {
    const [equipments, projects] = await Promise.all([
      prisma.equipment.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true, status: true, internalHourlyRate: true, acquisitionCost: true, depreciationMethod: true, usefulLifeYears: true, salvageValue: true } }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
    ]);

    if (kind === "assignments") {
      const rows = await prisma.equipmentAssignment.findMany({ include: { equipment: { select: { code: true, name: true } } }, orderBy: { id: "desc" } });
      return { rows, equipments, projects };
    }
    if (kind === "usage") {
      const rows = await prisma.equipmentUsageLog.findMany({ include: { equipment: { select: { code: true, name: true } } }, orderBy: { id: "desc" } });
      return { rows, equipments, projects };
    }
    if (kind === "fuel") {
      const rows = await prisma.equipmentFuelLog.findMany({ include: { equipment: { select: { code: true, name: true } } }, orderBy: { id: "desc" } });
      return { rows, equipments, projects };
    }
    if (kind === "work-orders") {
      const rows = await prisma.equipmentWorkOrder.findMany({ include: { equipment: { select: { code: true, name: true } } }, orderBy: { id: "desc" } });
      return { rows, equipments, projects };
    }
    if (kind === "inspections") {
      const rows = await prisma.equipmentInspection.findMany({ include: { equipment: { select: { code: true, name: true } } }, orderBy: { id: "desc" } });
      return { rows, equipments, projects };
    }
    if (kind === "operators") {
      const rows = await prisma.equipmentOperatorCert.findMany({ include: { equipment: { select: { code: true, name: true } } }, orderBy: { id: "desc" } });
      return { rows, equipments, projects };
    }
    const rows = await prisma.equipmentRental.findMany({ include: { equipment: { select: { code: true, name: true } } }, orderBy: { id: "desc" } });
    return { rows, equipments, projects };
  },

  async createSubModuleRecord(user: SessionUser, kind: string, b: Record<string, unknown>) {
    const today = new Date().toISOString().slice(0, 10);
    if (kind === "assignments") {
      const row = await prisma.equipmentAssignment.create({
        data: {
          equipmentId: Number(b.equipment_id),
          projectId: b.project_id ? Number(b.project_id) : null,
          siteLocation: b.site_location ? String(b.site_location) : null,
          requiredFrom: b.required_from ? String(b.required_from) : null,
          requiredTo: b.required_to ? String(b.required_to) : null,
          custodianName: b.custodian_name ? String(b.custodian_name) : null,
          operatorName: b.operator_name ? String(b.operator_name) : null,
          quantity: Number(b.quantity ?? 1) || 1,
          purpose: b.purpose ? String(b.purpose) : null,
        },
      });
      await recordAudit(user.name, "created", `Assignment #${row.id}`, "EquipmentAssignment", [], user.id);
      return row;
    }
    if (kind === "usage") {
      const row = await prisma.equipmentUsageLog.create({
        data: {
          equipmentId: Number(b.equipment_id),
          projectId: b.project_id ? Number(b.project_id) : null,
          usageDate: String(b.usage_date ?? today),
          shift: String(b.shift ?? "day"),
          operatorName: b.operator_name ? String(b.operator_name) : null,
          hoursWorked: Number(b.hours_worked ?? 0) || 0,
          hoursIdle: Number(b.hours_idle ?? 0) || 0,
          hoursDown: Number(b.hours_down ?? 0) || 0,
          kilometres: Number(b.kilometres ?? 0) || 0,
          downtimeReason: b.downtime_reason ? String(b.downtime_reason) : null,
          rate: Number(b.rate ?? 0) || 0,
          isChargeable: b.is_chargeable !== false,
          workDescription: b.work_description ? String(b.work_description) : null,
        },
      });
      await recordAudit(user.name, "created", `Usage ${row.usageDate}`, "EquipmentUsageLog", [], user.id);
      return row;
    }
    if (kind === "fuel") {
      const row = await prisma.equipmentFuelLog.create({
        data: {
          equipmentId: Number(b.equipment_id),
          projectId: b.project_id ? Number(b.project_id) : null,
          fuelDate: String(b.fuel_date ?? today),
          fuelType: String(b.fuel_type ?? "diesel"),
          source: String(b.source ?? "station"),
          receiptNo: b.receipt_no ? String(b.receipt_no) : null,
          stationName: b.station_name ? String(b.station_name) : null,
          quantity: Number(b.quantity ?? 0) || 0,
          rate: Number(b.rate ?? 0) || 0,
          amount: Number(b.amount ?? 0) || 0,
          isFullTank: Boolean(b.is_full_tank ?? true),
        },
      });
      await recordAudit(user.name, "created", `Fuel ${row.fuelDate}`, "EquipmentFuelLog", [], user.id);
      return row;
    }
    if (kind === "work-orders") {
      const count = await prisma.equipmentWorkOrder.count();
      const row = await prisma.equipmentWorkOrder.create({
        data: {
          code: `EWO-2026-${String(count + 1).padStart(4, "0")}`,
          equipmentId: Number(b.equipment_id),
          type: String(b.type ?? "preventive"),
          priority: String(b.priority ?? "medium"),
          symptoms: String(b.symptoms || "Scheduled service"),
          estimatedCost: Number(b.estimated_cost ?? 0) || 0,
          isExternal: Boolean(b.is_external),
        },
      });
      await recordAudit(user.name, "created", row.code, "EquipmentWorkOrder", [], user.id);
      return row;
    }
    if (kind === "inspections") {
      const count = await prisma.equipmentInspection.count();
      const row = await prisma.equipmentInspection.create({
        data: {
          code: `EIN-2026-${String(count + 1).padStart(4, "0")}`,
          equipmentId: Number(b.equipment_id),
          inspectionType: String(b.inspection_type ?? "periodic"),
          inspectionDate: String(b.inspection_date ?? today),
          nextInspectionDue: b.next_inspection_due ? String(b.next_inspection_due) : null,
          inspectorName: b.external_inspector ? String(b.external_inspector) : user.name,
          result: String(b.result ?? "passed"),
          findings: b.findings ? String(b.findings) : null,
        },
      });
      await recordAudit(user.name, "created", row.code, "EquipmentInspection", [], user.id);
      return row;
    }
    if (kind === "operators") {
      const row = await prisma.equipmentOperatorCert.create({
        data: {
          employeeName: String(b.employee_name || "Operator"),
          equipmentId: b.equipment_id ? Number(b.equipment_id) : null,
          certificationType: String(b.certification_type || "Heavy Equipment Licence"),
          licenceNo: b.licence_no ? String(b.licence_no) : null,
          issuingAuthority: b.issuing_authority ? String(b.issuing_authority) : null,
          issuedOn: b.issued_on ? String(b.issued_on) : null,
          expiresOn: b.expires_on ? String(b.expires_on) : null,
        },
      });
      await recordAudit(user.name, "created", row.employeeName, "EquipmentOperatorCert", [], user.id);
      return row;
    }
    if (kind === "rentals") {
      const count = await prisma.equipmentRental.count();
      const row = await prisma.equipmentRental.create({
        data: {
          code: `HRE-${String(count + 1).padStart(4, "0")}`,
          equipmentId: b.equipment_id ? Number(b.equipment_id) : null,
          direction: String(b.direction ?? "hired_in"),
          counterparty: String(b.counterparty || "Rental Partner"),
          description: b.description ? String(b.description) : null,
          startDate: String(b.start_date ?? today),
          endDate: b.end_date ? String(b.end_date) : null,
          rateBasis: String(b.rate_basis ?? "daily"),
          rate: Number(b.rate ?? 0) || 0,
          securityDeposit: Number(b.security_deposit ?? 0) || 0,
        },
      });
      await recordAudit(user.name, "created", row.code, "EquipmentRental", [], user.id);
      return row;
    }
    throw new ServiceError(400, `Unsupported equipment submodule: ${kind}`);
  },
};
