import { useState, useEffect, useCallback } from 'react';
import { mediaFilesVersesService } from '../services/database/MediaFilesVersesService';
import type { LocalMediaFileVerse } from '../services/database/schema';
import { logger } from '../utils/logger';

export interface UseMediaFilesVersesOptions {
  mediaFileId?: string;
  verseId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseMediaFilesVersesReturn {
  mediaFilesVerses: LocalMediaFileVerse[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addMediaFileVerse: (
    mediaFileVerse: Omit<
      LocalMediaFileVerse,
      'created_at' | 'updated_at' | 'synced_at'
    >
  ) => Promise<void>;
  updateMediaFileVerse: (
    id: string,
    updates: Partial<
      Omit<LocalMediaFileVerse, 'id' | 'created_at' | 'synced_at'>
    >
  ) => Promise<void>;
  deleteMediaFileVerse: (id: string) => Promise<void>;
  deleteByMediaFileId: (mediaFileId: string) => Promise<void>;
  deleteByVerseId: (verseId: string) => Promise<void>;
}

export function useMediaFilesVerses(
  options: UseMediaFilesVersesOptions = {}
): UseMediaFilesVersesReturn {
  const {
    mediaFileId,
    verseId,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [mediaFilesVerses, setMediaFilesVerses] = useState<
    LocalMediaFileVerse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMediaFilesVerses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: LocalMediaFileVerse[];

      if (mediaFileId) {
        data =
          await mediaFilesVersesService.getMediaFilesVersesByMediaFileId(
            mediaFileId
          );
      } else if (verseId) {
        data =
          await mediaFilesVersesService.getMediaFilesVersesByVerseId(verseId);
      } else {
        data = await mediaFilesVersesService.getAllMediaFilesVerses();
      }

      setMediaFilesVerses(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch media files verses';
      setError(errorMessage);
      logger.error('Error fetching media files verses:', err);
    } finally {
      setLoading(false);
    }
  }, [mediaFileId, verseId]);

  const refresh = useCallback(async () => {
    await fetchMediaFilesVerses();
  }, [fetchMediaFilesVerses]);

  const addMediaFileVerse = useCallback(
    async (
      mediaFileVerse: Omit<
        LocalMediaFileVerse,
        'created_at' | 'updated_at' | 'synced_at'
      >
    ) => {
      try {
        await mediaFilesVersesService.saveMediaFileVerse(mediaFileVerse);
        await refresh();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add media file verse';
        setError(errorMessage);
        throw err;
      }
    },
    [refresh]
  );

  const updateMediaFileVerse = useCallback(
    async (
      id: string,
      updates: Partial<
        Omit<LocalMediaFileVerse, 'id' | 'created_at' | 'synced_at'>
      >
    ) => {
      try {
        await mediaFilesVersesService.updateMediaFileVerse(id, updates);
        await refresh();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update media file verse';
        setError(errorMessage);
        throw err;
      }
    },
    [refresh]
  );

  const deleteMediaFileVerse = useCallback(
    async (id: string) => {
      try {
        await mediaFilesVersesService.deleteMediaFileVerse(id);
        await refresh();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to delete media file verse';
        setError(errorMessage);
        throw err;
      }
    },
    [refresh]
  );

  const deleteByMediaFileId = useCallback(
    async (mediaFileId: string) => {
      try {
        await mediaFilesVersesService.deleteMediaFilesVersesByMediaFileId(
          mediaFileId
        );
        await refresh();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to delete media files verses by media file ID';
        setError(errorMessage);
        throw err;
      }
    },
    [refresh]
  );

  const deleteByVerseId = useCallback(
    async (verseId: string) => {
      try {
        await mediaFilesVersesService.deleteMediaFilesVersesByVerseId(verseId);
        await refresh();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to delete media files verses by verse ID';
        setError(errorMessage);
        throw err;
      }
    },
    [refresh]
  );

  // Initial fetch
  useEffect(() => {
    fetchMediaFilesVerses();
  }, [fetchMediaFilesVerses]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMediaFilesVerses();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMediaFilesVerses]);

  return {
    mediaFilesVerses,
    loading,
    error,
    refresh,
    addMediaFileVerse,
    updateMediaFileVerse,
    deleteMediaFileVerse,
    deleteByMediaFileId,
    deleteByVerseId,
  };
}

// Hook for a single media file verse
export function useMediaFileVerse(id: string) {
  const [mediaFileVerse, setMediaFileVerse] =
    useState<LocalMediaFileVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMediaFileVerse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mediaFilesVersesService.getMediaFileVerse(id);
      setMediaFileVerse(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch media file verse';
      setError(errorMessage);
      logger.error('Error fetching media file verse:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateMediaFileVerse = useCallback(
    async (
      updates: Partial<
        Omit<LocalMediaFileVerse, 'id' | 'created_at' | 'synced_at'>
      >
    ) => {
      try {
        await mediaFilesVersesService.updateMediaFileVerse(id, updates);
        await fetchMediaFileVerse();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update media file verse';
        setError(errorMessage);
        throw err;
      }
    },
    [id, fetchMediaFileVerse]
  );

  const deleteMediaFileVerse = useCallback(async () => {
    try {
      await mediaFilesVersesService.deleteMediaFileVerse(id);
      setMediaFileVerse(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to delete media file verse';
      setError(errorMessage);
      throw err;
    }
  }, [id]);

  useEffect(() => {
    fetchMediaFileVerse();
  }, [fetchMediaFileVerse]);

  return {
    mediaFileVerse,
    loading,
    error,
    refresh: fetchMediaFileVerse,
    updateMediaFileVerse,
    deleteMediaFileVerse,
  };
}

// Hook for media files verses with related data
export function useMediaFilesVersesWithRelatedData(mediaFileId?: string) {
  const [data, setData] = useState<LocalMediaFileVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result =
        await mediaFilesVersesService.getMediaFilesVersesWithRelatedData(
          mediaFileId
        );
      setData(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch media files verses with related data';
      setError(errorMessage);
      logger.error('Error fetching media files verses with related data:', err);
    } finally {
      setLoading(false);
    }
  }, [mediaFileId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}
