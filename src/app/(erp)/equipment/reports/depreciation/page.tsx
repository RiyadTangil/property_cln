import { EquipmentReportsClient } from "@/components/equipment/EquipmentReportsClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentReportDepreciationPage() {
  const data = await EquipmentService.getDashboardData();
  return <EquipmentReportsClient kind="depreciation" {...data} />;
}
