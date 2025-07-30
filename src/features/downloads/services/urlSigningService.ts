import { createClient } from '@supabase/supabase-js';
import { logger } from '@/shared/utils/logger';
import { downloadServiceConfig } from './config';
import { SignedUrlRequest, SignedUrlResponse } from './types';

export class UrlSigningService {
  private supabaseClient = createClient(
    downloadServiceConfig.baseUrl,
    downloadServiceConfig.apiKey
  );

  /**
   * Get signed URLs for external URLs using Supabase Edge Function
   */
  async getSignedUrlsForExternalUrls(
    urls: string[],
    expirationHours = 24
  ): Promise<SignedUrlResponse> {
    try {
      logger.info(
        '🔐 [URL Signing] Calling Supabase Edge Function: get-download-urls'
      );

      const requestBody: SignedUrlRequest = {
        filePaths: urls,
        expirationHours,
      };

      logger.info(
        '🔐 [URL Signing] Request body:',
        JSON.stringify(requestBody, null, 2)
      );

      const { data: responseData, error } =
        await this.supabaseClient.functions.invoke('get-download-urls', {
          body: JSON.stringify(requestBody),
        });

      if (error) {
        logger.error('🔐 [URL Signing] Edge function error:', error);
        throw new Error(
          error.message || 'Failed to get signed URLs from edge function'
        );
      }

      if (!responseData) {
        logger.error('🔐 [URL Signing] No response data from edge function');
        throw new Error('No response data from edge function');
      }

      logger.info(
        '🔐 [URL Signing] Edge function response data:',
        responseData
      );
      return responseData as SignedUrlResponse;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('🔐 [URL Signing] Failed to get signed URLs:', {
        error: error,
        errorType: typeof error,
        errorConstructor: err?.constructor?.name,
        errorMessage: err?.message || 'No message',
        errorStack: err?.stack || 'No stack',
      });
      throw error;
    }
  }

  /**
   * Validate if a signed URL is still valid
   */
  isUrlValid(expiresAt: string | Date): boolean {
    const expirationTime =
      typeof expiresAt === 'string'
        ? new Date(expiresAt).getTime()
        : expiresAt.getTime();
    const currentTime = Date.now();
    return currentTime < expirationTime;
  }
}

export const urlSigningService = new UrlSigningService();
