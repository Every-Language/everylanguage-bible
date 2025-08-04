import Constants from 'expo-constants';
import { logger } from '../../../shared/utils/logger';

// Define proper types for global and process
interface GlobalWithProcess {
  process?: {
    env?: {
      [key: string]: string | undefined;
    };
  };
}

// Get current environment from build profile
const getCurrentEnvironment = () => {
  return (
    Constants.expoConfig?.extra?.['EXPO_PUBLIC_ENVIRONMENT'] ||
    (global as GlobalWithProcess).process?.env?.['EXPO_PUBLIC_ENVIRONMENT'] ||
    'development'
  );
};

// Determine config type based on environment
// development + preview = dev config, production = prod config
const getConfigType = () => {
  const environment = getCurrentEnvironment();
  return environment === 'production' ? 'prod' : 'dev';
};

// Environment-specific configurations
const environmentConfigs = {
  dev: {
    supabase: {
      url:
        Constants.expoConfig?.extra?.['EXPO_PUBLIC_SUPABASE_DEV_URL'] ||
        (global as GlobalWithProcess).process?.env?.[
          'EXPO_PUBLIC_SUPABASE_DEV_URL'
        ] ||
        '',
      anonKey:
        Constants.expoConfig?.extra?.['EXPO_PUBLIC_SUPABASE_DEV_ANON_KEY'] ||
        (global as GlobalWithProcess).process?.env?.[
          'EXPO_PUBLIC_SUPABASE_DEV_ANON_KEY'
        ] ||
        '',
    },
    powersync: {
      url:
        Constants.expoConfig?.extra?.['EXPO_PUBLIC_POWERSYNC_DEV_URL'] ||
        (global as GlobalWithProcess).process?.env?.[
          'EXPO_PUBLIC_POWERSYNC_DEV_URL'
        ] ||
        '',
    },
  },
  prod: {
    supabase: {
      url:
        Constants.expoConfig?.extra?.['EXPO_PUBLIC_SUPABASE_PROD_URL'] ||
        (global as GlobalWithProcess).process?.env?.[
          'EXPO_PUBLIC_SUPABASE_PROD_URL'
        ] ||
        '',
      anonKey:
        Constants.expoConfig?.extra?.['EXPO_PUBLIC_SUPABASE_PROD_ANON_KEY'] ||
        (global as GlobalWithProcess).process?.env?.[
          'EXPO_PUBLIC_SUPABASE_PROD_ANON_KEY'
        ] ||
        '',
    },
    powersync: {
      url:
        Constants.expoConfig?.extra?.['EXPO_PUBLIC_POWERSYNC_PROD_URL'] ||
        (global as GlobalWithProcess).process?.env?.[
          'EXPO_PUBLIC_POWERSYNC_PROD_URL'
        ] ||
        '',
    },
  },
} as const;

// Get current environment config
const currentEnvironment = getCurrentEnvironment();
const configType = getConfigType();
export const env = environmentConfigs[configType];

// Export environment info for debugging
export const environmentInfo = {
  buildProfile: currentEnvironment,
  configType,
  isProduction: configType === 'prod',
  isDevelopment: configType === 'dev',
};

// Type-safe environment variable access
export function getRequiredEnvVar(name: string, value?: string): string {
  if (!value || value.trim() === '') {
    logger.error(`Missing or empty environment variable: ${name}`);
    logger.error('Environment info:', environmentInfo);
    logger.error('Available environment variables:', {
      EXPO_PUBLIC_SUPABASE_URL: env.supabase.url ? '[SET]' : '[MISSING]',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: env.supabase.anonKey
        ? '[REDACTED]'
        : '[MISSING]',
      EXPO_PUBLIC_POWERSYNC_URL: env.powersync.url ? '[SET]' : '[MISSING]',
    });
    throw new Error(
      `Missing required environment variable: ${name} for config type: ${configType}`
    );
  }
  return value;
}

// Debug function to log current configuration
export function debugEnvironmentConfig() {
  logger.debug('Environment Configuration:', {
    buildProfile: currentEnvironment,
    configType,
    supabaseUrl: env.supabase.url
      ? `${env.supabase.url.substring(0, 30)}...`
      : '[MISSING]',
    powersyncUrl: env.powersync.url
      ? `${env.powersync.url.substring(0, 30)}...`
      : '[MISSING]',
  });
}
