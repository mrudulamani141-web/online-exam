/**
 * Supabase Client Initialization
 * Connects to Supabase PostgreSQL database using the JS SDK.
 */
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

let supabase = null;
const isSupabaseConfigured = Boolean(
  config.supabase.url && 
  (config.supabase.serviceRoleKey || config.supabase.anonKey) &&
  !config.supabase.url.includes('your-project-id')
);

if (isSupabaseConfigured) {
  const key = config.supabase.serviceRoleKey || config.supabase.anonKey;
  supabase = createClient(config.supabase.url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  console.log(`[Database] Supabase client initialized with endpoint: ${config.supabase.url}`);
} else {
  console.log('[Database] Supabase credentials not detected in .env. Initializing local persistent store fallback.');
}

module.exports = {
  supabase,
  isSupabaseConfigured
};
