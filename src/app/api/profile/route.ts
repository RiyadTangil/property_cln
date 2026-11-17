import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAudit } from "@/lib/tier0";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Password change handler
  if (body.current_password !== undefined || body.new_password !== undefined) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.password !== String(body.current_password ?? "")) {
      return NextResponse.json({ error: "Current password does not match." }, { status: 400 });
    }
    const nextPw = String(body.new_password ?? "");
    if (nextPw.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    if (nextPw !== String(body.password_confirmation ?? "")) {
      return NextResponse.json({ error: "Password confirmation does not match." }, { status: 400 });
    }
    await prisma.user.update({ where: { id: user.id }, data: { password: nextPw } });
    await recordAudit(user.name, "updated", user.name, "User", ["password"]);
    return NextResponse.json({ ok: true });
  }

  const data: Record<string, string | null> = {};

  if (typeof body.theme === "string" && ["light", "dark", "system"].includes(body.theme)) {
    data.theme = body.theme;
  }
  const navLayout = body.navLayout ?? body.nav_layout;
  if (typeof navLayout === "string" && ["side", "top"].includes(navLayout)) {
    data.navLayout = navLayout;
  }
  const sidebarColor = body.sidebarColor ?? body.sidebar_color;
  if (typeof sidebarColor === "string" && sidebarColor.length <= 30) {
    data.sidebarColor = sidebarColor;
  }
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.email === "string" && body.email.trim()) data.email = body.email.trim();
  if (typeof body.username === "string" && body.username.trim()) data.username = body.username.trim();
  if (body.job_title !== undefined) data.jobTitle = String(body.job_title).trim() || null;
  if (body.phone !== undefined) data.phone = String(body.phone).trim() || null;
  if (typeof body.timezone === "string") data.timezone = body.timezone;
  if (typeof body.date_format === "string") data.dateFormat = body.date_format;
  if (typeof body.time_format === "string") data.timeFormat = body.time_format;

  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: user.id }, data });
  }

  return NextResponse.json({ ok: true, ...data });
}
