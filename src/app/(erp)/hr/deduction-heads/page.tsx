import HrCompensationClient from "@/components/hr/HrCompensationClient";
import { HrService } from "@/server/services/hr.service";

export const dynamic = "force-dynamic";

export default async function HrDeductionHeadsPage() {
  const data = await HrService.getDeductionHeadsPageData();
  return <HrCompensationClient mode="deduction-heads" {...data} />;
}
