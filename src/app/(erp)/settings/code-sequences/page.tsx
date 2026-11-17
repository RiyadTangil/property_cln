import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CodeSequencesClient from "@/components/settings/CodeSequencesClient";

export const dynamic = "force-dynamic";

export default async function CodeSequencesPage() {
  await requireUser();

  const [company, sequences] = await Promise.all([
    prisma.company.findFirst({ orderBy: { id: "asc" } }),
    prisma.codeSequence.findMany({ orderBy: { label: "asc" } }),
  ]);

  return (
    <CodeSequencesClient
      companyName={company?.name ?? "E-Hishabi ERP"}
      companyCode={company?.code ?? "HQ"}
      sequences={sequences.map((s) => ({
        id: s.id,
        key: s.key,
        label: s.label,
        prefix: s.prefix,
        suffix: s.suffix,
        separator: s.separator,
        padding: s.padding,
        nextNumber: s.nextNumber,
        yearInCode: s.yearInCode,
        resetYearly: s.resetYearly,
      }))}
    />
  );
}
