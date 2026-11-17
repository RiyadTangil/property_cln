import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const proposal = await LandController.updateProposal(user, Number(params.id), await request.json());
  return NextResponse.json({ proposal });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await LandController.deleteProposal(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
