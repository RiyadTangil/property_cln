import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ConstructionController } from "@/server/controllers/construction.controller";
import { ConstructionService } from "@/server/services/construction.service";

export const GET = withAuth(async () => NextResponse.json(await ConstructionService.getBoqsPageData()));
export const POST = withAuth(async ({ user, request }) => {
  const boq = await ConstructionController.createBoq(user, await request.json());
  return NextResponse.json({ boq }, { status: 201 });
});
