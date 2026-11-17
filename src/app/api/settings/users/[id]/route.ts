import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const updated = await SettingsController.updateUser(user, Number(params.id), await request.json());
  return NextResponse.json({ user: updated });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await SettingsController.deleteUser(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
