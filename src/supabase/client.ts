import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured =
  !!supabaseUrl &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  supabaseUrl.startsWith("https://") &&
  !!supabaseAnonKey &&
  supabaseAnonKey !== "your-anon-key-here";

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
