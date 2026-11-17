import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { OrganizationController } from "@/server/controllers/organization.controller";

export const GET = withAuth(async () => {
  const holidays = await OrganizationController.listHolidays();
  return NextResponse.json({ holidays });
});

export const POST = withAuth(async ({ user, request }) => {
  const holiday = await OrganizationController.createHoliday(user, await request.json());
  return NextResponse.json({ holiday }, { status: 201 });
});
