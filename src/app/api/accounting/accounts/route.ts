import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { AccountingController } from "@/server/controllers/accounting.controller";

export const GET = withAuth(async () => {
  const accounts = await AccountingController.listAccounts();
  return NextResponse.json({ accounts });
});

export const POST = withAuth(async ({ user, request }) => {
  const account = await AccountingController.createAccount(user, await request.json());
  return NextResponse.json({ account }, { status: 201 });
});
