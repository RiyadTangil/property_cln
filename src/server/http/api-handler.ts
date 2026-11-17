import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export class ServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface AuthContext<P = Record<string, string>> {
  user: SessionUser;
  request: Request;
  params: P;
}

export function withAuth<P = Record<string, string>>(
  handler: (ctx: AuthContext<P>) => Promise<Response>
) {
  return async function routeHandler(
    request: Request,
    context?: { params?: P }
  ): Promise<Response> {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      return await handler({
        user,
        request,
        params: (context?.params ?? {}) as P,
      });
    } catch (err) {
      if (err instanceof ServiceError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error("API error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Internal server error." },
        { status: 500 }
      );
    }
  };
}

export function optStr(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

export function reqStr(val: unknown, fallback = ""): string {
  return String(val ?? fallback).trim();
}

export function optNum(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export function csvResponse(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): NextResponse {
  const csv = toCsv(headers, rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
