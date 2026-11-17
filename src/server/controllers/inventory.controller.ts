import { optNum, optStr } from "@/server/http/api-handler";
import { InventoryService } from "@/server/services/inventory.service";
import type { SessionUser } from "@/lib/auth";

type RawBody = Record<string, unknown>;

export const InventoryController = {
  updateUnit(user: SessionUser, id: number, b: RawBody) {
    return InventoryService.updateUnit(user, id, {
      floorId: optNum(b.floor_id ?? b.floorId) ?? undefined,
      unitNumber: optStr(b.unit_number ?? b.unitNumber) ?? undefined,
      name: b.name !== undefined ? optStr(b.name) : undefined,
      unitType: optStr(b.unit_type ?? b.unitType) ?? undefined,
      status: optStr(b.status) ?? undefined,
      facing: b.facing !== undefined ? optStr(b.facing) : undefined,
      bedrooms: optNum(b.bedrooms) ?? undefined,
      bathrooms: optNum(b.bathrooms) ?? undefined,
      balconies: optNum(b.balconies) ?? undefined,
      parkingSlots: optNum(b.parking_slots ?? b.parkingSlots) ?? undefined,
      carpetArea: b.carpet_area !== undefined || b.carpetArea !== undefined ? optNum(b.carpet_area ?? b.carpetArea) : undefined,
      builtArea: b.built_area !== undefined || b.builtArea !== undefined ? optNum(b.built_area ?? b.builtArea) : undefined,
      superArea: b.super_area !== undefined || b.superArea !== undefined ? optNum(b.super_area ?? b.superArea) : undefined,
      price: b.price !== undefined ? optNum(b.price) : undefined,
      ratePerSqft: b.rate_per_sqft !== undefined || b.ratePerSqft !== undefined ? optNum(b.rate_per_sqft ?? b.ratePerSqft) : undefined,
      handoverDate: b.handover_date !== undefined || b.handoverDate !== undefined ? optStr(b.handover_date ?? b.handoverDate) : undefined,
      ownerName: b.owner_name !== undefined || b.ownerName !== undefined ? optStr(b.owner_name ?? b.ownerName) : undefined,
      customerName: b.customer_name !== undefined || b.customerName !== undefined ? optStr(b.customer_name ?? b.customerName) : undefined,
      features: b.features !== undefined ? optStr(b.features) : undefined,
      description: b.description !== undefined ? optStr(b.description) : undefined,
      isCorner: typeof (b.is_corner ?? b.isCorner) === "boolean" ? Boolean(b.is_corner ?? b.isCorner) : undefined,
    });
  },
};
