import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { PosController } from "@/server/controllers/pos.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const unit = await PosController.updateUnit(user, Number(params.id), await request.json());
  return NextResponse.json({ unit });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await PosController.deleteUnit(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
