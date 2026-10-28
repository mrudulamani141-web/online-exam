/**
 * Application Configuration
 * Loads environment variables and provides sensible fallbacks.
 */
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  jwtSecret: process.env.JWT_SECRET || 'exam_system_super_secret_jwt_key_2026_xyz',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || ''
  },
  
  // CORS configuration
  clientOrigin: process.env.CLIENT_ORIGIN || '*'
};

module.exports = config;
