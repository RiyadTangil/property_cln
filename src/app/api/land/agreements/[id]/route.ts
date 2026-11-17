import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const agreement = await LandController.updateAgreement(user, Number(params.id), await request.json());
  return NextResponse.json({ agreement });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await LandController.deleteAgreement(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
