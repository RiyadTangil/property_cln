import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ProjectsController } from "@/server/controllers/projects.controller";
import { ProjectsService } from "@/server/services/projects.service";

export const GET = withAuth<{ id: string }>(async ({ params }) => {
  const data = await ProjectsService.getBuildingDetailData(Number(params.id));
  return NextResponse.json(data);
});

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const row = await ProjectsController.updateBuilding(user, Number(params.id), await request.json());
  return NextResponse.json({ building: row });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await ProjectsController.deleteBuilding(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
