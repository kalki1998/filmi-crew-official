import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars. Check .env.local");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }, // server-side fetch only
  });
}
