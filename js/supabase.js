
const SUPABASE_URL = "ISI_PROJECT_URL_KAMU";
const SUPABASE_ANON_KEY = "ISI_ANON_ATAU_PUBLISHABLE_KEY_KAMU";

window.db = null;

if (
  window.supabase &&
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_ANON_KEY.startsWith("ISI_")
) {
  window.db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}
