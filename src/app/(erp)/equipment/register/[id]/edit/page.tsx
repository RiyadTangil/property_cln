import { EquipmentFormClient } from "@/components/equipment/EquipmentFormClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentEditPage({ params }: { params: { id: string } }) {
  const { equipment, categories, projects } = await EquipmentService.getEquipmentDetailData(Number(params.id));
  return <EquipmentFormClient categories={categories} projects={projects} initial={equipment} />;
}
