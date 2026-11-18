import { notFound } from "next/navigation";
import { CrmService } from "@/server/services/crm.service";
import { CrmCustomerDetail } from "@/components/crm/CrmCustomersClient";

export const dynamic = "force-dynamic";

export default async function CrmCustomerDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();
  try {
    const { customer, followups, branches, users } = await CrmService.getCustomerDetailData(id);
    return (
      <CrmCustomerDetail
        customer={customer}
        followups={followups}
        branches={branches}
        users={users}
      />
    );
  } catch {
    notFound();
  }
}
