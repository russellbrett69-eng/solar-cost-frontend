import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

async function handler(req: NextRequest) {
  const supabase = getSupabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", req.url));
}

// Allow GET or POST for convenience
export const GET = handler;
export const POST = handler;
