import * as FileSystem from 'expo-file-system';
import {
  DownloadItem,
  DownloadStatus,
  DownloadOptions,
  BatchDownloadResult,
} from '../types';

// Import your Supabase configuration
import { env } from '@/app/config/env';
import { createClient } from '@supabase/supabase-js';

export class DownloadService {
  private supabaseClient = createClient(
    'https://sjczwtpnjbmscxoszlyi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqY3p3dHBuamJtc2N4b3N6bHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExODE2MjcsImV4cCI6MjA2Njc1NzYyN30.XqaYmc7WPXeF_eASoxHUUMIok8a1OStmfmGL2a5qnAo'
  );

  private downloads = new Map<string, DownloadItem>();
  private downloadResumables = new Map<string, FileSystem.DownloadResumable>();

  /**
   * Get signed URLs for file downloads
   */
  async getDownloadUrls(filePaths: string[], expirationHours = 24) {
    const {
      data: { session },
    } = await this.supabaseClient.auth.getSession();

    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${env.supabase.url}/functions/v1/get-download-urls`,
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
   * Get signed URLs for external URLs (for direct URL downloads)
   * Uses Supabase Edge Function 'get-download-urls'
   */
  async getSignedUrlsForExternalUrls(urls: string[], expirationHours = 24) {
    try {
      // Call the Supabase Edge Function using the proper API
      console.log(
        '🔐 [URL Signing] Calling Supabase Edge Function: get-download-urls'
      );

      const requestBody = {
        filePaths: urls, // Edge function expects 'filePaths' field
        expirationHours: expirationHours,
      };

      console.log(
        '🔐 [URL Signing] Request body:',
        JSON.stringify(requestBody, null, 2)
      );

      // Use Supabase Edge Functions invoke method
      const { data: responseData, error } =
        await this.supabaseClient.functions.invoke('get-download-urls', {
          body: JSON.stringify(requestBody),
        });

      console.log(
        '🔐 [URL Signing] Edge function response data:',
        responseData
      );
      console.log('🔐 [URL Signing] Edge function error:', error);

      if (error) {
        console.error('🔐 [URL Signing] Edge function error:', error);
        throw new Error(
          error.message || 'Failed to get signed URLs from edge function'
        );
      }

      if (!responseData) {
        console.error('🔐 [URL Signing] No response data from edge function');
        throw new Error('No response data from edge function');
      }

      // Validate response structure
      if (!responseData.success) {
        console.error('🔐 [URL Signing] Edge function returned success: false');
        console.error(
          '🔐 [URL Signing] Error details:',
          responseData.error || responseData.message
        );
        throw new Error(
          responseData.error ||
            responseData.message ||
            'Edge function returned failure'
        );
      }

      if (!responseData.urls || typeof responseData.urls !== 'object') {
        console.error(
          '🔐 [URL Signing] Invalid response structure - missing or invalid urls field'
        );
        console.error('🔐 [URL Signing] Response structure:', responseData);
        throw new Error('Invalid response structure from edge function');
      }

      console.log('🔐 [URL Signing] Successfully received signed URLs');
      console.log(
        '🔐 [URL Signing] Number of signed URLs:',
        Object.keys(responseData.urls).length
      );
      console.log('🔐 [URL Signing] Signed URLs mapping:', responseData.urls);
      console.log('🔐 [URL Signing] Expiration info:', {
        expiresIn: responseData.expiresIn,
        totalFiles: responseData.totalFiles,
        successfulUrls: responseData.successfulUrls,
      });

      return {
        success: true,
        urls: responseData.urls,
        expiresIn: responseData.expiresIn || expirationHours * 3600,
        totalFiles: responseData.totalFiles || urls.length,
        successfulUrls:
          responseData.successfulUrls || Object.keys(responseData.urls).length,
      };
    } catch (error) {
      console.error(
        '🔐 [URL Signing] Exception during signing process:',
        error
      );
      console.error('🔐 [URL Signing] Error stack:', (error as Error).stack);

      // Fallback to returning original URLs if signing fails
      console.log(
        '🔐 [URL Signing] Falling back to original URLs due to signing failure'
      );

      const signedUrls: Record<string, string> = {};
      urls.forEach(url => {
        signedUrls[url] = url; // Return the original URL as fallback
      });

      console.log('🔐 [URL Signing] Fallback URLs mapping:', signedUrls);

      return {
        success: true,
        urls: signedUrls,
        expiresIn: expirationHours * 3600,
        totalFiles: urls.length,
        successfulUrls: urls.length,
        fallback: true, // Indicate this is a fallback response
      };
    }
  }

  /**
   * Download a single file with progress tracking
   */
  async downloadFile(
    filePath: string,
    fileName: string,
    options: DownloadOptions = {}
  ): Promise<DownloadItem> {
    console.log('📥 [Download] Starting file download...');
    console.log('📥 [Download] File path:', filePath);
    console.log('📥 [Download] File name:', fileName);
    console.log('📥 [Download] Options:', options);

    const id = this.generateId();
    const localPath = `${FileSystem.documentDirectory}downloads/${fileName}`;

    console.log('📥 [Download] Generated ID:', id);
    console.log('📥 [Download] Local path:', localPath);

    // Ensure downloads directory exists
    await this.ensureDownloadsDirectory();

    const downloadItem: DownloadItem = {
      id,
      filePath,
      fileName,
      localPath,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    console.log('📥 [Download] Created download item:', downloadItem);
    this.downloads.set(id, downloadItem);

    try {
      let signedUrl: string;

      // Check if this is a direct URL download
      if (filePath.startsWith('direct://')) {
        signedUrl = filePath.replace('direct://', '');
        console.log('📥 [Download] Direct URL download detected:', signedUrl);
      } else {
        console.log('📥 [Download] Getting signed URL from API for:', filePath);
        // Get signed URL from API
        const { urls, success } = await this.getDownloadUrls([filePath]);

        if (!success || !urls[filePath]) {
          console.error(
            '📥 [Download] Failed to get download URL for:',
            filePath
          );
          throw new Error('Failed to get download URL');
        }

        signedUrl = urls[filePath];
        console.log('📥 [Download] Got signed URL:', signedUrl);
      }
      downloadItem.signedUrl = signedUrl;
      downloadItem.status = 'downloading';
      downloadItem.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create resumable download
      console.log('📥 [Download] Creating download resumable for:', signedUrl);
      const downloadResumable = FileSystem.createDownloadResumable(
        signedUrl,
        localPath,
        {},
        downloadProgress => {
          const progress =
            downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite;

          console.log('📥 [Download] Progress update:', {
            progress: progress,
            percentage: `${(progress * 100).toFixed(1)}%`,
            bytesWritten: downloadProgress.totalBytesWritten,
            totalBytes: downloadProgress.totalBytesExpectedToWrite,
          });

          downloadItem.progress = progress;
          downloadItem.fileSize = downloadProgress.totalBytesExpectedToWrite;

          options.onProgress?.({
            bytesWritten: downloadProgress.totalBytesWritten,
            contentLength: downloadProgress.totalBytesExpectedToWrite,
            progress,
          });
        }
      );

      this.downloadResumables.set(id, downloadResumable);

      // Start download
      console.log('📥 [Download] Starting download...');
      const result = await downloadResumable.downloadAsync();

      if (!result) {
        console.error('📥 [Download] Download was cancelled');
        throw new Error('Download was cancelled');
      }

      console.log('📥 [Download] Download completed successfully!');
      console.log('📥 [Download] Final URI:', result.uri);

      downloadItem.status = 'completed';
      downloadItem.progress = 1;
      downloadItem.completedAt = new Date();
      downloadItem.localPath = result.uri;

      options.onComplete?.(downloadItem);
      return downloadItem;
    } catch (error) {
      console.error('📥 [Download] Download failed:', error);
      console.error('📥 [Download] Error details:', (error as Error).message);
      console.error('📥 [Download] Error stack:', (error as Error).stack);

      downloadItem.status = 'failed';
      downloadItem.error = (error as Error).message;
      options.onError?.((error as Error).message);
      throw error;
    } finally {
      console.log('📥 [Download] Cleaning up download resumable for ID:', id);
      this.downloadResumables.delete(id);
    }
  }

  /**
   * Download multiple files in batch
   */
  async downloadBatch(
    files: Array<{ filePath: string; fileName: string }>,
    options: DownloadOptions = {}
  ): Promise<BatchDownloadResult> {
    const results: Array<{
      filePath: string;
      success: boolean;
      error?: string;
    }> = [];
    let successful = 0;
    let failed = 0;

    // Get all signed URLs at once
    const filePaths = files.map(f => f.filePath);
    const { urls, success, errors } = await this.getDownloadUrls(filePaths, 24);

    if (!success) {
      throw new Error('Failed to get signed URLs');
    }

    // Process downloads
    for (const { filePath, fileName } of files) {
      try {
        const signedUrl = urls[filePath];

        if (!signedUrl) {
          const error = errors?.[filePath] || 'No URL available';
          results.push({ filePath, success: false, error });
          failed++;
          continue;
        }

        await this.downloadFile(filePath, fileName, options);
        results.push({ filePath, success: true });
        successful++;
      } catch (error) {
        results.push({
          filePath,
          success: false,
          error: (error as Error).message,
        });
        failed++;
      }
    }

    return {
      total: files.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Pause a download
   */
  async pauseDownload(id: string): Promise<void> {
    const downloadItem = this.downloads.get(id);
    const downloadResumable = this.downloadResumables.get(id);

    if (!downloadItem || !downloadResumable) {
      throw new Error('Download not found or not active');
    }

    try {
      await downloadResumable.pauseAsync();
      downloadItem.status = 'paused';
    } catch (error) {
      throw new Error(`Failed to pause download: ${(error as Error).message}`);
    }
  }

  /**
   * Resume a paused download
   */
  async resumeDownload(id: string): Promise<DownloadItem> {
    const downloadItem = this.downloads.get(id);
    const downloadResumable = this.downloadResumables.get(id);

    if (!downloadItem || !downloadResumable) {
      throw new Error('Download not found or not paused');
    }

    try {
      downloadItem.status = 'downloading';
      const result = await downloadResumable.resumeAsync();

      if (!result) {
        throw new Error('Download was cancelled');
      }

      downloadItem.status = 'completed';
      downloadItem.progress = 1;
      downloadItem.completedAt = new Date();
      downloadItem.localPath = result.uri;

      this.downloadResumables.delete(id);
      return downloadItem;
    } catch (error) {
      downloadItem.status = 'failed';
      downloadItem.error = (error as Error).message;
      throw error;
    }
  }

  /**
   * Cancel a download
   */
  async cancelDownload(id: string): Promise<void> {
    const downloadItem = this.downloads.get(id);
    const downloadResumable = this.downloadResumables.get(id);

    if (!downloadItem) {
      throw new Error('Download not found');
    }

    try {
      if (downloadResumable) {
        await downloadResumable.cancelAsync();
        this.downloadResumables.delete(id);
      }

      downloadItem.status = 'cancelled';
    } catch (error) {
      throw new Error(`Failed to cancel download: ${(error as Error).message}`);
    }
  }

  /**
   * Get download by ID
   */
  getDownload(id: string): DownloadItem | undefined {
    return this.downloads.get(id);
  }

  /**
   * Get all downloads
   */
  getAllDownloads(): DownloadItem[] {
    return Array.from(this.downloads.values());
  }

  /**
   * Get downloads by status
   */
  getDownloadsByStatus(status: DownloadStatus): DownloadItem[] {
    return this.getAllDownloads().filter(
      download => download.status === status
    );
  }

  /**
   * Delete a completed download
   */
  async deleteDownload(id: string): Promise<void> {
    const downloadItem = this.downloads.get(id);

    if (!downloadItem) {
      throw new Error('Download not found');
    }

    try {
      // Delete the local file
      if (downloadItem.localPath) {
        await FileSystem.deleteAsync(downloadItem.localPath);
      }

      // Remove from downloads map
      this.downloads.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete download: ${(error as Error).message}`);
    }
  }

  /**
   * Clear all completed downloads
   */
  async clearCompletedDownloads(): Promise<void> {
    const completedDownloads = this.getDownloadsByStatus('completed');

    for (const download of completedDownloads) {
      try {
        await this.deleteDownload(download.id);
      } catch (error) {
        console.warn(`Failed to delete download ${download.id}:`, error);
      }
    }
  }

  /**
   * Get download statistics
   */
  getDownloadStats() {
    const allDownloads = this.getAllDownloads();

    return {
      totalDownloads: allDownloads.length,
      completedDownloads: allDownloads.filter(d => d.status === 'completed')
        .length,
      failedDownloads: allDownloads.filter(d => d.status === 'failed').length,
      totalSize: allDownloads.reduce((sum, d) => sum + (d.fileSize || 0), 0),
      downloadedSize: allDownloads
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + (d.fileSize || 0), 0),
    };
  }

  /**
   * Ensure downloads directory exists
   */
  private async ensureDownloadsDirectory(): Promise<void> {
    const downloadsDir = `${FileSystem.documentDirectory}downloads/`;
    const dirInfo = await FileSystem.getInfoAsync(downloadsDir);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(downloadsDir, {
        intermediates: true,
      });
    }
  }

  /**
   * Generate unique ID for downloads
   */
  private generateId(): string {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const downloadService = new DownloadService();
