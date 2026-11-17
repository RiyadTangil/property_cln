import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ProjectsController } from "@/server/controllers/projects.controller";
import { ProjectsService } from "@/server/services/projects.service";

export const GET = withAuth(async () => {
  const data = await ProjectsService.getTypesPageData();
  return NextResponse.json(data);
});

export const POST = withAuth(async ({ user, request }) => {
  const row = await ProjectsController.createType(user, await request.json());
  return NextResponse.json({ projectType: row }, { status: 201 });
});
