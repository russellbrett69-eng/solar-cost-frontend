// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServer();

  // `code` comes back on the callback URL from Supabase
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    // Nothing to exchange – redirect to login with an error
    return NextResponse.redirect(new URL("/login?error=missing_code", req.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("exchangeCodeForSession error:", error);
    return NextResponse.redirect(new URL("/login?error=exchange", req.url));
  }

  return NextResponse.redirect(new URL("/", req.url));
}
