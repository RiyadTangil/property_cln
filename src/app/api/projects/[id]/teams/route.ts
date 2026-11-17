import { NextResponse } from "next/server";
import { withAuth, optStr, reqStr } from "@/server/http/api-handler";
import { ProjectsService } from "@/server/services/projects.service";

export const POST = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const b = (await request.json()) as Record<string, unknown>;
  const team = await ProjectsService.createProjectTeam(user, Number(params.id), {
    name: reqStr(b.name),
    departmentName: optStr(b.department_name ?? b.departmentName),
    leadName: optStr(b.lead_name ?? b.leadName),
    type: optStr(b.type) ?? "site",
    memberNames: optStr(b.member_names ?? b.memberNames),
  });
  return NextResponse.json({ team }, { status: 201 });
});
