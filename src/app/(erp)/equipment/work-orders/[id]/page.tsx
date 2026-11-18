import { notFound } from "next/navigation";
import { EquipmentWorkOrderDetailClient } from "@/components/equipment/EquipmentOpsDetailClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentWorkOrderDetailPage({ params }: { params: { id: string } }) {
  const data = await EquipmentService.getSubModulePageData("work-orders");
  const wo = (data.rows as unknown as Array<{
    id: number;
    code: string;
    equipmentId: number;
    type: string;
    priority: string;
    symptoms: string;
    estimatedCost: number;
    status: string;
    equipment: { code: string; name: string } | null;
  }>).find((r) => r.id === Number(params.id));
  if (!wo) notFound();
  return <EquipmentWorkOrderDetailClient wo={{ ...wo, equipment: wo.equipment ? { id: wo.equipmentId, ...wo.equipment } : null }} />;
}
