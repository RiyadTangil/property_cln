import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = String(body?.login ?? "").trim();
    const password = String(body?.password ?? "");
    const remember = Boolean(body?.remember);

    if (!login || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: login }, { username: login }],
      },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "These credentials do not match our records." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      redirectTo: "/land/parcels",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(SESSION_COOKIE, String(user.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
