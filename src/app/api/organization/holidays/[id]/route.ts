import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { OrganizationController } from "@/server/controllers/organization.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const holiday = await OrganizationController.updateHoliday(user, Number(params.id), await request.json());
  return NextResponse.json({ holiday });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await OrganizationController.deleteHoliday(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
