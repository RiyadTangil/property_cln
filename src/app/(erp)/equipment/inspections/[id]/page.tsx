import { notFound } from "next/navigation";
import { EquipmentInspectionDetailClient } from "@/components/equipment/EquipmentOpsDetailClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentInspectionDetailPage({ params }: { params: { id: string } }) {
  const data = await EquipmentService.getSubModulePageData("inspections");
  const inspection = (data.rows as unknown as Array<{
    id: number;
    code: string;
    equipmentId: number;
    inspectionType: string;
    inspectionDate: string;
    nextInspectionDue: string | null;
    inspectorName: string | null;
    result: string;
    findings: string | null;
    equipment: { code: string; name: string } | null;
  }>).find((r) => r.id === Number(params.id));
  if (!inspection) notFound();
  return <EquipmentInspectionDetailClient inspection={{ ...inspection, equipment: inspection.equipment ? { id: inspection.equipmentId, ...inspection.equipment } : null }} />;
}
