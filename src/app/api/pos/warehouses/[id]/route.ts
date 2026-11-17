import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { PosController } from "@/server/controllers/pos.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const warehouse = await PosController.updateWarehouse(user, Number(params.id), await request.json());
  return NextResponse.json({ warehouse });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await PosController.deleteWarehouse(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
