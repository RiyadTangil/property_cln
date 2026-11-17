import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { OrganizationController } from "@/server/controllers/organization.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const fiscalYear = await OrganizationController.updateFiscalYear(user, Number(params.id), await request.json());
  return NextResponse.json({ fiscalYear });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await OrganizationController.deleteFiscalYear(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
