import { notFound } from "next/navigation";
import { CrmService } from "@/server/services/crm.service";
import { CrmCustomerForm } from "@/components/crm/CrmCustomersClient";

export const dynamic = "force-dynamic";

export default async function CrmCustomerEditPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();
  try {
    const { customer, branches, users } = await CrmService.getCustomerDetailData(id);
    return (
      <CrmCustomerForm
        mode="edit"
        initialData={customer}
        branches={branches}
        users={users}
      />
    );
  } catch {
    notFound();
  }
}
