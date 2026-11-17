import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { InventoryController } from "@/server/controllers/inventory.controller";
import { InventoryService } from "@/server/services/inventory.service";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const unit = await InventoryController.updateUnit(user, Number(params.id), await request.json());
  return NextResponse.json({ unit });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await InventoryService.deleteUnit(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
