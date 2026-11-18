import { EquipmentOpsClient } from "@/components/equipment/EquipmentOpsClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentOperatorsPage() {
  const data = await EquipmentService.getSubModulePageData("operators");
  return <EquipmentOpsClient kind="operators" rows={data.rows as unknown as Record<string, unknown>[]} equipments={data.equipments} projects={data.projects} />;
}
