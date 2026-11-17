import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { AccountingController } from "@/server/controllers/accounting.controller";

export const GET = withAuth(async () => {
  const heads = await AccountingController.listHeads();
  return NextResponse.json({ heads });
});

export const POST = withAuth(async ({ user, request }) => {
  const head = await AccountingController.createHead(user, await request.json());
  return NextResponse.json({ head }, { status: 201 });
});
