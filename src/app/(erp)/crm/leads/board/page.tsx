import { CrmService } from "@/server/services/crm.service";
import { CrmLeadsBoard } from "@/components/crm/CrmLeadsClient";

export const dynamic = "force-dynamic";

function strParam(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
}

export default async function CrmLeadsBoardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { leads, users, lostReasons } = await CrmService.getLeadsPageData();

  return (
    <CrmLeadsBoard
      initialLeads={leads}
      users={users}
      lostReasons={lostReasons}
      initialFilters={{
        search: strParam(searchParams?.search),
        source: strParam(searchParams?.source),
        priority: strParam(searchParams?.priority),
        owner_id: strParam(searchParams?.owner_id),
        due: strParam(searchParams?.due),
      }}
    />
  );
}
