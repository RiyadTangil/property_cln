import HrEmployeesClient from "@/components/hr/HrEmployeesClient";
import { HrService } from "@/server/services/hr.service";

export const dynamic = "force-dynamic";

export default async function HrEmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await HrService.getEmployeeDetailData(Number(params.id) || 1);
  return <HrEmployeesClient mode="detail" {...data} />;
}
