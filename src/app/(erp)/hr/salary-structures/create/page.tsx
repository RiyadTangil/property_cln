import HrCompensationClient from "@/components/hr/HrCompensationClient";
import { HrService } from "@/server/services/hr.service";

export const dynamic = "force-dynamic";

export default async function HrSalaryStructuresCreatePage() {
  const data = await HrService.getSalaryStructuresPageData();
  return <HrCompensationClient mode="structure-create" {...data} />;
}
