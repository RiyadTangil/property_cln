import { ContractorsService } from "@/server/services/contractors.service";
import { ContractorsClient } from "@/components/contractors/ContractorsClient";

export const dynamic = "force-dynamic";

export default async function ContractorsPage() {
  const { contractors } = await ContractorsService.getContractorsPageData();
  return <ContractorsClient contractors={contractors} />;
}
