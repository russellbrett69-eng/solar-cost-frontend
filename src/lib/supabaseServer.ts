// src/lib/supabaseServer.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Next 15: cookies() is async in route handlers, so this helper is async.
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies(); // <- await here

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
