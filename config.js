/* ========= Pro Business settings =========
 *
 * SUPABASE (recommended for stock + orders + Excel import):
 * 1) https://supabase.com → New project
 * 2) SQL Editor → paste supabase-schema.sql → Run
 * 3) Project Settings → API → copy Project URL + anon public key
 * 4) Paste below, set enabled: true, push to GitHub / redeploy Vercel
 *
 * Until Supabase is enabled, the app still works on this device (local save).
 */
window.APP_CONFIG = {
  adminPin: "pro2026",

  // Set true after pasting Supabase keys
  enabled: false,

  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_ANON_KEY",
};
