import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ContractorsService } from "@/server/services/contractors.service";

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await ContractorsService.deleteContractor(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
