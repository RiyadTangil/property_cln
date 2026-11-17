import { requireUser } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings.service";
import InvoiceTemplatesClient from "@/components/settings/InvoiceTemplatesClient";

export const dynamic = "force-dynamic";

export default async function InvoiceTemplatesPage() {
  await requireUser();
  const { templates } = await SettingsService.getInvoiceTemplatesPageData();

  return <InvoiceTemplatesClient templates={templates} />;
}
