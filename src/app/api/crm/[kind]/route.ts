import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { CrmController } from "@/server/controllers/crm.controller";

export const POST = withAuth<{ kind: string }>(async ({ user, request, params }) => {
  const row = await CrmController.create(user, params.kind, await request.json());
  return NextResponse.json({ row }, { status: 201 });
});
