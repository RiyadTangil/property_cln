import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { OrganizationController } from "@/server/controllers/organization.controller";

export const GET = withAuth(async () => {
  const fiscalYears = await OrganizationController.listFiscalYears();
  return NextResponse.json({ fiscalYears });
});

export const POST = withAuth(async ({ user, request }) => {
  const fiscalYear = await OrganizationController.createFiscalYear(user, await request.json());
  return NextResponse.json({ fiscalYear }, { status: 201 });
});
