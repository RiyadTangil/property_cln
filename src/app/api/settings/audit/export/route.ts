import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.auditLog.findMany({ orderBy: { id: "desc" } });
  const csv = toCsv(
    ["When", "User", "IP", "Event", "Record", "Model", "Fields Count", "Fields"],
    logs.map((l) => [l.whenLabel, l.userName, l.ipAddress, l.event, l.recordTitle, l.recordType, l.fieldsCount, l.fieldsList])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="audit-trail.csv"',
    },
  });
}
