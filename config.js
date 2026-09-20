/* ========= Pro Business settings =========
 *
 * SUPABASE: connected below.
 * Make sure you ran supabase-schema.sql in SQL Editor once.
 *
 * REAL AI Excel import (Google Gemini — free tier):
 * 1) Create a free key: https://aistudio.google.com/apikey
 * 2) For local npm start: paste it in geminiApiKey below
 * 3) For Vercel: Settings → Environment Variables
 *    Name: GEMINI_API_KEY   Value: your key
 *    Then redeploy
 */
window.APP_CONFIG = {
  adminPin: "pro2026",

  enabled: true,

  supabaseUrl: "https://xnfwwhnwubnurewyvemm.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZndlaG53dWJudXJld3l2ZW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Mzk5MTMsImV4cCI6MjEwNTQxNTkxM30._co-yKB88F1NqCYzZiYirwvWdN7Og8_G0syHM01ByV8",

  // Paste Gemini key here for local testing (npm start)
  geminiApiKey: "",
};