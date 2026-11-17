import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const GET = withAuth(async () => {
  const documents = await SettingsController.listDocuments();
  return NextResponse.json({ documents });
});

export const POST = withAuth(async ({ user, request }) => {
  const document = await SettingsController.createDocument(user, await request.json());
  return NextResponse.json({ document }, { status: 201 });
});

export const DELETE = withAuth(async ({ user, request }) => {
  const { searchParams } = new URL(request.url);
  await SettingsController.deleteDocument(user, Number(searchParams.get("id")));
  return NextResponse.json({ ok: true });
});
