import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { OrganizationController } from "@/server/controllers/organization.controller";

export const GET = withAuth(async () => {
  const departments = await OrganizationController.listDepartments();
  return NextResponse.json({ departments });
});

export const POST = withAuth(async ({ user, request }) => {
  const result = await OrganizationController.createDepartment(user, await request.json());
  return NextResponse.json(result, { status: 201 });
});
