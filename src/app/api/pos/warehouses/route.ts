import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { PosController } from "@/server/controllers/pos.controller";

export const GET = withAuth(async () => {
  const warehouses = await PosController.listWarehouses();
  return NextResponse.json({ warehouses });
});

export const POST = withAuth(async ({ user, request }) => {
  const warehouse = await PosController.createWarehouse(user, await request.json());
  return NextResponse.json({ warehouse }, { status: 201 });
});
