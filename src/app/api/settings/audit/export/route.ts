import { csvResponse, withAuth } from "@/server/http/api-handler";
import { SettingsController } from "@/server/controllers/settings.controller";

export const GET = withAuth(async () => {
  const logs = await SettingsController.listAuditLogs();
  return csvResponse(
    "audit-trail.csv",
    ["When", "User", "IP", "Event", "Record", "Model", "Fields Count", "Fields"],
    logs.map((l) => [l.whenLabel, l.userName, l.ipAddress, l.event, l.recordTitle, l.recordType, l.fieldsCount, l.fieldsList])
  );
});
