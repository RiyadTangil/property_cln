import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const PATCH = withAuth(async ({ user, request }) => {
  const result = await SettingsController.updateProfile(user, await request.json());
  return NextResponse.json(result);
});
