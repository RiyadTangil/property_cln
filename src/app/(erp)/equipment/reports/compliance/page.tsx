import { EquipmentReportsClient } from "@/components/equipment/EquipmentReportsClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentReportCompliancePage() {
  const [data, ops] = await Promise.all([EquipmentService.getDashboardData(), EquipmentService.getSubModulePageData("operators")]);
  return <EquipmentReportsClient kind="compliance" {...data} operators={ops.rows as unknown as Array<{ id: number; equipmentId: number | null; employeeName: string; certificationType: string; licenceNo: string | null; expiresOn: string | null }>} />;
}
