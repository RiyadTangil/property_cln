import { NextResponse } from "next/server";
import { withAuth, optStr, reqStr, optNum } from "@/server/http/api-handler";
import { ProjectsService } from "@/server/services/projects.service";

export const POST = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const b = (await request.json()) as Record<string, unknown>;
  const task = await ProjectsService.createProjectTask(user, Number(params.id), {
    parentId: optNum(b.parent_id ?? b.parentId),
    title: reqStr(b.title),
    category: optStr(b.category),
    status: optStr(b.status) ?? "new",
    assigneeNames: optStr(b.assignee_names ?? b.assigneeNames),
    startDate: optStr(b.start_date ?? b.startDate),
    dueDate: optStr(b.due_date ?? b.dueDate),
    color: optStr(b.color),
    description: optStr(b.description),
    estimatedCost: optNum(b.estimated_cost ?? b.estimatedCost) ?? 0,
  });
  return NextResponse.json({ task }, { status: 201 });
});

export const PATCH = withAuth(async ({ user, request }) => {
  const b = (await request.json()) as Record<string, unknown>;
  const task = await ProjectsService.updateProjectTask(user, Number(b.taskId), reqStr(b.status));
  return NextResponse.json({ task });
});

export const DELETE = withAuth(async ({ user, request }) => {
  const b = (await request.json()) as Record<string, unknown>;
  await ProjectsService.deleteProjectTask(user, Number(b.taskId));
  return NextResponse.json({ ok: true });
});
