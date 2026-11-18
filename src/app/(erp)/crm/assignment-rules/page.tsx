import { CrmService } from "@/server/services/crm.service";
import { CrmAssignmentRulesList } from "@/components/crm/CrmDistributionClient";

export const dynamic = "force-dynamic";

export default async function CrmAssignmentRulesPage() {
  const { rules, departments, users } = await CrmService.getAssignmentRulesPageData();
  return <CrmAssignmentRulesList initialItems={rules} departments={departments} users={users} />;
}
