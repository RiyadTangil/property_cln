import { CrmService } from "@/server/services/crm.service";
import { CrmSiteVisitsList } from "@/components/crm/CrmSiteVisitsClient";

export const dynamic = "force-dynamic";

export default async function CrmSiteVisitsPage() {
  const { visits, customers, projects, users, branches } =
    await CrmService.getSiteVisitsPageData();
  return (
    <CrmSiteVisitsList
      initialItems={visits}
      customers={customers}
      projects={projects}
      users={users}
      branches={branches}
    />
  );
}
