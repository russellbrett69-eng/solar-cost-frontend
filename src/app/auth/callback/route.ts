import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer(); // <- await the helper

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", req.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("exchangeCodeForSession error:", error);
    return NextResponse.redirect(new URL("/login?error=exchange", req.url));
  }

  return NextResponse.redirect(new URL("/", req.url));
}
