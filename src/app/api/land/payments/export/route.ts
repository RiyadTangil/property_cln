import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.landPayment.findMany({
    include: { parcel: true, owner: true },
    orderBy: { id: "desc" },
  });

  const csv = toCsv(
    ["Voucher No", "Parcel", "Owner", "Direction", "Type", "Date", "Gross", "AIT", "Other Ded.", "Net", "Method", "Status"],
    payments.map((p) => [
      p.voucherNo,
      p.parcel.code,
      p.owner?.name ?? "",
      p.direction,
      p.type,
      p.paymentDate,
      p.grossAmount,
      p.taxDeducted,
      p.otherDeduction,
      p.netAmount,
      p.method,
      p.status,
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="land-payments.csv"',
    },
  });
}
