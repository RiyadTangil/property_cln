import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { HrController } from "@/server/controllers/hr.controller";

export const PATCH = withAuth<{ kind: string; id: string }>(async ({ user, request, params }) => {
  const row = await HrController.update(user, params.kind, Number(params.id), await request.json());
  return NextResponse.json({ row });
});

export const DELETE = withAuth<{ kind: string; id: string }>(async ({ user, params }) => {
  await HrController.remove(user, params.kind, Number(params.id));
  return NextResponse.json({ ok: true });
});
