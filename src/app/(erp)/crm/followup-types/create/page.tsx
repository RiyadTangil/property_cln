import { CrmFollowupTypeForm } from "@/components/crm/CrmFollowupTypesClient";

export const dynamic = "force-dynamic";

export default async function CrmFollowupTypesCreatePage() {
  return <CrmFollowupTypeForm mode="create" />;
}
