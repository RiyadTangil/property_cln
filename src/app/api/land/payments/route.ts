import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatCode } from "@/lib/csv";
import { PAYMENT_TYPES } from "@/lib/land";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payments = await prisma.landPayment.findMany({
    include: { parcel: true, owner: true, agreement: true },
    orderBy: { id: "desc" },
  });
  return NextResponse.json({ payments });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parcelId = Number(body.parcelId);
    const ownerId = body.ownerId ? Number(body.ownerId) : null;
    const agreementId = body.agreementId ? Number(body.agreementId) : null;
    const type = String(body.type ?? "advance").trim();
    const paymentDate = String(body.paymentDate ?? body.payment_date ?? "").trim();
    const grossAmount = Number(body.grossAmount ?? body.gross_amount);
    const taxDeducted = Number(body.taxDeducted ?? body.tax_deducted ?? 0);
    const otherDeduction = Number(body.otherDeduction ?? body.other_deduction ?? 0);
    const method = String(body.method ?? "bank_transfer").trim();
    const status = String(body.status ?? "posted").trim();

    if (!parcelId || !paymentDate || !Number.isFinite(grossAmount) || grossAmount <= 0) {
      return NextResponse.json(
        { error: "Land parcel, payment date, and positive gross amount are required." },
        { status: 400 }
      );
    }

    if (method === "cheque" && !String(body.chequeNo ?? body.cheque_no ?? "").trim()) {
      return NextResponse.json(
        { error: "Cheque No. is required for cheque payments." },
        { status: 400 }
      );
    }

    const typeMeta = PAYMENT_TYPES.find((t) => t.value === type);
    const direction = typeMeta?.direction ?? "payout";
    const netAmount = Math.max(
      0,
      Number((grossAmount - (Number.isFinite(taxDeducted) ? taxDeducted : 0) - (Number.isFinite(otherDeduction) ? otherDeduction : 0)).toFixed(2))
    );

    const last = await prisma.landPayment.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
    const voucherNo = formatCode("LPV", (last?.id ?? 0) + 1);
    const optStr = (v: unknown) => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    };

    const payment = await prisma.landPayment.create({
      data: {
        voucherNo,
        parcelId,
        ownerId,
        agreementId,
        direction,
        type,
        paymentDate,
        grossAmount,
        taxDeducted: Number.isFinite(taxDeducted) ? taxDeducted : 0,
        otherDeduction: Number.isFinite(otherDeduction) ? otherDeduction : 0,
        netAmount,
        method,
        accountName: optStr(body.accountName ?? body.account_name),
        bankName: optStr(body.bankName ?? body.bank_name),
        chequeNo: optStr(body.chequeNo ?? body.cheque_no),
        chequeDate: optStr(body.chequeDate ?? body.cheque_date),
        transactionReference: optStr(body.transactionReference ?? body.transaction_reference),
        narration: optStr(body.narration),
        status,
      },
      include: { parcel: true, owner: true },
    });

    if (status === "posted" && direction === "payout") {
      const nextStage = type === "final_settlement" ? "owned" : "payment_in_progress";
      await prisma.landParcel.update({
        where: { id: parcelId },
        data: {
          bookValue: { increment: grossAmount },
          stage: nextStage,
        },
      });
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (err) {
    console.error("Create payment error:", err);
    return NextResponse.json({ error: "Failed to save payment voucher." }, { status: 500 });
  }
}
