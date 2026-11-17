import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const GET = withAuth(async () => {
  const setting = await SettingsController.getApplicationSetting();
  return NextResponse.json({ setting });
});

export const PUT = withAuth(async ({ user, request }) => {
  const setting = await SettingsController.updateApplicationSetting(user, await request.json());
  return NextResponse.json({ setting });
});
