import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { ServiceError } from "@/server/http/api-handler";
import { AuthService } from "@/server/services/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = String(body?.login ?? "");
    const password = String(body?.password ?? "");
    const remember = Boolean(body?.remember);

    const user = await AuthService.authenticate({ login, password });

    const response = NextResponse.json({
      ok: true,
      redirectTo: "/land/parcels",
      user,
    });

    response.cookies.set(SESSION_COOKIE, String(user.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
    });

    return response;
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Login error:", err);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
