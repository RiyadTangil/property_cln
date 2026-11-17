import { csvResponse, withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth(async () => {
  const payments = await LandController.listPayments();
  return csvResponse(
    "land-payments.csv",
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
});
