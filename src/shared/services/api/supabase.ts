import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@everylanguage/shared-types';

import { env, getRequiredEnvVar } from '@/app/config/env';

const supabaseUrl = getRequiredEnvVar(
  'EXPO_PUBLIC_SUPABASE_URL',
  env.supabase.url
);
const supabaseAnonKey = getRequiredEnvVar(
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  env.supabase.anonKey
);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Handle session refresh for React Native
AppState.addEventListener('change', state => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
