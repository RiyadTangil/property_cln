import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const GET = withAuth(async () => {
  const sequences = await SettingsController.listCodeSequences();
  return NextResponse.json({ sequences });
});

export const PATCH = withAuth(async ({ user, request }) => {
  const sequence = await SettingsController.updateCodeSequence(user, await request.json());
  return NextResponse.json({ sequence });
});
