import HrPayrollClient from "@/components/hr/HrPayrollClient";
import { HrService } from "@/server/services/hr.service";

export const dynamic = "force-dynamic";

export default async function HrPayrollPage() {
  const data = await HrService.getPayrollPageData();
  return <HrPayrollClient mode="list" {...data} />;
}
