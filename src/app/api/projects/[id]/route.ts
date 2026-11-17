import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ProjectsController } from "@/server/controllers/projects.controller";
import { ProjectsService } from "@/server/services/projects.service";

export const GET = withAuth<{ id: string }>(async ({ params }) => {
  const data = await ProjectsService.getProjectDetailData(Number(params.id));
  return NextResponse.json(data);
});

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const row = await ProjectsController.updateProject(user, Number(params.id), await request.json());
  return NextResponse.json({ project: row });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await ProjectsController.deleteProject(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
