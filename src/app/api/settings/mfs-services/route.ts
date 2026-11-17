import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const GET = withAuth(async () => {
  const services = await SettingsController.listMfsServices();
  return NextResponse.json({ services });
});

export const POST = withAuth(async ({ user, request }) => {
  const service = await SettingsController.createMfsService(user, await request.json());
  return NextResponse.json({ service }, { status: 201 });
});

export const PATCH = withAuth(async ({ user, request }) => {
  const service = await SettingsController.updateMfsService(user, await request.json());
  return NextResponse.json({ service });
});

export const DELETE = withAuth(async ({ user, request }) => {
  const { searchParams } = new URL(request.url);
  await SettingsController.deleteMfsService(user, Number(searchParams.get("id")));
  return NextResponse.json({ ok: true });
});
