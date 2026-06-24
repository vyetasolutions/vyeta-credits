import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This will show clearly in the browser console if .env is missing/misnamed.
  console.error(
    "Missing Supabase env vars. Check that .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, and restart `npm run dev`."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
