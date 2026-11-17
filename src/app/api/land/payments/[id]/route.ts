import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();
  const status = String(body.status ?? "").trim();

  const existing = await prisma.landPayment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payment = await prisma.landPayment.update({
    where: { id },
    data: { status },
  });

  if (existing.status !== "posted" && status === "posted" && existing.direction === "payout") {
    await prisma.landParcel.update({
      where: { id: existing.parcelId },
      data: {
        bookValue: { increment: existing.grossAmount },
        stage: existing.type === "final_settlement" ? "owned" : "payment_in_progress",
      },
    });
  }

  return NextResponse.json({ payment });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const existing = await prisma.landPayment.findUnique({ where: { id } });
  if (existing && existing.status === "posted" && existing.direction === "payout") {
    await prisma.landParcel.update({
      where: { id: existing.parcelId },
      data: { bookValue: { decrement: existing.grossAmount } },
    });
  }
  await prisma.landPayment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
