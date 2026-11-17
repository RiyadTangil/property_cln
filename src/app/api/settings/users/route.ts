import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const GET = withAuth(async () => {
  const users = await SettingsController.listUsers();
  return NextResponse.json({ users });
});

export const POST = withAuth(async ({ user, request }) => {
  const created = await SettingsController.createUser(user, await request.json());
  return NextResponse.json({ user: created }, { status: 201 });
});
