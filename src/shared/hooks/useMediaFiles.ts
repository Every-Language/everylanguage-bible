import { useState, useEffect, useCallback } from 'react';
import {
  mediaFilesService,
  MediaFileFilters,
  MediaFileSort,
} from '../services/database/MediaFilesService';
import { LocalMediaFile } from '../services/database/schema';

export const useMediaFiles = (
  filters: MediaFileFilters = {},
  sort?: MediaFileSort
) => {
  const [mediaFiles, setMediaFiles] = useState<LocalMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMediaFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const files = await mediaFilesService.getMediaFiles(filters, sort);
      setMediaFiles(files);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load media files'
      );
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  useEffect(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  const refresh = useCallback(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  return {
    mediaFiles,
    loading,
    error,
    refresh,
  };
};

export const useMediaFile = (id: string) => {
  const [mediaFile, setMediaFile] = useState<LocalMediaFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMediaFile = useCallback(async () => {
    if (!id) {
      setMediaFile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const file = await mediaFilesService.getMediaFileById(id);
      setMediaFile(file);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load media file'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMediaFile();
  }, [loadMediaFile]);

  const updateMediaFile = useCallback(
    async (updates: Partial<LocalMediaFile>) => {
      if (!id) return;

      try {
        setError(null);
        await mediaFilesService.updateMediaFile(id, updates);
        setMediaFile(prev => (prev ? { ...prev, ...updates } : null));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update media file'
        );
      }
    },
    [id]
  );

  const deleteMediaFile = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      await mediaFilesService.deleteMediaFile(id);
      setMediaFile(prev =>
        prev ? { ...prev, deleted_at: new Date().toISOString() } : null
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete media file'
      );
    }
  }, [id]);

  const restoreMediaFile = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      await mediaFilesService.restoreMediaFile(id);
      setMediaFile(prev => (prev ? { ...prev, deleted_at: null } : null));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to restore media file'
      );
    }
  }, [id]);

  const refresh = useCallback(() => {
    loadMediaFile();
  }, [loadMediaFile]);

  return {
    mediaFile,
    loading,
    error,
    updateMediaFile,
    deleteMediaFile,
    restoreMediaFile,
    refresh,
  };
};

export const useMediaFilesByChapter = (chapterId: string) => {
  const [mediaFiles, setMediaFiles] = useState<LocalMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMediaFiles = useCallback(async () => {
    if (!chapterId) {
      setMediaFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const files = await mediaFilesService.getMediaFilesByChapterId(chapterId);
      setMediaFiles(files);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load media files'
      );
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  const refresh = useCallback(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  return {
    mediaFiles,
    loading,
    error,
    refresh,
  };
};

export const useMediaFilesByLanguage = (languageEntityId: string) => {
  const [mediaFiles, setMediaFiles] = useState<LocalMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMediaFiles = useCallback(async () => {
    if (!languageEntityId) {
      setMediaFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const files =
        await mediaFilesService.getMediaFilesByLanguageEntityId(
          languageEntityId
        );
      setMediaFiles(files);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load media files'
      );
    } finally {
      setLoading(false);
    }
  }, [languageEntityId]);

  useEffect(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  const refresh = useCallback(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  return {
    mediaFiles,
    loading,
    error,
    refresh,
  };
};

export const useMediaFilesByUploadStatus = (uploadStatus: string) => {
  const [mediaFiles, setMediaFiles] = useState<LocalMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMediaFiles = useCallback(async () => {
    if (!uploadStatus) {
      setMediaFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const files =
        await mediaFilesService.getMediaFilesByUploadStatus(uploadStatus);
      setMediaFiles(files);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load media files'
      );
    } finally {
      setLoading(false);
    }
  }, [uploadStatus]);

  useEffect(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  const refresh = useCallback(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  return {
    mediaFiles,
    loading,
    error,
    refresh,
  };
};

export const useMediaFilesByPublishStatus = (publishStatus: string) => {
  const [mediaFiles, setMediaFiles] = useState<LocalMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMediaFiles = useCallback(async () => {
    if (!publishStatus) {
      setMediaFiles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const files =
        await mediaFilesService.getMediaFilesByPublishStatus(publishStatus);
      setMediaFiles(files);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load media files'
      );
    } finally {
      setLoading(false);
    }
  }, [publishStatus]);

  useEffect(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  const refresh = useCallback(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  return {
    mediaFiles,
    loading,
    error,
    refresh,
  };
};
