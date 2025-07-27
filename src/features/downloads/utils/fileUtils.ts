export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getTotalFileSize = (files: unknown[]): number => {
  if (!files || files.length === 0) return 0;

  return files.reduce((total: number, file) => {
    const fileObj = file as { file_size?: number };
    return total + (fileObj.file_size || 0);
  }, 0);
};

/**
 * Check if a file is an audio file based on its extension
 */
export const isAudioFile = (fileName: string): boolean => {
  const audioExtensions = ['.mp3', '.m4a', '.wav', '.aac', '.ogg', '.flac'];
  const lowerFileName = fileName.toLowerCase();
  return audioExtensions.some(ext => lowerFileName.endsWith(ext));
};
