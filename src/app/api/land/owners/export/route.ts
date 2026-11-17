import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owners = await prisma.landOwner.findMany({ orderBy: { id: "desc" } });
  const csv = toCsv(
    ["Code", "Kind", "Name", "NID", "TIN", "Father Name", "Phone", "District", "Bank", "Account No", "Status"],
    owners.map((o) => [
      o.code,
      o.kind,
      o.name,
      o.nid,
      o.tin,
      o.fatherName,
      o.phone,
      o.district,
      o.bankName,
      o.bankAccountNo,
      o.isActive ? "Active" : "Inactive",
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="landowners.csv"',
    },
  });
}
