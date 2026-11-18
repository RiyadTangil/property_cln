import HrPayrollClient from "@/components/hr/HrPayrollClient";
import { HrService } from "@/server/services/hr.service";

export const dynamic = "force-dynamic";

export default async function HrPayrollDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await HrService.getPayrollDetailData(Number(params.id) || 1);
  return <HrPayrollClient mode="detail" {...data} />;
}
