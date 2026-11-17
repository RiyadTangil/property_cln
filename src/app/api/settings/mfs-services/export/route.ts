import { csvResponse, withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const GET = withAuth(async () => {
  const services = await SettingsController.listMfsServices();
  return csvResponse(
    "mfs-services.csv",
    ["Name", "Short Name", "Account Name", "Wallet / Merchant No", "Account Type", "Status"],
    services.map((s) => [
      s.name,
      s.shortName,
      s.accountName,
      s.accountNumber,
      s.accountType,
      s.isActive ? "Active" : "Inactive",
    ])
  );
});
