import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const GET = withAuth(async () => {
  const roles = await SettingsController.listRoles();
  return NextResponse.json({ roles });
});

export const POST = withAuth(async ({ user, request }) => {
  const role = await SettingsController.createRole(user, await request.json());
  return NextResponse.json({ role }, { status: 201 });
});
