import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { AccountingController } from "@/server/controllers/accounting.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const head = await AccountingController.updateHead(user, Number(params.id), await request.json());
  return NextResponse.json({ head });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await AccountingController.deleteHead(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
