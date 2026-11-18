import { EquipmentOpsClient } from "@/components/equipment/EquipmentOpsClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentUsagePage() {
  const data = await EquipmentService.getSubModulePageData("usage");
  return <EquipmentOpsClient kind="usage" rows={data.rows as unknown as Record<string, unknown>[]} equipments={data.equipments} projects={data.projects} />;
}
