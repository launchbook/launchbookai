// server/lib/supabase.js

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load .env values
dotenv.config();

// Validate .env variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("❌ Missing Supabase credentials in environment variables.");
}

// Export the initialized client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabase };
