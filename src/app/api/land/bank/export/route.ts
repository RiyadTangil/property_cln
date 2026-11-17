import { sqftToKatha } from "@/lib/land";
import { csvResponse, withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth(async () => {
  const parcels = await LandController.listBankParcels();
  return csvResponse(
    "land-bank.csv",
    ["Code", "Working Name", "Mouza", "District", "Land Type", "Area (katha)", "Area (sft)", "Book Value", "Stage", "Allocated Project"],
    parcels.map((p) => [
      p.code,
      p.title,
      p.mouza,
      p.district,
      p.landType,
      sqftToKatha(p.areaSqft),
      p.areaSqft,
      p.bookValue,
      p.stage,
      p.project?.name ?? "Unallocated",
    ])
  );
});
