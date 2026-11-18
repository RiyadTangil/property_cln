import { EquipmentOpsClient } from "@/components/equipment/EquipmentOpsClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentInspectionsPage() {
  const data = await EquipmentService.getSubModulePageData("inspections");
  return <EquipmentOpsClient kind="inspections" rows={data.rows as unknown as Record<string, unknown>[]} equipments={data.equipments} projects={data.projects} />;
}
