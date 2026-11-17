import { csvResponse, withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth(async () => {
  const parcels = await LandController.listParcels();
  return csvResponse(
    "land-parcels.csv",
    ["Code", "Title", "Land Type", "Stage", "Mouza", "JL No", "District", "Area", "Unit", "Area (sft)", "Book Value", "Project"],
    parcels.map((p) => [
      p.code,
      p.title,
      p.landType,
      p.stage,
      p.mouza,
      p.jlNo,
      p.district,
      p.areaValue,
      p.areaUnit,
      p.areaSqft,
      p.bookValue,
      p.project?.name ?? "",
    ])
  );
});
