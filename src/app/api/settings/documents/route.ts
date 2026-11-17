import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const documents = await prisma.documentRecord.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await request.json();
  const title = String(b.title ?? "").trim();
  const category = String(b.category ?? "general").trim();
  const moduleName = String(b.module ?? "project").trim();
  if (!title) {
    return NextResponse.json({ error: "Document Title is required." }, { status: 400 });
  }

  const doc = await prisma.documentRecord.create({
    data: {
      title,
      category,
      module: moduleName,
      uploadedBy: user.name,
      uploadedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      expiryDate: b.expiry_date?.trim() || null,
      fileSize: b.file_size?.trim() || "240 KB",
      fileUrl: b.file_url?.trim() || "#",
    },
  });

  await recordAudit(user.name, "created", doc.title, "DocumentRecord", ["title", "module"]);
  return NextResponse.json({ document: doc }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Document id required." }, { status: 400 });

  const deleted = await prisma.documentRecord.delete({ where: { id } });
  await recordAudit(user.name, "deleted", deleted.title, "DocumentRecord", ["id"]);
  return NextResponse.json({ ok: true });
}
