import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth(async () => {
  const agreements = await LandController.listAgreements();
  return NextResponse.json({ agreements });
});

export const POST = withAuth(async ({ user, request }) => {
  const agreement = await LandController.createAgreement(user, await request.json());
  return NextResponse.json({ agreement }, { status: 201 });
});
