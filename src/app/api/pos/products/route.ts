import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { PosController } from "@/server/controllers/pos.controller";

export const GET = withAuth(async () => {
  const products = await PosController.listProducts();
  return NextResponse.json({ products });
});

export const POST = withAuth(async ({ user, request }) => {
  const product = await PosController.createProduct(user, await request.json());
  return NextResponse.json({ product }, { status: 201 });
});
