// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // If this is an OAuth/magic-link redirect, exchange code for a session
  if (code) {
    const supabase = getServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Go back to home (or a ?redirect=… if provided)
  const redirectTo = searchParams.get("redirect") || "/";
  return NextResponse.redirect(new URL(redirectTo, origin));
}
