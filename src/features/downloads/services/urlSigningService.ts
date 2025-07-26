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
   * Get signed URLs for file downloads
   */
  async getDownloadUrls(
    filePaths: string[],
    expirationHours = 24
  ): Promise<SignedUrlResponse> {
    const {
      data: { session },
    } = await this.supabaseClient.auth.getSession();

    if (!session) {
      throw new Error('Authentication required for URL signing');
    }

    const response = await fetch(
      `${downloadServiceConfig.baseUrl}/functions/v1/get-download-urls`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePaths,
          expirationHours,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get download URLs');
    }

    return await response.json();
  }

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
      logger.error('🔐 [URL Signing] Failed to get signed URLs:', {
        error: error,
        errorType: typeof error,
        errorConstructor: (error as any)?.constructor?.name,
        errorMessage: (error as any)?.message || 'No message',
        errorStack: (error as any)?.stack || 'No stack',
      });
      throw error;
    }
  }

  /**
   * Validate if a signed URL is still valid
   */
  isUrlValid(expiresAt: string): boolean {
    const expirationTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    return currentTime < expirationTime;
  }
}

export const urlSigningService = new UrlSigningService();
