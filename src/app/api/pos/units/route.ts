import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { PosController } from "@/server/controllers/pos.controller";

export const GET = withAuth(async () => {
  const units = await PosController.listUnits();
  return NextResponse.json({ units });
});

export const POST = withAuth(async ({ user, request }) => {
  const unit = await PosController.createUnit(user, await request.json());
  return NextResponse.json({ unit }, { status: 201 });
});
