import HrEmployeesClient from "@/components/hr/HrEmployeesClient";
import { HrService } from "@/server/services/hr.service";

export const dynamic = "force-dynamic";

export default async function HrEmployeesCreatePage() {
  const data = await HrService.getEmployeesPageData();
  return <HrEmployeesClient mode="create" {...data} />;
}
