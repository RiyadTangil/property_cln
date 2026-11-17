import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sequences = await prisma.codeSequence.findMany({ orderBy: { label: "asc" } });
  return NextResponse.json({ sequences });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await request.json();
  const id = Number(b.id);
  if (!id) return NextResponse.json({ error: "Sequence id required." }, { status: 400 });

  const updated = await prisma.codeSequence.update({
    where: { id },
    data: {
      label: String(b.label ?? "").trim() || undefined,
      prefix: String(b.prefix ?? "").trim(),
      suffix: String(b.suffix ?? "").trim(),
      separator: String(b.separator ?? "-"),
      padding: Math.max(1, Math.min(10, Number(b.padding ?? 4))),
      nextNumber: Math.max(1, Number(b.next_number ?? b.nextNumber ?? 1)),
      yearInCode: Boolean(b.year_in_code ?? b.yearInCode),
      resetYearly: Boolean(b.reset_yearly ?? b.resetYearly),
    },
  });

  await recordAudit(user.name, "updated", updated.label, "CodeSequence", ["prefix", "padding", "nextNumber"]);
  return NextResponse.json({ sequence: updated });
}
