import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppSettingsClient from "@/components/settings/AppSettingsClient";

export const dynamic = "force-dynamic";

export default async function ApplicationSettingsPage() {
  await requireUser();
  const s = await prisma.appSetting.findFirst();

  return (
    <AppSettingsClient
      initial={{
        appName: s?.appName ?? "e-Hishabi ERP",
        appTagline: s?.appTagline ?? "Real Estate & Development Suite",
        footerText: s?.footerText ?? "",
        contactEmail: s?.contactEmail ?? "info@ehishabi.com",
        contactPhone: s?.contactPhone ?? "",
        website: s?.website ?? "https://erp.ehishabi.com",
        contactAddress: s?.contactAddress ?? "",
        primaryColor: s?.primaryColor ?? "#00c292",
      }}
    />
  );
}
