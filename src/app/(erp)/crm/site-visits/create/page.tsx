import { CrmService } from "@/server/services/crm.service";
import { CrmSiteVisitForm } from "@/components/crm/CrmSiteVisitsClient";

export const dynamic = "force-dynamic";

export default async function CrmSiteVisitsCreatePage() {
  const { customers, projects, users, branches } = await CrmService.getSiteVisitsPageData();
  return (
    <CrmSiteVisitForm
      customers={customers}
      projects={projects}
      users={users}
      branches={branches}
    />
  );
}
