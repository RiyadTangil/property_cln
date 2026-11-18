import OwnersClient, { type PropertyOwnerItem } from "@/components/sales/OwnersClient";
import { SalesService } from "@/server/services/sales.service";

export const dynamic = "force-dynamic";

const FALLBACK_OWNER: PropertyOwnerItem = {
  id: 1,
  code: "OWN-0001",
  name: "Abdul Aziz",
  nid: "34563456",
  tin: "745674567456",
  fatherName: "Abdul Goffar",
  motherName: "Samsunnahar",
  dateOfBirth: "1981-01-01",
  occupation: "Engineer",
  mobile: "6345634563",
  alternateMobile: "34634566654",
  email: "eee@mail.com",
  presentAddress: null,
  permanentAddress: null,
  notes: null,
  isActive: true,
};

export default async function OwnerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let owner = FALLBACK_OWNER;
  try {
    const res = await SalesService.getOwnerDetailData(Number(params.id));
    owner = res.owner;
  } catch {
    const list = await SalesService.getOwnersPageData();
    if (list.owners[0]) owner = list.owners[0];
  }
  return <OwnersClient view="owners_detail" owner={owner} />;
}
