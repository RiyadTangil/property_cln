import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      jobTitle: true,
      phone: true,
      isSuperAdmin: true,
      isActive: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const b = await request.json();
    const name = String(b.name ?? "").trim();
    const email = String(b.email ?? "").trim().toLowerCase();
    const password = String(b.password ?? "");
    const passwordConfirmation = String(b.password_confirmation ?? "");

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Full Name, Email, and Password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (passwordConfirmation && password !== passwordConfirmation) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: `User with email ${email} already exists.` }, { status: 409 });
    }

    const usernameBase = email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "");
    const username = `${usernameBase}-${String(Date.now()).slice(-3)}`;

    const created = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password,
        jobTitle: b.job_title?.trim() || null,
        phone: b.phone?.trim() || null,
        role: String(b.role ?? (b.is_super_admin ? "Super Admin" : "Staff")),
        isSuperAdmin: Boolean(b.is_super_admin),
        isActive: b.is_active === undefined ? true : Boolean(b.is_active),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        isSuperAdmin: true,
        isActive: true,
      },
    });

    await recordAudit(user.name, "created", created.name, "User", ["email", "role"]);
    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    console.error("Create user error:", err);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
