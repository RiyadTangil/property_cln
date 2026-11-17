import { NextResponse } from "next/server";
import { withAuth, optNum, optStr, reqStr } from "@/server/http/api-handler";
import { ProjectsService } from "@/server/services/projects.service";

export const POST = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const b = (await request.json()) as Record<string, unknown>;
  const buildingId = Number(params.id);

  if (b.mode === "bulk") {
    const floorIds = Array.isArray(b.floor_ids ?? b.floorIds) ? ((b.floor_ids ?? b.floorIds) as unknown[]).map(Number).filter(Boolean) : [];
    const units = await ProjectsService.bulkGenerateUnits(user, buildingId, {
      floorIds,
      unitsPerFloor: Number(b.units_per_floor ?? b.unitsPerFloor ?? 2),
      prefix: optStr(b.prefix) ?? "",
      unitType: optStr(b.unit_type ?? b.unitType) ?? "apartment",
      bedrooms: optNum(b.bedrooms) ?? 0,
      bathrooms: optNum(b.bathrooms) ?? 0,
      builtArea: optNum(b.built_area ?? b.builtArea),
      price: optNum(b.price),
    });
    return NextResponse.json({ units }, { status: 201 });
  }

  const unit = await ProjectsService.createUnit(user, buildingId, {
    floorId: Number(b.floor_id ?? b.floorId),
    unitNumber: reqStr(b.unit_number ?? b.unitNumber),
    name: optStr(b.name),
    unitType: optStr(b.unit_type ?? b.unitType) ?? "apartment",
    status: optStr(b.status) ?? "available",
    facing: optStr(b.facing),
    bedrooms: optNum(b.bedrooms) ?? 0,
    bathrooms: optNum(b.bathrooms) ?? 0,
    balconies: optNum(b.balconies) ?? 0,
    parkingSlots: optNum(b.parking_slots ?? b.parkingSlots) ?? 0,
    carpetArea: optNum(b.carpet_area ?? b.carpetArea),
    builtArea: optNum(b.built_area ?? b.builtArea),
    superArea: optNum(b.super_area ?? b.superArea),
    price: optNum(b.price),
    ratePerSqft: optNum(b.rate_per_sqft ?? b.ratePerSqft),
    handoverDate: optStr(b.handover_date ?? b.handoverDate),
    ownerName: optStr(b.owner_name ?? b.ownerName),
    customerName: optStr(b.customer_name ?? b.customerName),
    features: optStr(b.features),
    description: optStr(b.description),
    isCorner: Boolean(b.is_corner ?? b.isCorner),
  });
  return NextResponse.json({ unit }, { status: 201 });
});

export const DELETE = withAuth(async ({ user, request }) => {
  const b = (await request.json()) as Record<string, unknown>;
  await ProjectsService.deleteUnit(user, Number(b.unitId));
  return NextResponse.json({ ok: true });
});
