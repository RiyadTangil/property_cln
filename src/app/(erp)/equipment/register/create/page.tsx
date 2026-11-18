import { EquipmentFormClient } from "@/components/equipment/EquipmentFormClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentCreatePage() {
  const { categories, projects } = await EquipmentService.getRegisterPageData();
  return <EquipmentFormClient categories={categories} projects={projects} />;
}
