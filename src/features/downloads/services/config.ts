import * as FileSystem from 'expo-file-system';
import { env, getRequiredEnvVar } from '@/app/config/env';
import { DownloadServiceConfig } from './types';

export const downloadServiceConfig: DownloadServiceConfig = {
  baseUrl: getRequiredEnvVar('EXPO_PUBLIC_SUPABASE_URL', env.supabase.url),
  apiKey: getRequiredEnvVar(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    env.supabase.anonKey
  ),
  downloadsDirectory: `${FileSystem.documentDirectory || ''}downloads/`,
  maxConcurrentDownloads: 3,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Environment-specific overrides
if (__DEV__) {
  downloadServiceConfig.maxConcurrentDownloads = 1;
  downloadServiceConfig.retryAttempts = 1;
}
