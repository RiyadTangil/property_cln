import { requireUser } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings.service";
import CodeSequencesClient from "@/components/settings/CodeSequencesClient";

export const dynamic = "force-dynamic";

export default async function CodeSequencesPage() {
  await requireUser();
  const { companyName, companyCode, sequences } =
    await SettingsService.getCodeSequencesPageData();

  return (
    <CodeSequencesClient
      companyName={companyName}
      companyCode={companyCode}
      sequences={sequences}
    />
  );
}
