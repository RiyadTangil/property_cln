import { EquipmentDashboardClient } from "@/components/equipment/EquipmentDashboardClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentDashboardPage() {
  const data = await EquipmentService.getDashboardData();
  return <EquipmentDashboardClient {...data} />;
}
