import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { sqftToKatha } from "@/lib/land";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parcels = await prisma.landParcel.findMany({
    where: { stage: { in: ["owned", "registered"] } },
    include: { project: true },
    orderBy: { id: "desc" },
  });

  const csv = toCsv(
    ["Code", "Working Name", "Mouza", "District", "Land Type", "Area (katha)", "Area (sft)", "Book Value", "Stage", "Allocated Project"],
    parcels.map((p) => [
      p.code,
      p.title,
      p.mouza,
      p.district,
      p.landType,
      sqftToKatha(p.areaSqft),
      p.areaSqft,
      p.bookValue,
      p.stage,
      p.project?.name ?? "Unallocated",
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="land-bank.csv"',
    },
  });
}
