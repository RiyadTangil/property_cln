import { EquipmentReportsClient } from "@/components/equipment/EquipmentReportsClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentReportCostsPage() {
  const data = await EquipmentService.getDashboardData();
  return <EquipmentReportsClient kind="costs" {...data} />;
}
