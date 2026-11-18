import { EquipmentOpsClient } from "@/components/equipment/EquipmentOpsClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentMaintenanceDuePage() {
  const data = await EquipmentService.getRegisterPageData();
  return <EquipmentOpsClient kind="maintenance-due" rows={data.equipments as unknown as Record<string, unknown>[]} equipments={data.equipments} projects={data.projects} />;
}
