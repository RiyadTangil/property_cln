import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ConstructionService } from "@/server/services/construction.service";

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await ConstructionService.deleteBoq(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
