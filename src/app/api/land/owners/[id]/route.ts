import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const owner = await LandController.updateOwner(user, Number(params.id), await request.json());
  return NextResponse.json({ owner });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await LandController.deleteOwner(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
