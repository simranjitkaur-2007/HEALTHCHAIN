// config/supabase.js
// ==========================================
// WHY: This creates ONE shared Supabase client used everywhere in the backend.
// We use the service_role key (not the anon key) because:
//   - The anon key is for frontend use and respects Row Level Security (RLS)
//   - The service_role key BYPASSES RLS — perfect for trusted server code
// ==========================================

const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = supabase;
