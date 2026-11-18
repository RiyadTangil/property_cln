import { CrmService } from "@/server/services/crm.service";
import { CrmAssignmentRuleForm } from "@/components/crm/CrmDistributionClient";

export const dynamic = "force-dynamic";

export default async function CrmAssignmentRulesCreatePage() {
  const { departments, users, branches } = await CrmService.getAssignmentRulesPageData();
  return <CrmAssignmentRuleForm departments={departments} users={users} branches={branches} />;
}
