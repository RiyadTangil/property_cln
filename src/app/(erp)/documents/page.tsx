import { requireUser } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings.service";
import DocumentsClient from "@/components/settings/DocumentsClient";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { search?: string; documentable_type?: string; expiry?: string };
}) {
  await requireUser();
  const { documents, filters } = await SettingsService.getDocumentsPageData(searchParams);

  return <DocumentsClient documents={documents} filters={filters} />;
}
