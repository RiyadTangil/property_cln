import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ProjectsService } from "@/server/services/projects.service";

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await ProjectsService.deleteEstimateTemplate(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
