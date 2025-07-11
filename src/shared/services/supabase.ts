import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Database } from '@everylanguage/shared-types';

const supabaseUrl =
  Constants.expoConfig?.extra?.['EXPO_PUBLIC_SUPABASE_URL'] ||
  process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  Constants.expoConfig?.extra?.['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist session in AsyncStorage
    persistSession: true,
    // Detect session in URL (for web)
    detectSessionInUrl: false,
  },
});

// Export the Database type from shared types
export type { Database } from '@everylanguage/shared-types';
