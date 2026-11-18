import HrPayrollClient from "@/components/hr/HrPayrollClient";
import { HrService } from "@/server/services/hr.service";

export const dynamic = "force-dynamic";

export default async function HrPayrollBonusPage() {
  const data = await HrService.getPayrollPageData();
  return <HrPayrollClient mode="bonus" {...data} />;
}
