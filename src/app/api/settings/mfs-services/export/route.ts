import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await prisma.mfsService.findMany({ orderBy: { id: "asc" } });
  const csv = toCsv(
    ["Name", "Short Name", "Account Name", "Wallet / Merchant No", "Account Type", "Status"],
    services.map((s) => [
      s.name,
      s.shortName,
      s.accountName,
      s.accountNumber,
      s.accountType,
      s.isActive ? "Active" : "Inactive",
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mfs-services.csv"',
    },
  });
}
