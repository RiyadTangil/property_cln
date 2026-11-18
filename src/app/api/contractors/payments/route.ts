import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ContractorsController } from "@/server/controllers/contractors.controller";
import { ContractorsService } from "@/server/services/contractors.service";

export const GET = withAuth(async () => NextResponse.json(await ContractorsService.getPaymentsPageData()));
export const POST = withAuth(async ({ user, request }) => {
  const payment = await ContractorsController.createPayment(user, await request.json());
  return NextResponse.json({ payment }, { status: 201 });
});
