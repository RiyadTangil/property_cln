import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { AccountingController } from "@/server/controllers/accounting.controller";

export const GET = withAuth(async () => {
  const banks = await AccountingController.listBanks();
  return NextResponse.json({ banks });
});

export const POST = withAuth(async ({ user, request }) => {
  const bank = await AccountingController.createBank(user, await request.json());
  return NextResponse.json({ bank }, { status: 201 });
});
