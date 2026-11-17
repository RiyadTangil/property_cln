import { csvResponse, withAuth } from "@/server/http/api-handler";
import { LandController } from "@/server/controllers/land.controller";

export const GET = withAuth(async () => {
  const owners = await LandController.listOwners();
  return csvResponse(
    "landowners.csv",
    ["Code", "Kind", "Name", "NID", "TIN", "Father Name", "Phone", "District", "Bank", "Account No", "Status"],
    owners.map((o) => [
      o.code,
      o.kind,
      o.name,
      o.nid,
      o.tin,
      o.fatherName,
      o.phone,
      o.district,
      o.bankName,
      o.bankAccountNo,
      o.isActive ? "Active" : "Inactive",
    ])
  );
});
