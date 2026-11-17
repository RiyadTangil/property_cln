import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatCode } from "@/lib/csv";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agreements = await prisma.landAgreement.findMany({
    include: { parcel: true, owner: true },
    orderBy: { id: "desc" },
  });
  return NextResponse.json({ agreements });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parcelId = Number(body.parcelId);
    const ownerId = body.ownerId ? Number(body.ownerId) : null;
    const type = String(body.type ?? "sale_agreement").trim();
    const status = String(body.status ?? "active").trim();
    const agreementDate = String(body.agreementDate ?? "").trim();
    const expiryDate = body.expiryDate ? String(body.expiryDate).trim() : null;
    const agreedPrice = Number(body.agreedPrice);
    const advanceAmount = Number(body.advanceAmount ?? 0);
    const advanceSettled = Boolean(body.advanceSettled);
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!parcelId || !agreementDate || !Number.isFinite(agreedPrice) || agreedPrice <= 0) {
      return NextResponse.json(
        { error: "Land parcel, agreement date, and positive agreed price are required." },
        { status: 400 }
      );
    }

    const last = await prisma.landAgreement.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
    const code = formatCode("AGR", (last?.id ?? 0) + 1);

    const agreement = await prisma.landAgreement.create({
      data: {
        code,
        parcelId,
        ownerId,
        type,
        status,
        agreementDate,
        expiryDate,
        agreedPrice,
        advanceAmount: Number.isFinite(advanceAmount) ? advanceAmount : 0,
        advanceSettled,
        notes,
      },
      include: { parcel: true, owner: true },
    });

    if (status === "active" || status === "completed") {
      await prisma.landParcel.update({
        where: { id: parcelId },
        data: { stage: "agreement_signed" },
      });
    }

    return NextResponse.json({ agreement }, { status: 201 });
  } catch (err) {
    console.error("Create agreement error:", err);
    return NextResponse.json({ error: "Failed to draft agreement." }, { status: 500 });
  }
}
