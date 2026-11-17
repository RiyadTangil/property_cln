import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const role = await SettingsController.updateRole(user, Number(params.id), await request.json());
  return NextResponse.json({ role });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await SettingsController.deleteRole(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
