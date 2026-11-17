import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ProjectsController } from "@/server/controllers/projects.controller";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const row = await ProjectsController.updateType(user, Number(params.id), await request.json());
  return NextResponse.json({ projectType: row });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await ProjectsController.deleteType(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
