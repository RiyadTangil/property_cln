import { EquipmentReportsClient } from "@/components/equipment/EquipmentReportsClient";
import { EquipmentService } from "@/server/services/equipment.service";

export const dynamic = "force-dynamic";

export default async function EquipmentReportProjectCostPage() {
  const [data, reg] = await Promise.all([EquipmentService.getDashboardData(), EquipmentService.getRegisterPageData()]);
  return <EquipmentReportsClient kind="project-cost" {...data} projects={reg.projects} />;
}
