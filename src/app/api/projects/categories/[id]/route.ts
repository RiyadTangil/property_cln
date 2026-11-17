import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ProjectsController } from "@/server/controllers/projects.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const row = await ProjectsController.updateCategory(user, Number(params.id), await request.json());
  return NextResponse.json({ category: row });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await ProjectsController.deleteCategory(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
