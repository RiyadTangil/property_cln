import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { EquipmentService } from "@/server/services/equipment.service";

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await EquipmentService.deleteCategory(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
