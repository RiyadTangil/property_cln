import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { AccountingController } from "@/server/controllers/accounting.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const account = await AccountingController.updateAccount(user, Number(params.id), await request.json());
  return NextResponse.json({ account });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await AccountingController.deleteAccount(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
