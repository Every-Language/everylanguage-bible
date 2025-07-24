import Constants from 'expo-constants';
import { logger } from '../../../shared/utils/logger';

// Environment configuration for the app
export const env = {
  supabase: {
    url:
      Constants.expoConfig?.extra?.['EXPO_PUBLIC_SUPABASE_URL'] ||
      (global as any).process?.env?.EXPO_PUBLIC_SUPABASE_URL ||
      '',
    anonKey:
      Constants.expoConfig?.extra?.['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ||
      (global as any).process?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      '',
  },
} as const;

// Type-safe environment variable access
export function getRequiredEnvVar(name: string, value?: string): string {
  if (!value || value.trim() === '') {
    logger.error(`Missing or empty environment variable: ${name}`);
    logger.error('Available environment variables:', {
      EXPO_PUBLIC_SUPABASE_URL: env.supabase.url,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: env.supabase.anonKey
        ? '[REDACTED]'
        : '[MISSING]',
    });
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
