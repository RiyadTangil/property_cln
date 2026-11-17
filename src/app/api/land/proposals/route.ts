import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth(async () => {
  const proposals = await LandController.listProposals();
  return NextResponse.json({ proposals });
});

export const POST = withAuth(async ({ user, request }) => {
  const proposal = await LandController.createProposal(user, await request.json());
  return NextResponse.json({ proposal }, { status: 201 });
});
