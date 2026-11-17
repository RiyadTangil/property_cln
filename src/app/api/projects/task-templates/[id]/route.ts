import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ProjectsController } from "@/server/controllers/projects.controller";
import { ProjectsService } from "@/server/services/projects.service";

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const row = await ProjectsController.updateTaskTemplate(user, Number(params.id), await request.json());
  return NextResponse.json({ taskTemplate: row });
});
export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await ProjectsService.deleteTaskTemplate(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
