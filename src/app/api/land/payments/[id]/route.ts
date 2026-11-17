import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const payment = await LandController.updatePayment(user, Number(params.id), await request.json());
  return NextResponse.json({ payment });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await LandController.deletePayment(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
