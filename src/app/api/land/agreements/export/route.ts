import { csvResponse, withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth(async () => {
  const agreements = await LandController.listAgreements();
  return csvResponse(
    "land-agreements.csv",
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
});
