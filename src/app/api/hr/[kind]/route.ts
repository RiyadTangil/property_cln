import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { HrController } from "@/server/controllers/hr.controller";

export const POST = withAuth<{ kind: string }>(async ({ user, request, params }) => {
  const row = await HrController.create(user, params.kind, await request.json());
  return NextResponse.json({ row }, { status: 201 });
});
