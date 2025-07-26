import { useState, useCallback } from 'react';
import { supabase } from '@/shared/services/api/supabase';
import { logger } from '@/shared/utils/logger';

interface MediaFile {
  id: string;
  start_verse_id: string | null;
  version: number | null;
  remote_path: string | null;
  file_size: number | null;
  deleted_at: string | null;
  [key: string]: unknown;
}

interface MediaSearchState {
  isSearching: boolean;
  searchResults: MediaFile[];
  searchError: string | null;
}

export const useMediaSearch = () => {
  const [state, setState] = useState<MediaSearchState>({
    isSearching: false,
    searchResults: [],
    searchError: null,
  });

  const searchMediaFiles = useCallback(
    async (chapterId: string, versionId?: string | number) => {
      const VERSION_ID = 1;
      const targetVersion = Number(versionId) || VERSION_ID;

      setState(prev => ({
        ...prev,
        isSearching: true,
        searchError: null,
      }));

      logger.info(
        `Searching for media files with chapterId: ${chapterId}, version: ${targetVersion}`
      );

      try {
        // First search attempt
        const { data: firstSearchData, error: firstError } = await supabase
          .from('media_files')
          .select('*')
          .ilike('start_verse_id', `${chapterId}%`)
          .eq('version', targetVersion)
          .is('deleted_at', null);

        if (firstError) {
          throw firstError;
        }

        // If first search found results, use them
        if (firstSearchData && firstSearchData.length > 0) {
          setState(prev => ({
            ...prev,
            searchResults: firstSearchData,
            isSearching: false,
          }));
          logger.info(
            `Found ${firstSearchData.length} media files for chapter ${chapterId} on first search`
          );
          return firstSearchData;
        }

        // If no results found, perform second search with same logic
        logger.info(
          'No media files found on first search, performing second search...'
        );

        const { data: secondSearchData, error: secondError } = await supabase
          .from('media_files')
          .select('*')
          .ilike('start_verse_id', `${chapterId}%`)
          .eq('version', targetVersion)
          .is('deleted_at', null);

        if (secondError) {
          throw secondError;
        }

        setState(prev => ({
          ...prev,
          searchResults: secondSearchData || [],
          isSearching: false,
        }));
        logger.info(
          `Found ${secondSearchData?.length || 0} media files for chapter ${chapterId} on second search`
        );
        return secondSearchData || [];
      } catch (error) {
        logger.error('Error searching media files:', error);
        setState(prev => ({
          ...prev,
          searchError: 'Failed to search for media files',
          searchResults: [],
          isSearching: false,
        }));
        return [];
      }
    },
    []
  );

  const clearSearchResults = useCallback(() => {
    setState({
      isSearching: false,
      searchResults: [],
      searchError: null,
    });
  }, []);

  return {
    ...state,
    searchMediaFiles,
    clearSearchResults,
  };
};
