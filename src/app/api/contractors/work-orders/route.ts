import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ContractorsController } from "@/server/controllers/contractors.controller";
import { ContractorsService } from "@/server/services/contractors.service";

export const GET = withAuth(async () => NextResponse.json(await ContractorsService.getWorkOrdersPageData()));
export const POST = withAuth(async ({ user, request }) => {
  const workOrder = await ContractorsController.createWorkOrder(user, await request.json());
  return NextResponse.json({ workOrder }, { status: 201 });
});
