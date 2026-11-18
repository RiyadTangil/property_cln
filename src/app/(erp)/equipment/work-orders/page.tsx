import { EquipmentOpsClient } from "@/components/equipment/EquipmentOpsClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentWorkOrdersPage() {
  const data = await EquipmentService.getSubModulePageData("work-orders");
  return <EquipmentOpsClient kind="work-orders" rows={data.rows as unknown as Record<string, unknown>[]} equipments={data.equipments} projects={data.projects} />;
}
