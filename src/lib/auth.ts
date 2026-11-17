import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthService } from "@/server/services/auth.service";

export const SESSION_COOKIE = "estate_erp_user";

export interface SessionUser {
  id: number;
  email: string;
  username: string;
  name: string;
  role: string;
  theme: string;
  navLayout: string;
  sidebarColor: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const userId = Number(raw);
  if (!Number.isInteger(userId) || userId <= 0) return null;

  return AuthService.getUserById(userId);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
