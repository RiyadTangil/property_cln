import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ProjectsController } from "@/server/controllers/projects.controller";
import { ProjectsService } from "@/server/services/projects.service";

export const GET = withAuth(async () => NextResponse.json(await ProjectsService.getTaskTemplatesPageData()));
export const POST = withAuth(async ({ user, request }) => {
  const row = await ProjectsController.createTaskTemplate(user, await request.json());
  return NextResponse.json({ taskTemplate: row }, { status: 201 });
});
