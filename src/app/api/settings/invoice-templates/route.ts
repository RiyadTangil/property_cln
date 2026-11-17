import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const GET = withAuth(async () => {
  const templates = await SettingsController.listInvoiceTemplates();
  return NextResponse.json({ templates });
});

export const POST = withAuth(async ({ user, request }) => {
  const template = await SettingsController.createInvoiceTemplate(user, await request.json());
  return NextResponse.json({ template }, { status: 201 });
});

export const DELETE = withAuth(async ({ user, request }) => {
  const { searchParams } = new URL(request.url);
  await SettingsController.deleteInvoiceTemplate(user, Number(searchParams.get("id")));
  return NextResponse.json({ ok: true });
});
