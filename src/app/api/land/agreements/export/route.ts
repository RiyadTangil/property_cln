import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agreements = await prisma.landAgreement.findMany({
    include: { parcel: true, owner: true },
    orderBy: { id: "desc" },
  });

  const csv = toCsv(
    ["Code", "Parcel Code", "Owner", "Type", "Status", "Agreement Date", "Expiry Date", "Agreed Price", "Advance"],
    agreements.map((a) => [
      a.code,
      a.parcel.code,
      a.owner?.name ?? "",
      a.type,
      a.status,
      a.agreementDate,
      a.expiryDate,
      a.agreedPrice,
      a.advanceAmount,
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="land-agreements.csv"',
    },
  });
}
