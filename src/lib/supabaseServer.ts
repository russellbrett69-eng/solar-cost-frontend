// src/lib/supabaseServer.ts
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client for route handlers / server actions.
 * - Uses Next's cookies()/headers() adapters so auth works across redirects.
 */
export function getSupabaseServer() {
  const cookieStore = cookies();
  const headerList = headers();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", expires: new Date(0), ...options });
        },
      },
      headers: {
        get(key) {
          return headerList.get(key) ?? undefined;
        },
      },
    }
  );
}
