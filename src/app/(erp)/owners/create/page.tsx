import OwnersClient from "@/components/sales/OwnersClient";

export const dynamic = "force-dynamic";

export default async function OwnersCreatePage() {
  return <OwnersClient view="owners_create" />;
}
