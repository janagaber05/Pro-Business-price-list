/* ========= Pro Business settings =========
 *
 * SUPABASE: connected below.
 * Make sure you ran supabase-schema.sql in SQL Editor once.
 *
 * REAL AI Excel import (OpenAI):
 * 1) Create key at https://platform.openai.com/api-keys
 * 2) For Vercel: Project → Settings → Environment Variables
 *    Name: OPENAI_API_KEY   Value: sk-...
 * 3) For local npm start: paste the same key in openAiApiKey below
 *    (local only — do not share this file publicly with a real key)
 */
window.APP_CONFIG = {
  adminPin: "pro2026",

  enabled: true,

  supabaseUrl: "https://xnfwwhnwubnurewyvemm.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZndlaG53dWJudXJld3l2ZW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Mzk5MTMsImV4cCI6MjEwNTQxNTkxM30._co-yKB88F1NqCYzZiYirwvWdN7Og8_G0syHM01ByV8",

  // Paste OpenAI key here for local testing (npm start)
  openAiApiKey: "",
};
