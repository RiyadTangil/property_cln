import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { EquipmentController } from "@/server/controllers/equipment.controller";
import { EquipmentService } from "@/server/services/equipment.service";

export const GET = withAuth(async () => NextResponse.json(await EquipmentService.getRegisterPageData()));
export const POST = withAuth(async ({ user, request }) => {
  const equipment = await EquipmentController.createEquipment(user, await request.json());
  return NextResponse.json({ equipment }, { status: 201 });
});
