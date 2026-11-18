import { CrmService } from "@/server/services/crm.service";
import { CrmCustomerForm } from "@/components/crm/CrmCustomersClient";

export const dynamic = "force-dynamic";

export default async function CrmCustomersCreatePage() {
  const { branches, users } = await CrmService.getCommonRefs();
  return <CrmCustomerForm mode="create" branches={branches} users={users} />;
}
