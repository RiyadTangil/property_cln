import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth(async () => {
  const parcels = await LandController.listParcels();
  return NextResponse.json({ parcels });
});

export const POST = withAuth(async ({ user, request }) => {
  const parcel = await LandController.createParcel(user, await request.json());
  return NextResponse.json({ parcel }, { status: 201 });
});
