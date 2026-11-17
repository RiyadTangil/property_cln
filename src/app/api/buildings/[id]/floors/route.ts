import { NextResponse } from "next/server";
import { withAuth, optNum, optStr } from "@/server/http/api-handler";
import { ProjectsService } from "@/server/services/projects.service";

export const POST = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const b = (await request.json()) as Record<string, unknown>;
  const buildingId = Number(params.id);

  if (b.mode === "bulk" || b.from_floor !== undefined || b.fromFloor !== undefined) {
    const floors = await ProjectsService.bulkCreateFloors(user, buildingId, {
      fromFloor: Number(b.from_floor ?? b.fromFloor ?? 1),
      toFloor: Number(b.to_floor ?? b.toFloor ?? 1),
      floorType: optStr(b.floor_type ?? b.floorType) ?? "residential",
      unitsPlanned: optNum(b.units_planned ?? b.unitsPlanned) ?? 0,
      area: optNum(b.area),
      height: optNum(b.height),
    });
    return NextResponse.json({ floors }, { status: 201 });
  }

  const floor = await ProjectsService.createFloor(user, buildingId, {
    floorNumber: Number(b.floor_number ?? b.floorNumber ?? 0),
    name: optStr(b.name),
    floorType: optStr(b.floor_type ?? b.floorType) ?? "residential",
    unitsPlanned: optNum(b.units_planned ?? b.unitsPlanned) ?? 0,
    area: optNum(b.area),
    height: optNum(b.height),
    description: optStr(b.description),
  });
  return NextResponse.json({ floor }, { status: 201 });
});

export const DELETE = withAuth(async ({ user, request }) => {
  const b = (await request.json()) as Record<string, unknown>;
  await ProjectsService.deleteFloor(user, Number(b.floorId));
  return NextResponse.json({ ok: true });
});
