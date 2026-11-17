import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { PosController } from "@/server/controllers/pos.controller";

export const GET = withAuth(async () => {
  const categories = await PosController.listCategories();
  return NextResponse.json({ categories });
});

export const POST = withAuth(async ({ user, request }) => {
  const category = await PosController.createCategory(user, await request.json());
  return NextResponse.json({ category }, { status: 201 });
});
