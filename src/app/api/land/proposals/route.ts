import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatCode } from "@/lib/csv";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const proposals = await prisma.landProposal.findMany({
    include: { parcel: true },
    orderBy: { id: "desc" },
  });
  return NextResponse.json({ proposals });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parcelId = Number(body.parcelId);
    const proposalDate = String(body.proposalDate ?? "").trim();
    const ratePerKatha = Number(body.ratePerKatha);
    const totalValue = Number(body.totalValue);
    const status = String(body.status ?? "submitted").trim();
    const remarks = body.remarks ? String(body.remarks).trim() : null;

    if (!parcelId || !proposalDate || !Number.isFinite(totalValue) || totalValue <= 0) {
      return NextResponse.json(
        { error: "Land parcel, proposal date, and positive total value are required." },
        { status: 400 }
      );
    }

    const last = await prisma.landProposal.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
    const code = formatCode("PRP", (last?.id ?? 0) + 1);

    const proposal = await prisma.landProposal.create({
      data: {
        code,
        parcelId,
        proposalDate,
        ratePerKatha: Number.isFinite(ratePerKatha) ? ratePerKatha : 0,
        totalValue,
        status,
        remarks,
      },
      include: { parcel: true },
    });

    if (status === "approved") {
      await prisma.landParcel.update({
        where: { id: parcelId },
        data: { stage: "proposal_approved" },
      });
    } else if (status === "submitted" || status === "under_review") {
      await prisma.landParcel.update({
        where: { id: parcelId },
        data: { stage: "proposal_submitted" },
      });
    }

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (err) {
    console.error("Create proposal error:", err);
    return NextResponse.json({ error: "Failed to raise proposal." }, { status: 500 });
  }
}
