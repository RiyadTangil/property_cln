import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth(async () => {
  const payments = await LandController.listPayments();
  return NextResponse.json({ payments });
});

export const POST = withAuth(async ({ user, request }) => {
  const payment = await LandController.createPayment(user, await request.json());
  return NextResponse.json({ payment }, { status: 201 });
});
