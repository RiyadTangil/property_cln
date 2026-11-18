import { EquipmentDetailClient } from "@/components/equipment/EquipmentDetailClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const { equipment } = await EquipmentService.getEquipmentDetailData(Number(params.id));
  return <EquipmentDetailClient equipment={equipment} />;
}
