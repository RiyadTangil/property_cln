import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth<{ id: string }>(async ({ params }) => {
  const parcel = await LandController.getParcel(Number(params.id));
  return NextResponse.json({ parcel });
});

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const parcel = await LandController.updateParcel(user, Number(params.id), await request.json());
  return NextResponse.json({ parcel });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await LandController.deleteParcel(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
