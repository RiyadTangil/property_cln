import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();
  const status = String(body.status ?? "").trim();

  const proposal = await prisma.landProposal.update({
    where: { id },
    data: { status },
  });

  if (status === "approved") {
    await prisma.landParcel.update({
      where: { id: proposal.parcelId },
      data: { stage: "proposal_approved" },
    });
  } else if (status === "submitted") {
    await prisma.landParcel.update({
      where: { id: proposal.parcelId },
      data: { stage: "proposal_submitted" },
    });
  }

  return NextResponse.json({ proposal });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  await prisma.landProposal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
