import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";
import type { UpdateInventoryUnitDto } from "@/server/dto";

const COMPANY_ID = 1;

const UNIT_STATUSES = [
  "available",
  "reserved",
  "booked",
  "sold",
  "rented",
  "handed_over",
  "blocked",
  "under_construction",
] as const;

export const InventoryService = {
  async getUnitInventoryPageData() {
    const [units, allUnits, projects, buildings, floors] = await Promise.all([
      prisma.buildingUnit.findMany({
        include: {
          building: { select: { id: true, code: true, name: true, projectId: true } },
          floor: { select: { id: true, floorNumber: true, name: true } },
        },
        orderBy: [{ buildingId: "asc" }, { floorId: "desc" }, { unitNumber: "asc" }],
      }),
      prisma.buildingUnit.findMany({ select: { status: true } }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true }, orderBy: { id: "desc" } }),
      prisma.building.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true, projectId: true }, orderBy: { id: "asc" } }),
      prisma.buildingFloor.findMany({ select: { id: true, buildingId: true, floorNumber: true, name: true }, orderBy: { floorNumber: "asc" } }),
    ]);

    const statusCounts: Record<string, number> = { all: allUnits.length };
    for (const st of UNIT_STATUSES) statusCounts[st] = 0;
    for (const u of allUnits) {
      if (u.status in statusCounts) statusCounts[u.status] += 1;
    }

    return { units, statusCounts, projects, buildings, floors };
  },

  async updateUnit(user: SessionUser, id: number, dto: UpdateInventoryUnitDto) {
    const existing = await prisma.buildingUnit.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Unit not found");
    const row = await prisma.buildingUnit.update({
      where: { id },
      data: dto,
      include: {
        building: { select: { id: true, code: true, name: true, projectId: true } },
        floor: { select: { id: true, floorNumber: true, name: true } },
      },
    });
    await recordAudit(user.name, "updated", row.unitNumber, "BuildingUnit", Object.keys(dto), user.id);
    return row;
  },

  async deleteUnit(user: SessionUser, id: number) {
    const existing = await prisma.buildingUnit.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Unit not found");
    await prisma.buildingUnit.delete({ where: { id } });
    await recordAudit(user.name, "deleted", existing.unitNumber, "BuildingUnit", [], user.id);
    return { ok: true };
  },

  async getAvailabilityPageData() {
    const [buildings, projects] = await Promise.all([
      prisma.building.findMany({
        where: { companyId: COMPANY_ID },
        include: {
          project: { select: { id: true, code: true, name: true } },
          floors: {
            include: { units: { orderBy: { unitNumber: "asc" } } },
            orderBy: { floorNumber: "desc" },
          },
          units: { select: { id: true, status: true, price: true, builtArea: true } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true }, orderBy: { id: "desc" } }),
    ]);

    return { buildings, projects };
  },

  async getLandPlotsPageData() {
    const [parcels, projects] = await Promise.all([
      prisma.landParcel.findMany({
        where: { companyId: COMPANY_ID },
        include: { project: { select: { id: true, code: true, name: true } } },
        orderBy: { id: "desc" },
      }),
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true }, orderBy: { id: "desc" } }),
    ]);
    return { parcels, projects };
  },

  async getPriceListsPageData() {
    const [units, buildings] = await Promise.all([
      prisma.buildingUnit.findMany({
        include: {
          building: { select: { id: true, code: true, name: true } },
          floor: { select: { id: true, floorNumber: true, name: true } },
        },
        orderBy: [{ buildingId: "asc" }, { floorId: "desc" }, { unitNumber: "asc" }],
      }),
      prisma.building.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true }, orderBy: { id: "asc" } }),
    ]);
    return { units, buildings };
  },
};
