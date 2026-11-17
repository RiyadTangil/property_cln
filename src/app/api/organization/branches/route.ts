import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { OrganizationController } from "@/server/controllers/organization.controller";

export const GET = withAuth(async () => {
  const branches = await OrganizationController.listBranches();
  return NextResponse.json({ branches });
});

export const POST = withAuth(async ({ user, request }) => {
  const branch = await OrganizationController.createBranch(user, await request.json());
  return NextResponse.json({ branch }, { status: 201 });
});
