// src/lib/supabaseServer.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for route handlers / server actions.
 * Uses Next's cookies() adapter so auth works across redirects.
 */
export function getSupabaseServer() {
  const cookieStore = cookies(); // synchronous in route handlers / server components

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          cookieStore.set({ name, value, ...(options ?? {}) });
        },
        remove(name: string, options?: CookieOptions) {
          cookieStore.set({
            name,
            value: "",
            ...(options ?? {}),
            expires: new Date(0),
          });
        },
      },
    }
  );
}
