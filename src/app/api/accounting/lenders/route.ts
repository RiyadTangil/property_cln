import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { AccountingController } from "@/server/controllers/accounting.controller";

export const GET = withAuth(async () => {
  const lenders = await AccountingController.listLenders();
  return NextResponse.json({ lenders });
});

export const POST = withAuth(async ({ user, request }) => {
  const lender = await AccountingController.createLender(user, await request.json());
  return NextResponse.json({ lender }, { status: 201 });
});
