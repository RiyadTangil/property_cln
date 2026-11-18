import { CrmService } from "@/server/services/crm.service";
import { CrmCustomersList } from "@/components/crm/CrmCustomersClient";

export const dynamic = "force-dynamic";

export default async function CrmCustomersPage() {
  const { customers, users } = await CrmService.getCustomersPageData();
  return <CrmCustomersList initialItems={customers} users={users} />;
}
