import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { OrganizationController } from "@/server/controllers/organization.controller";

export const GET = withAuth(async () => {
  const companies = await OrganizationController.listCompanies();
  return NextResponse.json({ companies });
});

export const POST = withAuth(async ({ user, request }) => {
  const company = await OrganizationController.createCompany(user, await request.json());
  return NextResponse.json({ company }, { status: 201 });
});
