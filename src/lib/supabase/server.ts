import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getServerSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

/**
 * Returns true when Supabase URL and either service-role or anon key are configured.
 */
export function isSupabaseConfigured(): boolean {
  return getServerSupabaseConfig() !== null;
}

/**
 * Creates a server-side Supabase client without session persistence.
 * Throws a descriptive error if required environment variables are missing.
 */
export function createServerSupabaseClient(): SupabaseClient {
  const config = getServerSupabaseConfig();
  if (!config) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) to .env.local."
    );
  }

  return createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
