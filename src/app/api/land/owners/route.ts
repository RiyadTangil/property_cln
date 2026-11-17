import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth(async () => {
  const owners = await LandController.listOwners();
  return NextResponse.json({ owners });
});

export const POST = withAuth(async ({ user, request }) => {
  const owner = await LandController.createOwner(user, await request.json());
  return NextResponse.json({ owner }, { status: 201 });
});
