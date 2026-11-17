import { NextResponse } from "next/server";
import { withAuth, optNum, optStr, reqStr } from "@/server/http/api-handler";
import { ProjectsService } from "@/server/services/projects.service";

export const POST = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const b = (await request.json()) as Record<string, unknown>;
  const consumption = await ProjectsService.createProjectConsumption(user, Number(params.id), {
    buildingId: optNum(b.building_id ?? b.buildingId),
    projectTaskId: optNum(b.project_task_id ?? b.projectTaskId),
    materialName: reqStr(b.material_name ?? b.materialName),
    costCode: optStr(b.cost_code ?? b.costCode),
    qtyUsed: Number(b.qty_used ?? b.qtyUsed ?? 0) || 0,
    wastage: Number(b.wastage ?? 0) || 0,
    uom: optStr(b.uom) ?? "Unit",
    unitCost: Number(b.unit_cost ?? b.unitCost ?? 0) || 0,
    consumptionDate: optStr(b.consumption_date ?? b.consumptionDate),
    notes: optStr(b.notes),
  });
  return NextResponse.json({ consumption }, { status: 201 });
});
