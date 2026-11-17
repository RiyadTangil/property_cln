import { csvResponse, withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth(async () => {
  const proposals = await LandController.listProposals();
  return csvResponse(
    "land-proposals.csv",
    ["Code", "Parcel Code", "Parcel Mouza", "Proposal Date", "Rate/Katha", "Total Value", "Status"],
    proposals.map((p) => [
      p.code,
      p.parcel.code,
      p.parcel.mouza,
      p.proposalDate,
      p.ratePerKatha,
      p.totalValue,
      p.status,
    ])
  );
});
