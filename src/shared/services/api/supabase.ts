import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@everylanguage/shared-types';
import Constants from 'expo-constants';

import { env, getRequiredEnvVar } from '@/app/config/env';
import { logger } from '@/shared/utils/logger';

// Define proper types for global and process
interface GlobalWithProcess {
  process?: {
    env?: {
      [key: string]: string | undefined;
    };
  };
}

// Debug utility to check Supabase configuration
export function debugSupabaseConfig() {
  logger.debug('Supabase Configuration Debug:', {
    urlAvailable: !!env.supabase.url,
    urlLength: env.supabase.url.length,
    anonKeyAvailable: !!env.supabase.anonKey,
    anonKeyLength: env.supabase.anonKey.length,
    environmentSource: {
      hasExpoConfig: !!Constants.expoConfig?.extra,
      hasProcessEnv: !!(global as GlobalWithProcess).process?.env,
    },
  });
}

// Validate environment variables before creating client
let supabaseUrl: string;
let supabaseAnonKey: string;

try {
  supabaseUrl = getRequiredEnvVar('EXPO_PUBLIC_SUPABASE_URL', env.supabase.url);
  supabaseAnonKey = getRequiredEnvVar(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    env.supabase.anonKey
  );
} catch (error) {
  logger.error('Failed to load Supabase environment variables:', error);
  debugSupabaseConfig();
  throw new Error(
    'Supabase configuration is missing. Please check your environment variables: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  throw new Error('Invalid Supabase URL format. Must start with https://');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Verify client was created successfully
if (!supabase) {
  throw new Error('Failed to create Supabase client');
}

// Handle session refresh for React Native
AppState.addEventListener('change', state => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
