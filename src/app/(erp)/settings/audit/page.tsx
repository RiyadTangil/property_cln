import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const search = (searchParams.search ?? "").trim();
  const event = (searchParams.event ?? "").trim();
  const type = (searchParams.type ?? "").trim();
  const userId = (searchParams.user_id ?? "").trim();
  const from = (searchParams.from ?? "").trim();
  const to = (searchParams.to ?? "").trim();

  const [logs, distinctRows] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        ...(event ? { event } : {}),
        ...(type ? { recordType: type } : {}),
        ...(userId ? { userName: userId } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { recordTitle: { contains: search } },
                { recordType: { contains: search } },
                { userName: { contains: search } },
                { fieldsList: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { id: "desc" },
      take: 150,
    }),
    prisma.auditLog.findMany({
      select: { recordType: true, userName: true },
    }),
  ]);

  const recordTypes = Array.from(new Set(distinctRows.map((r) => r.recordType))).sort();
  const users = Array.from(new Set(distinctRows.map((r) => r.userName))).sort();

  return (
    <AuditClient
      logs={logs.map((l) => ({
        id: l.id,
        userName: l.userName,
        ipAddress: l.ipAddress,
        event: l.event,
        recordTitle: l.recordTitle,
        recordType: l.recordType,
        fieldsCount: l.fieldsCount,
        fieldsList: l.fieldsList,
        whenLabel: l.whenLabel,
        createdAt: l.createdAt.toLocaleString("en-GB"),
      }))}
      recordTypes={recordTypes}
      users={users}
      filters={{ search, event, type, user_id: userId, from, to }}
    />
  );
}
