import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DocumentsClient from "@/components/settings/DocumentsClient";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { search?: string; documentable_type?: string; expiry?: string };
}) {
  await requireUser();
  const search = (searchParams.search ?? "").trim();
  const documentableType = (searchParams.documentable_type ?? "").trim();
  const expiry = (searchParams.expiry ?? "").trim();

  let docs = await prisma.documentRecord.findMany({
    where: {
      ...(documentableType ? { module: documentableType } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { category: { contains: search } },
              { uploadedBy: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { id: "desc" },
  });

  const now = new Date();
  if (expiry === "none") {
    docs = docs.filter((d) => !d.expiryDate);
  } else if (expiry === "expired") {
    docs = docs.filter((d) => d.expiryDate && new Date(d.expiryDate) < now);
  } else if (expiry === "expiring") {
    docs = docs.filter((d) => {
      if (!d.expiryDate) return false;
      const diff = (new Date(d.expiryDate).getTime() - now.getTime()) / 86400000;
      return diff >= 0 && diff <= 60;
    });
  }

  return (
    <DocumentsClient
      documents={docs.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        module: d.module,
        uploadedBy: d.uploadedBy,
        uploadedDate: d.uploadedDate,
        expiryDate: d.expiryDate,
        fileSize: d.fileSize,
        fileUrl: d.fileUrl,
      }))}
      filters={{ search, documentable_type: documentableType, expiry }}
    />
  );
}
