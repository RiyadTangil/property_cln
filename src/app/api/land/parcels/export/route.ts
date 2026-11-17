import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parcels = await prisma.landParcel.findMany({
    include: { project: true },
    orderBy: { id: "desc" },
  });

  const csv = toCsv(
    ["Code", "Title", "Land Type", "Stage", "Mouza", "JL No", "District", "Area", "Unit", "Area (sft)", "Book Value", "Project"],
    parcels.map((p) => [
      p.code,
      p.title,
      p.landType,
      p.stage,
      p.mouza,
      p.jlNo,
      p.district,
      p.areaValue,
      p.areaUnit,
      p.areaSqft,
      p.bookValue,
      p.project?.name ?? "",
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="land-parcels.csv"',
    },
  });
}
