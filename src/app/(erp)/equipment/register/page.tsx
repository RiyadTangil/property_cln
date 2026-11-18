import { EquipmentRegisterClient } from "@/components/equipment/EquipmentRegisterClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentRegisterPage() {
  const data = await EquipmentService.getRegisterPageData();
  return <EquipmentRegisterClient {...data} />;
}
