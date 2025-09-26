import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServer();

  // Handles the OAuth/email-link code and sets the session cookie
  const { error } = await supabase.auth.exchangeCodeForSession();
  if (error) {
    console.error("exchangeCodeForSession error:", error);
    return NextResponse.redirect(new URL("/login?error=exchange", req.url));
  }

  return NextResponse.redirect(new URL("/", req.url));
}
