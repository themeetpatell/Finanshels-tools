import { createClient } from "@supabase/supabase-js";

/**
 * Route handlers should prefer service-role key via SUPABASE_SERVICE_ROLE_KEY (never exposed to browser).
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    /** Dev convenience only — never ship without service role separation */
    process.env.SUPABASE_SERVICE_KEY ??
    "";

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
