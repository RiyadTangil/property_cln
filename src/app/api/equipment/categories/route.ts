import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { EquipmentController } from "@/server/controllers/equipment.controller";
import { EquipmentService } from "@/server/services/equipment.service";

export const GET = withAuth(async () => NextResponse.json(await EquipmentService.getCategoriesPageData()));
export const POST = withAuth(async ({ user, request }) => {
  const category = await EquipmentController.createCategory(user, await request.json());
  return NextResponse.json({ category }, { status: 201 });
});
