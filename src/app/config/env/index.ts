// Environment configuration for the app
export const env = {
  supabase: {
    url: (global as any).process?.env?.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: (global as any).process?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
} as const;

// Type-safe environment variable access
export function getRequiredEnvVar(name: string, value?: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
