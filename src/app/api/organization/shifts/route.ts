import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { OrganizationController } from "@/server/controllers/organization.controller";

export const GET = withAuth(async () => {
  const shifts = await OrganizationController.listShifts();
  return NextResponse.json({ shifts });
});

export const POST = withAuth(async ({ user, request }) => {
  const shift = await OrganizationController.createShift(user, await request.json());
  return NextResponse.json({ shift }, { status: 201 });
});
