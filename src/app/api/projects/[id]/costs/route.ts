import { NextResponse } from "next/server";
import { withAuth, optStr, reqStr } from "@/server/http/api-handler";
import { ProjectsService } from "@/server/services/projects.service";

export const POST = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const b = (await request.json()) as Record<string, unknown>;
  const cost = await ProjectsService.createProjectCost(user, Number(params.id), {
    category: reqStr(b.category, "other"),
    costDate: reqStr(b.cost_date ?? b.costDate, new Date().toISOString().slice(0, 10)),
    amount: Number(b.amount ?? 0) || 0,
    notes: optStr(b.notes),
  });
  return NextResponse.json({ cost }, { status: 201 });
});
