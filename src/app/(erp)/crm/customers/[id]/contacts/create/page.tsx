import { notFound } from "next/navigation";
import { CrmService } from "@/server/services/crm.service";
import { CrmContactCreateForm } from "@/components/crm/CrmCustomersClient";

export const dynamic = "force-dynamic";

export default async function CrmCustomerContactCreatePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();
  try {
    const { customer } = await CrmService.getCustomerDetailData(id);
    return <CrmContactCreateForm customer={customer} />;
  } catch {
    notFound();
  }
}
