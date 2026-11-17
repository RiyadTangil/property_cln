import { requireUser } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings.service";
import AuditClient from "@/components/settings/AuditClient";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    event?: string;
    type?: string;
    user_id?: string;
    from?: string;
    to?: string;
  };
}) {
  await requireUser();
  const { logs, recordTypes, users, filters } =
    await SettingsService.getAuditPageData(searchParams);

  return (
    <AuditClient
      logs={logs}
      recordTypes={recordTypes}
      users={users}
      filters={filters}
    />
  );
}
