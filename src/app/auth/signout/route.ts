// src/app/auth/signout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

async function handler(req: NextRequest) {
  const supabase = await getSupabaseServer(); // <- await
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", req.url));
}

export const GET = handler;
export const POST = handler;
