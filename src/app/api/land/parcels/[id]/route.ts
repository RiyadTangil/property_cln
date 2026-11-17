import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { convertToSqft } from "@/lib/land";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const parcel = await prisma.landParcel.findUnique({
    where: { id },
    include: {
      project: true,
      proposals: { orderBy: { id: "desc" } },
      agreements: { include: { owner: true }, orderBy: { id: "desc" } },
      payments: { include: { owner: true }, orderBy: { id: "desc" } },
    },
  });

  if (!parcel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ parcel });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body.stage === "string") data.stage = body.stage;
  if (typeof body.title === "string") data.title = body.title.trim() || null;
  if (typeof body.remarks === "string") data.remarks = body.remarks.trim() || null;
  if (body.projectId !== undefined) {
    data.projectId = body.projectId ? Number(body.projectId) : null;
  }
  if (body.areaValue !== undefined && body.areaUnit !== undefined) {
    const val = Number(body.areaValue);
    if (Number.isFinite(val) && val > 0) {
      data.areaValue = val;
      data.areaUnit = String(body.areaUnit);
      data.areaSqft = convertToSqft(val, String(body.areaUnit));
    }
  }

  const parcel = await prisma.landParcel.update({
    where: { id },
    data,
    include: { project: true },
  });

  return NextResponse.json({ parcel });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  await prisma.landParcel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
