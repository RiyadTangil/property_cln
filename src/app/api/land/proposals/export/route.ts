import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const proposals = await prisma.landProposal.findMany({
    include: { parcel: true },
    orderBy: { id: "desc" },
  });

  const csv = toCsv(
    ["Code", "Parcel Code", "Parcel Mouza", "Proposal Date", "Rate/Katha", "Total Value", "Status"],
    proposals.map((p) => [
      p.code,
      p.parcel.code,
      p.parcel.mouza,
      p.proposalDate,
      p.ratePerKatha,
      p.totalValue,
      p.status,
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="land-proposals.csv"',
    },
  });
}
