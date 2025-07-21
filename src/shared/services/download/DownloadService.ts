import * as FileSystem from 'expo-file-system';
import { URL } from 'react-native-url-polyfill';

export interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number; // 0-100
}

export interface DownloadDetails {
  localUri: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  downloadDate: Date;
  originalUrl: string;
}

export interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  timeout?: number; // in milliseconds
  headers?: Record<string, string>;
}

export interface DownloadResult {
  success: boolean;
  details?: DownloadDetails;
  error?: string;
}

class DownloadService {
  private static instance: DownloadService;
  private downloadsDirectory: string;
  private activeDownloads: Map<string, FileSystem.DownloadResumable> =
    new Map();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    // Set up downloads directory synchronously
    this.downloadsDirectory = this.getDownloadsDirectory();
  }

  static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  /**
   * Initialize the service (creates downloads directory)
   * Should be called before using the service
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.isInitialized) {
      return;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      await this.ensureDownloadsDirectory();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize download service:', error);
      throw error;
    }
  }

  private getDownloadsDirectory(): string {
    const baseDir = FileSystem.documentDirectory;
    if (!baseDir) {
      throw new Error('Document directory not available');
    }
    return `${baseDir}downloads/`;
  }

  private async ensureDownloadsDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.downloadsDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.downloadsDirectory, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error('Failed to create downloads directory:', error);
      throw new Error('Failed to create downloads directory');
    }
  }

  /**
   * Downloads a file from a URL and saves it locally
   * @param url - The URL to download from
   * @param fileName - Optional custom filename, will use URL filename if not provided
   * @param options - Download options including progress callback and timeout
   * @returns Promise<DownloadResult> - Download result with local file details
   */
  async downloadFile(
    url: string,
    fileName?: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    try {
      // Ensure service is initialized
      await this.initialize();

      // Validate URL
      if (!url || !this.isValidUrl(url)) {
        return {
          success: false,
          error: 'Invalid URL provided',
        };
      }

      // Generate filename if not provided
      const finalFileName = fileName || this.extractFileNameFromUrl(url);
      const localUri = `${this.downloadsDirectory}${finalFileName}`;

      // Check if file already exists
      const existingFile = await FileSystem.getInfoAsync(localUri);
      if (existingFile.exists) {
        // Return existing file details
        const fileInfo = await FileSystem.getInfoAsync(localUri, {
          size: true,
        });

        return {
          success: true,
          details: {
            localUri,
            fileName: finalFileName,
            fileSize: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
            mimeType: this.guessMimeType(finalFileName),
            downloadDate: new Date(),
            originalUrl: url,
          },
        };
      }

      // Create download resumable
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localUri,
        options.headers ? { headers: options.headers } : {},
        downloadProgress => {
          const progress: DownloadProgress = {
            totalBytesWritten: downloadProgress.totalBytesWritten,
            totalBytesExpectedToWrite:
              downloadProgress.totalBytesExpectedToWrite,
            progress:
              downloadProgress.totalBytesExpectedToWrite > 0
                ? (downloadProgress.totalBytesWritten /
                    downloadProgress.totalBytesExpectedToWrite) *
                  100
                : 0,
          };

          if (options.onProgress) {
            options.onProgress(progress);
          }
        }
      );

      // Store active download
      this.activeDownloads.set(url, downloadResumable);

      // Start download with timeout
      const downloadPromise = downloadResumable.downloadAsync();
      const timeoutPromise = options.timeout
        ? new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Download timeout')),
              options.timeout
            )
          )
        : null;

      const downloadResult = timeoutPromise
        ? await Promise.race([downloadPromise, timeoutPromise])
        : await downloadPromise;

      // Remove from active downloads
      this.activeDownloads.delete(url);

      if (!downloadResult) {
        return {
          success: false,
          error: 'Download failed - no result returned',
        };
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(localUri, {
        size: true,
      });

      const details: DownloadDetails = {
        localUri,
        fileName: finalFileName,
        fileSize: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        mimeType: this.guessMimeType(finalFileName),
        downloadDate: new Date(),
        originalUrl: url,
      };

      return {
        success: true,
        details,
      };
    } catch (error) {
      // Remove from active downloads on error
      this.activeDownloads.delete(url);

      console.error('Download failed:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown download error',
      };
    }
  }

  /**
   * Pauses an active download
   * @param url - The URL of the download to pause
   * @returns Promise<boolean> - Whether the pause was successful
   */
  async pauseDownload(url: string): Promise<boolean> {
    const download = this.activeDownloads.get(url);
    if (!download) {
      return false;
    }

    try {
      await download.savable();
      return true;
    } catch (error) {
      console.error('Failed to pause download:', error);
      return false;
    }
  }

  /**
   * Resumes a paused download
   * @param url - The URL of the download to resume
   * @param options - Download options
   * @returns Promise<DownloadResult> - Download result
   */
  async resumeDownload(
    url: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    const download = this.activeDownloads.get(url);
    if (!download) {
      return {
        success: false,
        error: 'No active download found for this URL',
      };
    }

    try {
      // Create a new download resumable with progress tracking
      const resumePromise = download.resumeAsync();
      const timeoutPromise = options.timeout
        ? new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Resume timeout')),
              options.timeout
            )
          )
        : null;

      const downloadResult = timeoutPromise
        ? await Promise.race([resumePromise, timeoutPromise])
        : await resumePromise;

      if (!downloadResult) {
        return {
          success: false,
          error: 'Resume failed - no result returned',
        };
      }

      // Remove from active downloads
      this.activeDownloads.delete(url);

      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri, {
        size: true,
      });

      const details: DownloadDetails = {
        localUri: downloadResult.uri,
        fileName: this.extractFileNameFromUrl(url),
        fileSize: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        mimeType: this.guessMimeType(this.extractFileNameFromUrl(url)),
        downloadDate: new Date(),
        originalUrl: url,
      };

      return {
        success: true,
        details,
      };
    } catch (error) {
      console.error('Failed to resume download:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown resume error',
      };
    }
  }

  /**
   * Cancels an active download
   * @param url - The URL of the download to cancel
   * @returns Promise<boolean> - Whether the cancellation was successful
   */
  async cancelDownload(url: string): Promise<boolean> {
    const download = this.activeDownloads.get(url);
    if (!download) {
      return false;
    }

    try {
      await download.cancelAsync();
      this.activeDownloads.delete(url);
      return true;
    } catch (error) {
      console.error('Failed to cancel download:', error);
      return false;
    }
  }

  /**
   * Gets information about a downloaded file
   * @param localUri - The local URI of the file
   * @returns Promise<DownloadDetails | null> - File details or null if not found
   */
  async getFileInfo(localUri: string): Promise<DownloadDetails | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri, {
        size: true,
      });

      if (!fileInfo.exists) {
        return null;
      }

      return {
        localUri,
        fileName: this.extractFileNameFromPath(localUri),
        fileSize: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        mimeType: this.guessMimeType(this.extractFileNameFromPath(localUri)),
        downloadDate: new Date(fileInfo.modificationTime || Date.now()),
        originalUrl: '', // We don't store this, so it's empty
      };
    } catch (error) {
      console.error('Failed to get file info:', error);
      return null;
    }
  }

  /**
   * Lists all downloaded files
   * @returns Promise<DownloadDetails[]> - Array of downloaded file details
   */
  async listDownloadedFiles(): Promise<DownloadDetails[]> {
    try {
      await this.initialize();

      const files = await FileSystem.readDirectoryAsync(
        this.downloadsDirectory
      );
      const fileDetails: DownloadDetails[] = [];

      for (const fileName of files) {
        const localUri = `${this.downloadsDirectory}${fileName}`;
        const fileInfo = await this.getFileInfo(localUri);
        if (fileInfo) {
          fileDetails.push(fileInfo);
        }
      }

      return fileDetails;
    } catch (error) {
      console.error('Failed to list downloaded files:', error);
      return [];
    }
  }

  /**
   * Deletes a downloaded file
   * @param localUri - The local URI of the file to delete
   * @returns Promise<boolean> - Whether the deletion was successful
   */
  async deleteFile(localUri: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(localUri);
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Clears all downloaded files
   * @returns Promise<boolean> - Whether the operation was successful
   */
  async clearAllDownloads(): Promise<boolean> {
    try {
      await this.initialize();

      await FileSystem.deleteAsync(this.downloadsDirectory, {
        idempotent: true,
      });
      await this.ensureDownloadsDirectory();
      return true;
    } catch (error) {
      console.error('Failed to clear downloads:', error);
      return false;
    }
  }

  /**
   * Gets the total size of all downloaded files
   * @returns Promise<number> - Total size in bytes
   */
  async getTotalDownloadSize(): Promise<number> {
    try {
      const files = await this.listDownloadedFiles();
      return files.reduce((total, file) => total + file.fileSize, 0);
    } catch (error) {
      console.error('Failed to get total download size:', error);
      return 0;
    }
  }

  /**
   * Checks if a download is active
   * @param url - The URL to check
   * @returns boolean - Whether the download is active
   */
  isDownloadActive(url: string): boolean {
    return this.activeDownloads.has(url);
  }

  /**
   * Gets all active download URLs
   * @returns string[] - Array of active download URLs
   */
  getActiveDownloads(): string[] {
    return Array.from(this.activeDownloads.keys());
  }

  /**
   * Cleans up any stale downloads (call this periodically)
   */
  cleanupStaleDownloads(): void {
    // Remove any downloads that might be stuck
    this.activeDownloads.clear();
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private extractFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop();

      if (fileName && fileName.includes('.')) {
        return fileName;
      }

      // Fallback: generate filename with timestamp
      const timestamp = Date.now();
      const extension = this.guessFileExtension(url);
      return `download_${timestamp}${extension}`;
    } catch {
      // Fallback: generate filename with timestamp
      const timestamp = Date.now();
      return `download_${timestamp}`;
    }
  }

  private extractFileNameFromPath(path: string): string {
    return path.split('/').pop() || 'unknown';
  }

  private guessFileExtension(url: string): string {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('.mp3')) return '.mp3';
    if (urlLower.includes('.mp4')) return '.mp4';
    if (urlLower.includes('.pdf')) return '.pdf';
    if (urlLower.includes('.txt')) return '.txt';
    if (urlLower.includes('.json')) return '.json';
    if (urlLower.includes('.xml')) return '.xml';
    if (urlLower.includes('.zip')) return '.zip';
    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) return '.jpg';
    if (urlLower.includes('.png')) return '.png';
    if (urlLower.includes('.gif')) return '.gif';
    if (urlLower.includes('.webp')) return '.webp';

    return '';
  }

  private guessMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();

    switch (extension) {
      case 'mp3':
        return 'audio/mpeg';
      case 'mp4':
        return 'video/mp4';
      case 'pdf':
        return 'application/pdf';
      case 'txt':
        return 'text/plain';
      case 'json':
        return 'application/json';
      case 'xml':
        return 'application/xml';
      case 'zip':
        return 'application/zip';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'application/octet-stream';
    }
  }
}

export default DownloadService;
